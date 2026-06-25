const turf = require('@turf/helpers');
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const path = require('path');
const fs = require('fs');
const wardsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/wards.geojson'), 'utf8'));

/**
 * Detect which ward a coordinate point falls within.
 * Uses Turf.js point-in-polygon against all ward boundaries.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object|null} Ward info { id, name, number, zone, district } or null
 */
function detectWard(lat, lng) {
  const point = turf.point([lng, lat]);

  for (const feature of wardsData.features) {
    if (booleanPointInPolygon(point, feature)) {
      return {
        id: feature.properties.id,
        name: feature.properties.name,
        number: feature.properties.number,
        zone: feature.properties.zone,
        district: feature.properties.district,
      };
    }
  }
  return null;
}

/**
 * Calculate ward health color based on open complaint count.
 * @param {number} openComplaints - Number of open complaints in the ward
 * @returns {string} Color category: 'healthy', 'moderate', 'high', 'critical'
 */
function getWardHealthStatus(openComplaints) {
  if (openComplaints <= 10) return 'healthy';
  if (openComplaints <= 25) return 'moderate';
  if (openComplaints <= 50) return 'high';
  return 'critical';
}

/**
 * Get all ward boundaries with their GeoJSON data.
 * @returns {Array} Array of ward feature objects
 */
function getAllWards() {
  return wardsData.features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    number: feature.properties.number,
    zone: feature.properties.zone,
    district: feature.properties.district,
    boundary: feature.geometry,
  }));
}

/**
 * Get a single ward by ID.
 * @param {string} wardId - Ward ID (e.g., 'ward-150')
 * @returns {Object|null} Ward info with boundary or null
 */
function getWardById(wardId) {
  const feature = wardsData.features.find(
    (f) => f.properties.id === wardId
  );
  if (!feature) return null;
  return {
    id: feature.properties.id,
    name: feature.properties.name,
    number: feature.properties.number,
    zone: feature.properties.zone,
    district: feature.properties.district,
    boundary: feature.geometry,
  };
}

/**
 * Calculate heatmap weight based on priority and report count.
 * @param {string} priority - 'Critical', 'High', 'Medium', 'Low'
 * @param {number} reportCount - Number of reports
 * @returns {number} Weight between 0 and 1
 */
function calculateHeatmapWeight(priority, reportCount = 1) {
  const priorityWeights = {
    Critical: 1.0,
    High: 0.7,
    Medium: 0.4,
    Low: 0.2,
  };
  const base = priorityWeights[priority] || 0.3;
  const reportFactor = Math.min(reportCount / 10, 1);
  return Math.min(base + reportFactor * 0.3, 1.0);
}

module.exports = {
  detectWard,
  getWardHealthStatus,
  getAllWards,
  getWardById,
  calculateHeatmapWeight,
};
