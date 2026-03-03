import { Router } from 'express';
import validate from '../middlewares/validate';
import { protect, requireAdmin } from '../middlewares/auth';
import * as controller from '../controllers/notification.controller';
import {
  idParamSchema,
  listMyNotificationsQuerySchema,
  listNotificationsAdminQuerySchema,
  createNotificationAdminSchema,
} from '../validations/notification.validation';

const router = Router();

// --- Admin ---
router.get('/admin', protect, requireAdmin, validate({ query: listNotificationsAdminQuerySchema }), controller.adminListNotifications);
router.post('/admin', protect, requireAdmin, validate({ body: createNotificationAdminSchema }), controller.adminCreateNotification);
router.delete('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), controller.adminDeleteNotification);
router.patch('/admin/:id/read', protect, requireAdmin, validate({ params: idParamSchema }), controller.adminMarkRead);

// --- User ---
router.get('/', protect, validate({ query: listMyNotificationsQuerySchema }), controller.listMyNotifications);
router.get('/unread-count', protect, controller.countUnread);
router.get('/:id', protect, validate({ params: idParamSchema }), controller.getMyNotificationById);
router.patch('/:id/read', protect, validate({ params: idParamSchema }), controller.markRead);
router.patch('/:id/unread', protect, validate({ params: idParamSchema }), controller.markUnread);
router.patch('/read-all', protect, controller.markAllRead);
router.delete('/:id', protect, validate({ params: idParamSchema }), controller.deleteMyNotification);

export default router;
