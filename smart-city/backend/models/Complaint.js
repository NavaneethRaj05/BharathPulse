const mongoose = require('mongoose');

/**
 * Reporter sub-document — one entry per person who filed this complaint
 */
const reporterSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    contact:    { type: String, required: true, trim: true }, // email or phone
    reportedAt: { type: Date,   default: Date.now },
  },
  { _id: false }
);

/**
 * Feedback sub-document — citizen ratings and comments
 */
const feedbackSchema = new mongoose.Schema(
  {
    reporterContact: { type: String, required: true, trim: true },
    rating:          { type: Number, required: true, min: 1, max: 5 },
    comment:         { type: String, trim: true, default: '' },
    submittedAt:     { type: Date, default: Date.now },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: ['Pending', 'In Progress', 'Resolved'] },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: 'system' },
  },
  { _id: false }
);

/**
 * Main Complaint schema
 *
 * Key new fields:
 *   reporters      — array of everyone who reported this issue
 *   reportCount    — denormalized count for fast sorting/filtering
 *   mlConfidence   — 0-1 confidence score from the ML categoriser
 *   latitude       — GPS coordinate for precise location
 *   longitude      — GPS coordinate for precise location
 *   feedback       — array of citizen ratings (1-5 stars + comments)
 *   assignedDept   — responsible authority department
 *   isFake         — flagged as spam/suspicious (rule-based or ML)
 *   suspicionScore — 0-1 confidence it's fake
 *   resolution     — notes on how the complaint was resolved
 */
const complaintSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, 'Title is required'], trim: true },
    complaintCode: {
      type: String,
      unique: true,
      index: true,
      required: true,
      trim: true,
    },
    description: { type: String, required: [true, 'Description is required'] },
    category: {
      type: String,
      required: true,
      enum: ['Sanitation', 'Roads', 'Water Department', 'Electrical', 'General'],
      default: 'General',
    },
    location:    { type: String, required: [true, 'Location is required'] },
    imageUrl:    { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending',
    },

    // ── Multi-reporter support ────────────────────────────────────
    reporters: {
      type: [reporterSchema],
      default: [],
    },
    reportCount: {
      type: Number,
      default: 1,
    },

    // ── ML metadata ───────────────────────────────────────────────
    mlConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    mlScores: {
      type: Map,
      of: Number,
      default: {},
    },

    // ── GPS & Location Verification ───────────────────────────────
    latitude: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },

    // ── Citizen Feedback & Rating ─────────────────────────────────
    feedback: {
      type: [feedbackSchema],
      default: [],
    },
    averageRating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },

    // ── Authority Assignment ──────────────────────────────────────
    assignedDept: {
      type: String,
      default: '',
      trim: true,
    },
    assignedTo: {
      type: String, // email or user ID of authority
      default: '',
      trim: true,
    },
    updatedByDept: {
      type: Boolean,
      default: false,
    },

    // ── Fake Complaint Detection ──────────────────────────────────
    isFake: {
      type: Boolean,
      default: false,
    },
    suspicionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    suspicionReasons: {
      type: [String],
      default: [],
    },

    // ── Resolution ────────────────────────────────────────────────
    resolution: {
      type: String,
      default: '',
      trim: true,
    },
    resolutionDate: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// Index for fast recent-first queries
complaintSchema.index({ createdAt: -1 });
// Index for clustering lookups
complaintSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
