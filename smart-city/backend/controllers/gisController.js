const fs = require('fs');
const path = require('path');
const Complaint = require('../models/Complaint');
const mongoose = require('mongoose');
const {
  detectWard,
  getAllWards,
  getWardById,
  getWardHealthStatus,
  calculateHeatmapWeight,
} = require('../utils/geoUtils');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Load national boundaries data
const nationalData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/national_hierarchy_boundaries.json'), 'utf8'));

/**
  * GET /api/gis/wards
  * Handles hierarchical boundary retrieval (National -> State -> District -> Local Body -> Ward)
  */
const getWards = async (req, res) => {
  try {
    const level = req.query.level || 'LOCAL_BODY';
    const parentCode = req.query.parentCode;

    if (level === 'NATIONAL') {
      // State boundaries
      const states = nationalData.states.map((state) => {
        const code = state.properties.code;
        return {
          id: state.properties.id,
          name: state.properties.name,
          number: code,
          level: 'STATE',
          boundary: state.geometry,
          stats: { total: 150, open: 35, resolved: 115, escalated: 4, slaCompliance: 76, avgResolutionHours: 32 },
          health: 'moderate',
        };
      });
      return res.status(200).json({ success: true, data: states });
    }

    if (level === 'STATE') {
      // Districts in state
      const districts = nationalData.districts
        .filter((d) => !parentCode || d.properties.stateCode === parentCode)
        .map((d) => ({
          id: d.properties.id,
          name: d.properties.name,
          number: d.properties.code,
          level: 'DISTRICT',
          boundary: d.geometry,
          stats: { total: 60, open: 15, resolved: 45, escalated: 1, slaCompliance: 75, avgResolutionHours: 24 },
          health: 'healthy',
        }));
      return res.status(200).json({ success: true, data: districts });
    }

    if (level === 'DISTRICT') {
      // Local bodies in district
      const localBodies = nationalData.localBodies
        .filter((lb) => !parentCode || lb.properties.districtCode === parentCode)
        .map((lb) => ({
          id: lb.properties.id,
          name: lb.properties.name,
          number: lb.properties.id,
          level: 'LOCAL_BODY',
          boundary: lb.geometry,
          stats: { total: 30, open: 8, resolved: 22, escalated: 0, slaCompliance: 80, avgResolutionHours: 18 },
          health: 'healthy',
        }));
      return res.status(200).json({ success: true, data: localBodies });
    }

    // Default: LOCAL_BODY -> Ward level
    const wards = getAllWards();
    const wardStats = await Promise.all(
      wards.map(async (ward) => {
        let stats = { total: 0, open: 0, resolved: 0, escalated: 0, slaCompliance: 100, avgResolutionHours: 0 };

        if (isDbConnected()) {
          const complaints = await Complaint.find({ 'hierarchy.wardId': ward.id }).lean();
          stats.total = complaints.length;
          stats.open = complaints.filter((c) => c.status !== 'Resolved').length;
          stats.resolved = complaints.filter((c) => c.status === 'Resolved').length;
          stats.escalated = complaints.filter((c) => c.isEscalated).length;

          const resolvedWithDates = complaints.filter((c) => c.status === 'Resolved' && c.resolutionDate && c.createdAt);
          if (resolvedWithDates.length > 0) {
            const totalHours = resolvedWithDates.reduce((sum, c) => {
              return sum + (new Date(c.resolutionDate) - new Date(c.createdAt)) / 3600000;
            }, 0);
            stats.avgResolutionHours = Math.round(totalHours / resolvedWithDates.length);
          }

          if (stats.total > 0) {
            stats.slaCompliance = Math.round((stats.resolved / stats.total) * 100);
          }
        } else {
          // Seed fallback counts for visualization when DB disconnected
          const suffixNum = ward.number.charCodeAt(2) || 0;
          stats.total = 10 + (suffixNum % 15);
          stats.open = 2 + (suffixNum % 6);
          stats.resolved = stats.total - stats.open;
          stats.slaCompliance = Math.round((stats.resolved / stats.total) * 100);
        }

        return {
          id: ward.id,
          name: ward.name,
          number: ward.number,
          zone: ward.zone,
          district: ward.district,
          boundary: ward.boundary,
          stats,
          health: getWardHealthStatus(stats.open),
        };
      })
    );

    return res.status(200).json({ success: true, data: wardStats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/gis/wards/:wardId/complaints
 */
const getWardComplaints = async (req, res) => {
  try {
    const { wardId } = req.params;
    const ward = getWardById(wardId);
    if (!ward) {
      return res.status(404).json({ success: false, error: 'Ward not found' });
    }

    let complaints = [];
    if (isDbConnected()) {
      complaints = await Complaint.find({ 'hierarchy.wardId': wardId })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Mock complaints for offline preview
      const date = new Date();
      complaints = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          complaintCode: `CP-MOCK-${wardId}-1`,
          title: 'Garbage heap accumulated near bus stop',
          category: 'Sanitation',
          status: 'Pending',
          location: '12th Main, Opp Post Office',
          reportCount: 3,
          isEscalated: false,
          createdAt: new Date(date.getTime() - 3600000 * 2),
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          complaintCode: `CP-MOCK-${wardId}-2`,
          title: 'Street lights flickering at intersection',
          category: 'Electrical',
          status: 'In Progress',
          location: 'Koramangala Ring Road',
          reportCount: 1,
          isEscalated: false,
          createdAt: new Date(date.getTime() - 3600000 * 12),
        },
      ];
    }

    return res.status(200).json({
      success: true,
      ward: { id: ward.id, name: ward.name, number: ward.number, zone: ward.zone },
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/gis/heatmap
 */
const getHeatmapData = async (req, res) => {
  try {
    const { category, status, priority } = req.query;
    let complaints = [];

    if (isDbConnected()) {
      const query = {
        latitude: { $ne: null },
        longitude: { $ne: null },
      };
      if (category && category !== 'All') query.category = category;
      if (status && status !== 'All') query.status = status;
      complaints = await Complaint.find(query)
        .select('latitude longitude category reportCount status')
        .lean();
    } else {
      // Heatmap fallback points in Bengaluru
      complaints = [
        { latitude: 12.9352, longitude: 77.6245, category: 'Sanitation', reportCount: 4, status: 'Pending' },
        { latitude: 12.9401, longitude: 77.6198, category: 'Roads', reportCount: 1, status: 'In Progress' },
        { latitude: 12.9716, longitude: 77.5946, category: 'Water Department', reportCount: 5, status: 'Pending' },
      ];
    }

    const heatmapPoints = complaints.map((c) => ({
      lat: c.latitude,
      lng: c.longitude,
      weight: calculateHeatmapWeight(priority || 'Medium', c.reportCount || 1),
      category: c.category,
    }));

    return res.status(200).json({ success: true, count: heatmapPoints.length, data: heatmapPoints });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/gis/clusters
 */
const getClusterData = async (req, res) => {
  try {
    const { category, status, priority, bounds } = req.query;
    let complaints = [];

    if (isDbConnected()) {
      const query = {
        latitude: { $ne: null },
        longitude: { $ne: null },
      };
      if (category && category !== 'All') query.category = category;
      if (status && status !== 'All') query.status = status;

      if (bounds) {
        const [south, west, north, east] = bounds.split(',').map(Number);
        query.latitude = { $gte: south, $lte: north };
        query.longitude = { $gte: west, $lte: east };
      }

      complaints = await Complaint.find(query)
        .select('_id complaintCode title category status latitude longitude location reportCount isEscalated ward createdAt')
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
    } else {
      // Mock clusters for offline presentation
      complaints = [
        {
          _id: 'c1',
          complaintCode: 'CP-MOCK-1',
          title: 'Major water leakage from supply pipe',
          category: 'Water Department',
          status: 'Pending',
          latitude: 12.9360,
          longitude: 77.6250,
          location: 'Koramangala 3rd Block',
          reportCount: 6,
          isEscalated: true,
          ward: { id: 'ward-150', name: 'Koramangala', number: 'W-150' },
          createdAt: new Date(),
        },
        {
          _id: 'c2',
          complaintCode: 'CP-MOCK-2',
          title: 'Garbage dump pile at corner street',
          category: 'Sanitation',
          status: 'In Progress',
          latitude: 12.9180,
          longitude: 77.5800,
          location: 'Jayanagar 4th Block',
          reportCount: 2,
          isEscalated: false,
          ward: { id: 'ward-163', name: 'Jayanagar', number: 'W-163' },
          createdAt: new Date(),
        },
      ];
    }

    const markers = complaints.map((c) => ({
      id: c._id,
      code: c.complaintCode,
      title: c.title,
      category: c.category,
      status: c.status,
      lat: c.latitude,
      lng: c.longitude,
      location: c.location,
      reportCount: c.reportCount || 1,
      isEscalated: c.isEscalated || false,
      ward: c.ward || null,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({ success: true, count: markers.length, data: markers });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/gis/detect-ward
 */
const detectWardFromCoords = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    const ward = detectWard(lat, lng);
    if (!ward) {
      return res.status(200).json({
        success: true,
        found: false,
        message: 'Coordinates do not fall within any registered ward',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      found: true,
      data: {
        ward: { id: ward.id, name: ward.name, number: ward.number },
        zone: ward.zone,
        district: ward.district,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/gis/activity-feed
 */
const getActivityFeed = async (req, res) => {
  try {
    let events = [];

    if (isDbConnected()) {
      const recentComplaints = await Complaint.find()
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('_id complaintCode title category status location ward isEscalated updatedAt createdAt statusHistory')
        .lean();

      events = recentComplaints.map((c) => {
        const lastHistory = c.statusHistory && c.statusHistory.length > 0
          ? c.statusHistory[c.statusHistory.length - 1]
          : null;

        let eventType = 'created';
        if (c.isEscalated) eventType = 'escalated';
        else if (c.status === 'Resolved') eventType = 'resolved';
        else if (c.status === 'In Progress') eventType = 'in_progress';
        else if (lastHistory && lastHistory.note && lastHistory.note.includes('Status changed')) eventType = 'updated';

        return {
          id: c._id,
          code: c.complaintCode,
          title: c.title,
          category: c.category,
          status: c.status,
          location: c.location,
          ward: c.ward || null,
          type: eventType,
          timestamp: c.updatedAt || c.createdAt,
          note: lastHistory ? lastHistory.note : 'Complaint registered',
        };
      });
    } else {
      // Mock feed
      events = [
        {
          id: 'c1',
          code: 'CP-MOCK-1',
          title: 'Major water leakage from supply pipe',
          category: 'Water Department',
          status: 'Pending',
          location: 'Koramangala 3rd Block',
          ward: { name: 'Koramangala' },
          type: 'escalated',
          timestamp: new Date(),
          note: 'Escalated to board due to SLA breach',
        },
        {
          id: 'c2',
          code: 'CP-MOCK-2',
          title: 'Garbage dump pile at corner street',
          category: 'Sanitation',
          status: 'In Progress',
          location: 'Jayanagar 4th Block',
          ward: { name: 'Jayanagar' },
          type: 'in_progress',
          timestamp: new Date(Date.now() - 300000),
          note: 'Work order allocated to Jayanagar division inspector',
        },
      ];
    }

    return res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getWards,
  getWardComplaints,
  getHeatmapData,
  getClusterData,
  detectWardFromCoords,
  getActivityFeed,
};
