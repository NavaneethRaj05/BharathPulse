const Complaint = require('../models/Complaint');
const {
  computeComplaintSimilarity,
  autoCategorizeML,
  SIMILARITY_THRESHOLD,
  detectFakeComplaint,
} = require('../utils/similarity');
const { hasCloudinary } = require('../config/cloudinary');
const { sendStatusUpdateEmail } = require('../utils/mailer');

// Department mapping based on category
const DEPARTMENT_MAPPING = {
  'Sanitation': 'Public Health & Sanitation Department',
  'Roads': 'Public Works & Infrastructure Department',
  'Water Department': 'Water & Sewerage Department',
  'Electrical': 'Electricity & Power Department',
  'General': 'General Administration Department',
};

// ─────────────────────────────────────────────────────────────────
//  POST /api/complaints  — Create or merge complaint
// ─────────────────────────────────────────────────────────────────
const createComplaint = async (req, res) => {
  try {
    const { title, description, location, reporterName, reporterContact, latitude, longitude } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ success: false, error: 'title, description and location are required' });
    }
    if (!reporterName || !reporterContact) {
      return res.status(400).json({ success: false, error: 'Reporter name and contact are required' });
    }

    // ── ML categorisation ──────────────────────────────────────
    const { category, confidence, scores } = autoCategorizeML(`${title} ${description}`);

    // ── Fake complaint detection ───────────────────────────────
    const fakeCheck = detectFakeComplaint(title, description, reporterName, reporterContact);
    const isFake = fakeCheck.isFake;
    const suspicionScore = fakeCheck.score;
    const suspicionReasons = fakeCheck.reasons;

    // ── Image URL from Cloudinary (if uploaded & keys configured) ─
    // In demo mode (no Cloudinary keys) req.file exists but has no .path
    const imageUrl = (req.file && hasCloudinary && req.file.path) ? req.file.path : '';

    // ── Duplicate / similarity detection ──────────────────────
    //    Only compare against Pending / In-Progress complaints —
    //    Resolved ones are considered closed cases.
    // ── Pre-filter DB: only open complaints in same category ──
    const openComplaints = await Complaint.find({
      status: { $in: ['Pending', 'In Progress'] },
      category,                 // Pre-filter by same category for speed
    }).lean();

    const incoming = { title, description, category, location };

    let bestMatch   = null;
    let bestScore   = 0;

    // ── For each existing complaint ───────────────────────────
    for (const existing of openComplaints) {
      const score = computeComplaintSimilarity(incoming, existing);
      if (score > bestScore) {
        bestScore   = score;
        bestMatch   = existing;
      }
    }

    // ── score ≥ 0.40? → MERGE ──────────────────────────────────
    if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
      const reporter = { name: reporterName, contact: reporterContact };

      // ── Same contact? → Return "already reported" message ────
      const alreadyReported = bestMatch.reporters.some(r => r.contact === reporterContact);

      if (alreadyReported) {
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          alreadyReported: true,
          similarityScore: bestScore,
          data: await Complaint.findById(bestMatch._id),
          message: 'You have already reported this complaint.',
        });
      }

      const updated = await Complaint.findByIdAndUpdate(
        bestMatch._id,
        {
          $push:      { reporters: reporter },
          $inc:       { reportCount: 1 },
          // Update image if first one had none
          ...(imageUrl && !bestMatch.imageUrl ? { imageUrl } : {}),
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        alreadyReported: false,
        similarityScore: parseFloat(bestScore.toFixed(2)),
        data: updated,
        message: `Your report was merged with an existing complaint (${Math.round(bestScore * 100)}% match).`,
      });
    }

    // ── Create new complaint ───────────────────────────────────
    const assignedDept = DEPARTMENT_MAPPING[category] || 'General Administration Department';
    
    const complaint = await Complaint.create({
      title,
      description,
      category,
      location,
      imageUrl,
      mlConfidence: confidence,
      mlScores: scores,
      reporters:   [{ name: reporterName, contact: reporterContact }],
      reportCount: 1,
      latitude: latitude || null,
      longitude: longitude || null,
      assignedDept,
      isFake,
      suspicionScore,
      suspicionReasons,
    });

    return res.status(201).json({
      success: true,
      isDuplicate: false,
      data: complaint,
      message: 'Complaint submitted successfully.',
    });
  } catch (error) {
    console.error('[createComplaint]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
//  GET /api/complaints  — List with optional filters
// ─────────────────────────────────────────────────────────────────
const getComplaints = async (req, res) => {
  try {
    const { category, status, sort = '-createdAt' } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (status   && status   !== 'All') query.status   = status;

    const complaints = await Complaint.find(query)
      .sort(sort)
      .lean();

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
//  GET /api/complaints/:id  — Single complaint
// ─────────────────────────────────────────────────────────────────
const getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }
    res.status(200).json({ success: true, data: complaint });
  } catch {
    res.status(400).json({ success: false, error: 'Invalid complaint ID' });
  }
};

// ─────────────────────────────────────────────────────────────────
//  PUT /api/complaints/:id  — Update status
// ─────────────────────────────────────────────────────────────────
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    
    // Check if there is an uploaded image
    const resolvedImageUrl = (req.file && hasCloudinary && req.file.path) ? req.file.path : undefined;
    
    const updateData = { status };
    if (resolution !== undefined) updateData.resolution = resolution;
    if (resolvedImageUrl !== undefined) updateData.resolvedImageUrl = resolvedImageUrl;
    if (status === 'Resolved' && !req.body.resolvedAt) updateData.resolvedAt = new Date();

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    // Send email notification to all reporters
    if (complaint.reporters && complaint.reporters.length > 0) {
      complaint.reporters.forEach(reporter => {
        if (reporter.contact) {
          sendStatusUpdateEmail(reporter.contact, complaint, status);
        }
      });
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
//  GET /api/complaints/stats  — Dashboard aggregate stats
// ─────────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [result] = await Complaint.aggregate([
      {
        $group: {
          _id: null,
          total:           { $sum: 1 },
          totalReports:    { $sum: '$reportCount' },
          pending:         { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress:      { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          resolved:        { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          mostReported:    { $max: '$reportCount' },
        },
      },
    ]);
    res.status(200).json({ success: true, data: result || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
//  POST /api/complaints/:id/feedback  — Submit feedback for resolved complaint
// ─────────────────────────────────────────────────────────────────
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reporterContact, rating, comment } = req.body;

    if (!reporterContact || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Valid reporter contact and rating (1-5) are required' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    if (complaint.status !== 'Resolved') {
      return res.status(400).json({ success: false, error: 'Feedback can only be submitted for resolved complaints' });
    }

    // Check if this reporter already submitted feedback
    const existingFeedback = complaint.feedback.find(f => f.reporterContact === reporterContact);
    if (existingFeedback) {
      return res.status(400).json({ success: false, error: 'You have already submitted feedback for this complaint' });
    }

    // Add feedback
    complaint.feedback.push({ reporterContact, rating, comment });
    
    // Recalculate average rating
    const totalRating = complaint.feedback.reduce((sum, f) => sum + f.rating, 0);
    complaint.averageRating = totalRating / complaint.feedback.length;

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { averageRating: complaint.averageRating }
    });
  } catch (error) {
    console.error('[submitFeedback]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  getStats,
  submitFeedback,
};
