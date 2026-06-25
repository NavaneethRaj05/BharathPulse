const express = require('express');
const {
  getWards,
  getWardComplaints,
  getHeatmapData,
  getClusterData,
  detectWardFromCoords,
  getActivityFeed,
} = require('../controllers/gisController');

const router = express.Router();

router.get('/wards', getWards);
router.get('/wards/:wardId/complaints', getWardComplaints);
router.get('/heatmap', getHeatmapData);
router.get('/clusters', getClusterData);
router.post('/detect-ward', detectWardFromCoords);
router.get('/activity-feed', getActivityFeed);

module.exports = router;
