const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const {
  computeComplaintSimilarity,
  autoCategorizeML,
  SIMILARITY_THRESHOLD,
  detectFakeComplaint,
} = require('../utils/similarity');
const { hasCloudinary } = require('../config/cloudinary');
const { sendStatusNotification } = require('../utils/notificationService');
const { sendStatusUpdateEmail } = require('../utils/mailer');
const { detectWard } = require('../utils/geoUtils');
const Tenant = require('../models/Tenant');
const AuditLog = require('../models/AuditLog');

const DEPARTMENT_MAPPING = {
  Sanitation: 'Public Health & Sanitation Department',
  Roads: 'Public Works & Infrastructure Department',
  'Water Department': 'Water & Sewerage Department',
  Electrical: 'Electricity & Power Department',
  General: 'General Administration Department',
};

const isDbConnected = () => mongoose.connection.readyState === 1;
const inMemoryComplaints = [];

let ioRef = null;
const setSocket = (io) => {
  ioRef = io;
};

const emitComplaintUpdate = (complaint) => {
  if (!ioRef) return;
  ioRef.to(`complaint:${complaint._id}`).emit('complaint:update', complaint);
  ioRef.emit('map:complaint:updated', complaint);
  
  if (complaint.status === 'Resolved') {
    ioRef.emit('map:complaint:resolved', complaint);
  }
  
  // Also emit feed event
  let eventType = 'updated';
  if (complaint.isEscalated) eventType = 'escalated';
  else if (complaint.status === 'Resolved') eventType = 'resolved';
  else if (complaint.status === 'In Progress') eventType = 'in_progress';
  
  ioRef.emit('feed:event', {
    id: complaint._id,
    code: complaint.complaintCode,
    title: complaint.title,
    category: complaint.category,
    status: complaint.status,
    location: complaint.location,
    ward: complaint.ward || null,
    type: eventType,
    timestamp: complaint.updatedAt || new Date(),
    note: complaint.statusHistory && complaint.statusHistory.length > 0
      ? complaint.statusHistory[complaint.statusHistory.length - 1].note
      : `Status updated to ${complaint.status}`,
  });
};

