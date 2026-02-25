import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import validate from '../middlewares/validate';
import upload from '../middlewares/upload.middleware';
import {
  idParamSchema,
  createUserSchema,
  updateMyProfileSchema,
  updateUserByAdminSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} from '../validations/user.validation';
import { protect, requireAdmin } from '../middlewares/auth';

const router = Router();

// --- Admin Routes ---
router.get('/admin', protect, requireAdmin, validate({ query: listUsersQuerySchema }), userController.adminListUsers);
router.put(
  '/admin/:id', protect, requireAdmin,
  upload.fields([{ name: 'nationalIdPhotoUrl', maxCount: 1 }, { name: 'selfiePhotoUrl', maxCount: 1 }, { name: 'profilePicture', maxCount: 1 }]),
  validate({ params: idParamSchema, body: updateUserByAdminSchema }),
  userController.adminUpdateUser,
);
router.delete('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), userController.adminDeleteUser);
router.get('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), userController.getUserById);
router.patch('/admin/:id/status', protect, requireAdmin, validate({ params: idParamSchema, body: updateUserStatusSchema }), userController.setUserStatus);

// --- Public / User Routes ---
router.get('/me', protect, userController.getMyUser);
router.get('/:id', validate({ params: idParamSchema }), userController.getUserPublicById);
router.post(
  '/',
  upload.fields([{ name: 'nationalIdPhotoUrl', maxCount: 1 }, { name: 'selfiePhotoUrl', maxCount: 1 }]),
  validate({ body: createUserSchema }),
  userController.createUser,
);
router.put(
  '/me', protect,
  upload.fields([{ name: 'nationalIdPhotoUrl', maxCount: 1 }, { name: 'selfiePhotoUrl', maxCount: 1 }, { name: 'profilePicture', maxCount: 1 }]),
  validate({ body: updateMyProfileSchema }),
  userController.updateCurrentUserProfile,
);

export default router;
