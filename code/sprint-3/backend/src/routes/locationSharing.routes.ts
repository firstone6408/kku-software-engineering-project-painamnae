import { Router } from 'express';
import * as locationSharingController from '../controllers/locationSharing.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/', protect, locationSharingController.startSharing);
router.get('/active', protect, locationSharingController.getActiveSession);
router.get('/history', protect, locationSharingController.getHistory);
router.get('/:sessionId', protect, locationSharingController.getSessionById);
router.patch('/:sessionId/location', protect, locationSharingController.updateLocation);
router.post('/:sessionId/send', protect, locationSharingController.sendUpdate);
router.patch('/:sessionId/stop', protect, locationSharingController.stopSharing);
router.patch('/:sessionId/expire', protect, locationSharingController.expireSharing);

export default router;
