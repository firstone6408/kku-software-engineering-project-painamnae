const express = require('express');
const reportController = require('../controllers/report.controller');
const { protect, requireAdmin } = require('../middlewares/auth');
const { reportUpload } = require('../middlewares/upload.middleware');

const router = express.Router();

// POST /api/reports/driver
router.post(
    '/driver',
    protect,
    reportUpload.array('media', 10),
    reportController.createDriverReport
);

// POST /api/reports/passenger
router.post(
    '/passenger',
    protect,
    reportUpload.array('media', 10),
    reportController.createPassengerReport
);

// PUT /api/reports/:id
router.put(
    '/:id',
    protect,
    reportUpload.array('media', 10),
    reportController.updateReport
);

// PATCH /api/reports/:id/resolve  (Admin only)
router.patch(
    '/:id/resolve',
    protect,
    requireAdmin,
    reportController.resolveReport
);

// GET /api/reports/me
router.get(
    '/me',
    protect,
    reportController.getReportByUserId
);

module.exports = router;