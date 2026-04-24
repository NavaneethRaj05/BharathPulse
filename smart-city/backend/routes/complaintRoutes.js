const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  getStats,
  submitFeedback,
  getLocations,
} = require('../controllers/complaintControllerV2');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Must be before /:id routes
router.get('/stats',     getStats);
router.get('/locations', getLocations);

router.route('/')
  .get(getComplaints)
  .post(upload.single('image'), createComplaint);

router.route('/:id')
  .get(getComplaint)
  .put(updateComplaintStatus);

router.post('/:id/feedback', submitFeedback);

module.exports = router;