const makeComplaintCode = () => `CP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
const makeMemoryId = () => new mongoose.Types.ObjectId().toString();

const applyFilters = (items, { category, status, department, location }) => items.filter((item) => {
  if (category && category !== 'All' && item.category !== category) return false;
  if (status && status !== 'All' && item.status !== status) return false;
  if (department && department !== 'All' && item.assignedDept !== department) return false;
  if (location && location !== 'All' && item.location !== location) return false;
  return true;
});

const createComplaint = async (req, res) => {
  try {
    const { title, description, location, reporterName, reporterContact, latitude, longitude } = req.body;
    if (!title || !description || !location || !reporterName || !reporterContact) {
      return res.status(400).json({ success: false, error: 'title, description, location, reporterName and reporterContact are required' });
    }

    const { category, confidence, scores } = autoCategorizeML(`${title} ${description}`);
    const fakeCheck = detectFakeComplaint(title, description, reporterName, reporterContact);
    const imageUrl = req.file && hasCloudinary && req.file.path ? req.file.path : '';

    const openComplaints = isDbConnected()
      ? await Complaint.find({
          category,
        }).lean()
      : inMemoryComplaints.filter((c) => c.category === category);

    const incoming = { title, description, category, location };
    let bestMatch = null;
    let bestScore = 0;
    for (const existing of openComplaints) {
      const score = computeComplaintSimilarity(incoming, existing);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = existing;
      }
    }

    if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
      const alreadyReported = bestMatch.reporters.some((r) => r.contact === reporterContact);
      if (alreadyReported) {
        const original = isDbConnected()
          ? await Complaint.findById(bestMatch._id)
          : inMemoryComplaints.find((c) => c._id === bestMatch._id);
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          alreadyReported: true,
          similarityScore: bestScore,
          data: original,
          message: 'You have already reported this complaint.',
        });
      }

      let updated;
      if (isDbConnected()) {
        updated = await Complaint.findByIdAndUpdate(
          bestMatch._id,
          {
            $push: { reporters: { name: reporterName, contact: reporterContact } },
            $inc: { reportCount: 1 },
            ...(imageUrl && !bestMatch.imageUrl ? { imageUrl } : {}),
          },
          { new: true }
        );
      } else {
        const index = inMemoryComplaints.findIndex((c) => c._id === bestMatch._id);
        inMemoryComplaints[index].reporters.push({ name: reporterName, contact: reporterContact, reportedAt: new Date() });
        inMemoryComplaints[index].reportCount += 1;
        if (imageUrl && !inMemoryComplaints[index].imageUrl) inMemoryComplaints[index].imageUrl = imageUrl;
        updated = inMemoryComplaints[index];
      }

      emitComplaintUpdate(updated);
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        alreadyReported: false,
        similarityScore: Number(bestScore.toFixed(2)),
        data: updated,
        message: `Merged with existing complaint (${Math.round(bestScore * 100)}% match).`,
      });
    }

    let detectedWardInfo = null;
    const latNum = latitude != null ? parseFloat(latitude) : null;
    const lngNum = longitude != null ? parseFloat(longitude) : null;
    if (latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum)) {
      detectedWardInfo = detectWard(latNum, lngNum);
    }

    const tenantCode = req.tenantCode || 'BBMP';
    // Access Map or dynamic JS object rules
    const slaHours = req.tenant?.slaRules instanceof Map 
      ? (req.tenant.slaRules.get(category) || 24)
      : (req.tenant?.slaRules?.[category] || 24);
    const dueAt = new Date(Date.now() + slaHours * 3600000);

    const complaintData = {
      complaintCode: makeComplaintCode(),
      title,
      description,
      category,
      location,
      imageUrl,
      mlConfidence: confidence,
      mlScores: scores,
      reporters: [{ name: reporterName, contact: reporterContact, reportedAt: new Date() }],
      reportCount: 1,
      latitude: latNum && !isNaN(latNum) ? latNum : null,
      longitude: lngNum && !isNaN(lngNum) ? lngNum : null,
      coordinates: latNum && lngNum && !isNaN(latNum) && !isNaN(lngNum)
        ? { type: 'Point', coordinates: [lngNum, latNum] }
        : undefined,
      tenantCode,
      hierarchy: {
        state: 'KA',
        district: 'Bengaluru Urban',
        localBody: tenantCode,
        zone: detectedWardInfo ? detectedWardInfo.zone : 'South',
        ward: detectedWardInfo ? detectedWardInfo.name : '',
        wardId: detectedWardInfo ? detectedWardInfo.id : '',
      },
      sla: {
        maxHours: slaHours,
        dueAt: dueAt,
        isBreached: false,
      },
      workflowStep: 'WARD_AUDIT',
      ward: detectedWardInfo ? {
        id: detectedWardInfo.id,
        name: detectedWardInfo.name,
        number: detectedWardInfo.number,
      } : { id: '', name: '', number: '' },
      zone: detectedWardInfo ? detectedWardInfo.zone : '',
      assignedDept: DEPARTMENT_MAPPING[category] || DEPARTMENT_MAPPING.General,
      isFake: fakeCheck.isFake,
      suspicionScore: fakeCheck.score,
      suspicionReasons: fakeCheck.reasons,
      statusHistory: [{ status: 'Pending', note: 'Complaint received', changedBy: 'system', changedAt: new Date() }],
      status: 'Pending',
      feedback: [],
      averageRating: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const complaint = isDbConnected()
      ? await Complaint.create(complaintData)
      : (() => {
          const memoryComplaint = { _id: makeMemoryId(), ...complaintData };
          inMemoryComplaints.unshift(memoryComplaint);
          return memoryComplaint;
        })();

    if (isDbConnected()) {
      await AuditLog.create({
        tenantCode,
        complaintId: complaint._id,
        actor: { name: reporterName, role: 'Citizen' },
        action: 'SUBMITTED',
        description: 'Complaint registered by citizen and pending ward audit',
        gps: latNum && lngNum ? { latitude: latNum, longitude: lngNum } : undefined,
      });
    }

    if (ioRef) {
      ioRef.emit('map:complaint:new', complaint);
      ioRef.emit('feed:event', {
        id: complaint._id,
        code: complaint.complaintCode,
        title: complaint.title,
        category: complaint.category,
        status: complaint.status,
        location: complaint.location,
        ward: complaint.ward || null,
        type: 'created',
        timestamp: complaint.createdAt || new Date(),
        note: 'Complaint registered',
      });
    }

    emitComplaintUpdate(complaint);
    return res.status(201).json({ success: true, isDuplicate: false, data: complaint, message: 'Complaint submitted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getComplaints = async (req, res) => {
  try {
    const { category, status, department, location, sort = '-createdAt' } = req.query;
    let complaints;
    if (isDbConnected()) {
      const query = {};
      if (category && category !== 'All') query.category = category;
      if (status && status !== 'All') query.status = status;
      if (department && department !== 'All') query.assignedDept = department;
      if (location && location !== 'All') query.location = location;
      complaints = await Complaint.find(query).sort(sort).lean();
    } else {
      complaints = applyFilters(inMemoryComplaints, { category, status, department, location });
      complaints = complaints.sort((a, b) => (sort === 'createdAt'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)));
    }
    return res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
//  GET /api/complaints/locations — All distinct locations with stats
// ─────────────────────────────────────────────────────────────────
const getLocations = async (req, res) => {
  try {
    let locations;
    if (isDbConnected()) {
      locations = await Complaint.aggregate([
        {
          $group: {
            _id: '$location',
            total:      { $sum: 1 },
            pending:    { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
            resolved:   { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            categories: { $addToSet: '$category' },
          },
        },
        { $sort: { total: -1 } },
      ]);
      locations = locations.map((l) => ({
        location: l._id,
        total: l.total,
        pending: l.pending,
        inProgress: l.inProgress,
        resolved: l.resolved,
        categories: l.categories.filter(Boolean),
      }));
    } else {
      const locMap = {};
      for (const c of inMemoryComplaints) {
        if (!c.location) continue;
        if (!locMap[c.location]) locMap[c.location] = { location: c.location, total: 0, pending: 0, inProgress: 0, resolved: 0, categories: new Set() };
        locMap[c.location].total += 1;
        if (c.status === 'Pending')     locMap[c.location].pending += 1;
        if (c.status === 'In Progress') locMap[c.location].inProgress += 1;
        if (c.status === 'Resolved')    locMap[c.location].resolved += 1;
        if (c.category) locMap[c.location].categories.add(c.category);
      }
      locations = Object.values(locMap)
        .map((l) => ({ ...l, categories: [...l.categories] }))
        .sort((a, b) => b.total - a.total);
    }
    return res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getComplaint = async (req, res) => {
  try {
    const key = req.params.id;
    const complaint = isDbConnected()
      ? (mongoose.Types.ObjectId.isValid(key)
          ? await Complaint.findById(key)
          : await Complaint.findOne({ complaintCode: key.toUpperCase() }))
      : inMemoryComplaints.find((c) => c._id === key || c.complaintCode === key.toUpperCase());
    if (!complaint) return res.status(404).json({ success: false, error: 'Complaint not found' });
    return res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolution = '', changedBy = 'department' } = req.body;
    const complaint = isDbConnected()
      ? await Complaint.findById(req.params.id)
      : inMemoryComplaints.find((c) => c._id === req.params.id);
    if (!complaint) return res.status(404).json({ success: false, error: 'Complaint not found' });

    complaint.status = status;
    complaint.updatedByDept = true;
    
    // Check if an image was uploaded
    if (req.file && hasCloudinary && req.file.path) {
      complaint.resolvedImageUrl = req.file.path;
    }
    
    if (resolution) complaint.resolution = resolution;
    if (status === 'Resolved') complaint.resolutionDate = new Date();
    complaint.statusHistory.push({ status, note: resolution || `Status changed to ${status}`, changedBy });

    // Progress NammaKasa Workflow Step
    let auditAction = 'WORK_STARTED';
    let auditDesc = `Status updated to ${status} by ${changedBy}`;

    if (status === 'In Progress') {
      complaint.workflowStep = 'WORK_ALLOCATED';
      auditAction = 'ASSIGNED';
      auditDesc = 'Work order approved and assigned to field response unit';
    } else if (status === 'Resolved') {
      complaint.workflowStep = 'DEPT_QA';
      auditAction = 'RESOLVED';
      auditDesc = 'Resolution completed on-site, pending department validation';
    }

    if (isDbConnected()) {
      await complaint.save();
      await AuditLog.create({
        tenantCode: complaint.tenantCode || 'BBMP',
        complaintId: complaint._id,
        actor: { name: changedBy, role: changedBy === 'system' ? 'system' : 'Officer' },
        action: auditAction,
        description: auditDesc,
      });
    } else {
      complaint.updatedAt = new Date();
    }

    await sendStatusNotification(complaint);
    emitComplaintUpdate(complaint);

    // Send Email Notification
    if (complaint.reporters && complaint.reporters.length > 0) {
      for (const r of complaint.reporters) {
        if (r.contact) {
          sendStatusUpdateEmail(r.contact, complaint, status);
        }
      }
    }

    return res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    let result;
    if (isDbConnected()) {
      [result] = await Complaint.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalReports: { $sum: '$reportCount' },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            fakeDetected: { $sum: { $cond: ['$isFake', 1, 0] } },
          },
        },
      ]);
    } else {
      result = {
        total: inMemoryComplaints.length,
        totalReports: inMemoryComplaints.reduce((acc, c) => acc + (c.reportCount || 0), 0),
        pending: inMemoryComplaints.filter((c) => c.status === 'Pending').length,
        inProgress: inMemoryComplaints.filter((c) => c.status === 'In Progress').length,
        resolved: inMemoryComplaints.filter((c) => c.status === 'Resolved').length,
        fakeDetected: inMemoryComplaints.filter((c) => c.isFake).length,
      };
    }
    return res.status(200).json({ success: true, data: result || {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reporterContact, rating, comment } = req.body;
    if (!reporterContact || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Valid reporter contact and rating (1-5) are required' });
    }

    const complaint = isDbConnected()
      ? await Complaint.findById(id)
      : inMemoryComplaints.find((c) => c._id === id);
    if (!complaint) return res.status(404).json({ success: false, error: 'Complaint not found' });
    if (complaint.status !== 'Resolved') return res.status(400).json({ success: false, error: 'Feedback only for resolved complaints' });

    if (complaint.feedback.find((f) => f.reporterContact === reporterContact)) {
      return res.status(400).json({ success: false, error: 'Feedback already submitted for this contact' });
    }

    complaint.feedback.push({ reporterContact, rating, comment });
    const totalRating = complaint.feedback.reduce((sum, f) => sum + f.rating, 0);
    complaint.averageRating = totalRating / complaint.feedback.length;
    if (isDbConnected()) await complaint.save();
    return res.status(200).json({ success: true, message: 'Feedback submitted', data: { averageRating: complaint.averageRating } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const escalateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const complaint = isDbConnected()
      ? await Complaint.findById(id)
      : inMemoryComplaints.find((c) => c._id === id);
      
    if (!complaint) return res.status(404).json({ success: false, error: 'Complaint not found' });
    if (complaint.isEscalated) return res.status(400).json({ success: false, error: 'Already escalated' });

    complaint.isEscalated = true;
    complaint.escalationReason = reason || 'No reason provided';
    complaint.statusHistory.push({ status: complaint.status, note: `Escalated to Higher Authority: ${complaint.escalationReason}`, changedBy: 'citizen', changedAt: new Date() });
    
    if (isDbConnected()) {
      await complaint.save();
      await AuditLog.create({
        tenantCode: complaint.tenantCode || 'BBMP',
        complaintId: complaint._id,
        actor: { name: 'Citizen', role: 'Citizen' },
        action: 'ESCALATED',
        description: `Grievance escalated due to: ${complaint.escalationReason}`,
      });
    } else {
      complaint.updatedAt = new Date();
    }
    
    emitComplaintUpdate(complaint);
    return res.status(200).json({ success: true, message: 'Complaint escalated successfully', data: complaint });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const startSlaChecker = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      if (!isDbConnected()) {
        inMemoryComplaints.forEach((c) => {
          if (c.status !== 'Resolved' && !c.isEscalated && c.sla && c.sla.dueAt && new Date(c.sla.dueAt) < now) {
            c.isEscalated = true;
            if (c.sla) c.sla.isBreached = true;
            c.escalationReason = 'Automated Escalation: SLA target breached.';
            c.statusHistory.push({
              status: c.status,
              note: 'Automated Escalation: SLA target breached.',
              changedBy: 'system',
              changedAt: now,
            });
            emitComplaintUpdate(c);
          }
        });
        return;
      }

      const breachedComplaints = await Complaint.find({
        status: { $ne: 'Resolved' },
        isEscalated: false,
        'sla.dueAt': { $lt: now },
      });

      for (const complaint of breachedComplaints) {
        complaint.isEscalated = true;
        complaint.sla.isBreached = true;
        complaint.escalationReason = 'Automated Escalation: SLA target breached.';
        complaint.statusHistory.push({
          status: complaint.status,
          note: 'Automated Escalation: SLA target breached.',
          changedBy: 'system',
          changedAt: now,
        });
        await complaint.save();

        await AuditLog.create({
          tenantCode: complaint.tenantCode || 'BBMP',
          complaintId: complaint._id,
          actor: { name: 'system', role: 'system' },
          action: 'ESCALATED',
          description: 'Automated Escalation: SLA target breached.',
        });

        emitComplaintUpdate(complaint);
      }
    } catch (e) {
      console.error('SLA Checker background task error:', e);
    }
  }, 10000); // Check every 10 seconds for real-time responsiveness
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  getStats,
  submitFeedback,
  escalateComplaint,
  setSocket,
  getLocations,
  startSlaChecker,
};
