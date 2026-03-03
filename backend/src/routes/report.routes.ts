import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { protect, requireAdmin } from '../middlewares/auth';
import { reportUpload } from '../middlewares/upload.middleware';

const router = Router();

router.post('/driver', protect, reportUpload.array('media', 10), reportController.createDriverReport);
router.post('/passenger', protect, reportUpload.array('media', 10), reportController.createPassengerReport);
router.put('/:id', protect, reportUpload.array('media', 10), reportController.updateReport);
router.patch('/:id/resolve', protect, requireAdmin, reportController.resolveReport);
router.get('/me', protect, reportController.getReportByUserId);

export default router;
