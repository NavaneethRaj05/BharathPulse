const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    tenantCode: {
      type: String,
      required: true,
      index: true,
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    actor: {
      name: { type: String, required: true },
      role: { type: String, required: true },
      userId: { type: String, default: 'system' },
    },
    action: {
      type: String,
      required: true,
      enum: ['SUBMITTED', 'ASSIGNED', 'WORK_STARTED', 'RESOLVED', 'VERIFIED', 'REJECTED', 'ESCALATED'],
    },
    description: {
      type: String,
      default: '',
    },
    gps: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
