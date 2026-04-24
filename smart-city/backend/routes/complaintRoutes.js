const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  getStats,
  submitFeedback,
  escalateComplaint,
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
  .put(upload.single('resolvedImage'), updateComplaintStatus);

router.post('/:id/feedback', submitFeedback);
router.post('/:id/escalate', escalateComplaint);

module.exports = router;
