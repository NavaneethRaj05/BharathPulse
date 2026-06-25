const Tenant = require('../models/Tenant');

const tenantIsolation = async (req, res, next) => {
  try {
    // Read Tenant ID from headers, query params or default to 'BBMP'
    let tenantCode = req.headers['x-tenant-id'] || req.query.tenantId || 'BBMP';
    tenantCode = tenantCode.toUpperCase();

    // Check in-memory seed or DB
    let tenant = await Tenant.findOne({ tenantCode }).lean();

    if (!tenant) {
      // Seed default tenant configurations on-demand for easy setup
      tenant = await Tenant.create({
        tenantCode,
        name: `${tenantCode} Municipal Council`,
        level: tenantCode === 'NATIONAL' ? 'NATIONAL' : tenantCode === 'KA' ? 'STATE' : 'CORPORATION',
        slaRules: {
          Sanitation: 24,
          Roads: 48,
          'Water Department': 12,
          Electrical: 24,
          General: 48,
        },
      });
    }

    req.tenantCode = tenantCode;
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { tenantIsolation };
