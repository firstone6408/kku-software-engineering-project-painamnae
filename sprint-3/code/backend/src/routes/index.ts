import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import vehicleRoutes from './vehicle.routes';
import routeRoutes from './route.routes';
import driverVerifRoutes from './driverVerification.routes';
import bookingRoutes from './booking.routes';
import notificationRoutes from './notification.routes';
import mapRoutes from './maps.routes';
import reportRoutes from './report.routes';
import emergencyContactRoutes from './emergencyContact.routes';
import locationSharingRoutes from './locationSharing.routes';
import lineWebhookRoutes from './lineWebhook.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/routes', routeRoutes);
router.use('/driver-verifications', driverVerifRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/api/maps', mapRoutes);
router.use('/reports', reportRoutes);
router.use('/emergency-contacts', emergencyContactRoutes);
router.use('/location-sharing', locationSharingRoutes);
router.use('/line-webhook', lineWebhookRoutes);

export default router;
