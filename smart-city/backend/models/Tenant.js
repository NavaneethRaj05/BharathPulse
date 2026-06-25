const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    tenantCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      enum: ['PANCHAYAT', 'MUNICIPALITY', 'CORPORATION', 'DISTRICT', 'STATE', 'NATIONAL'],
      default: 'CORPORATION',
    },
    parentCode: {
      type: String,
      default: '',
      trim: true,
    },
    slaRules: {
      type: Map,
      of: Number,
      default: {
        Sanitation: 24,
        Roads: 48,
        'Water Department': 12,
        Electrical: 24,
        General: 48,
      },
    },
    branding: {
      primaryColor: { type: String, default: '#3b82f6' },
      logoUrl: { type: String, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tenant', tenantSchema);
