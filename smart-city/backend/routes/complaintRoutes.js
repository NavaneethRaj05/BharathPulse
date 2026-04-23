const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  getStats,
  submitFeedback,
} = require('../controllers/complaintController');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Dashboard stats (must be before /:id)
router.get('/stats', getStats);

router.route('/')
  .get(getComplaints)
  .post(upload.single('image'), createComplaint);

router.route('/:id')
  .get(getComplaint)
  .put(updateComplaintStatus);

router.post('/:id/feedback', submitFeedback);

module.exports = router;
