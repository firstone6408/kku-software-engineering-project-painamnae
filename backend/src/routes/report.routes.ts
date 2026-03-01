import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { protect, requireAdmin } from '../middlewares/auth';
import { reportUpload } from '../middlewares/upload.middleware';

const router = Router();

router.post('/driver', protect, reportUpload.array('media', 10), reportController.createDriverReport);
router.post('/passenger', protect, reportUpload.array('media', 10), reportController.createPassengerReport);
router.get('/me', protect, reportController.getReportByUserId);
router.get('/admin', protect, requireAdmin, reportController.getAllReportsAdmin);
router.get('/admin/:id', protect, requireAdmin, reportController.getReportByIdAdmin);
router.put('/:id', protect, reportUpload.array('media', 10), reportController.updateReport);
router.patch('/:id/resolve', protect, requireAdmin, reportController.resolveReport);

export default router;
