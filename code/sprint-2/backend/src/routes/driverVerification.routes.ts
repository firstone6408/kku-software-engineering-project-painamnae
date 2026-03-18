import { Router } from 'express';
import validate from '../middlewares/validate';
import upload from '../middlewares/upload.middleware';
import { protect, requireAdmin } from '../middlewares/auth';
import * as driverVerifController from '../controllers/driverVerification.controller';
import {
  idParamSchema,
  createDriverVerificationSchema,
  updateDriverVerificationSchema,
  updateVerificationStatusSchema,
  listDriverVerifsQuerySchema,
  createDriverVerificationByAdminSchema,
  updateDriverVerificationByAdminSchema,
} from '../validations/driverVerification.validation';

const router = Router();

// --- Admin ---
router.get('/admin', protect, requireAdmin, validate({ query: listDriverVerifsQuerySchema }), driverVerifController.adminListVerifications);
router.get('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), driverVerifController.getVerificationById);
router.post(
  '/admin', protect, requireAdmin,
  upload.fields([{ name: 'licensePhotoUrl', maxCount: 1 }, { name: 'selfiePhotoUrl', maxCount: 1 }]),
  validate({ body: createDriverVerificationByAdminSchema }),
  driverVerifController.adminCreateVerification,
);
router.delete('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), driverVerifController.adminDeleteVerification);
router.put(
  '/admin/:id', protect, requireAdmin,
  upload.fields([{ name: 'licensePhotoUrl', maxCount: 1 }, { name: 'selfiePhotoUrl', maxCount: 1 }]),
  validate({ params: idParamSchema, body: updateDriverVerificationByAdminSchema }),
  driverVerifController.adminUpdateVerification,
);
router.patch('/:id/status', protect, requireAdmin, validate({ params: idParamSchema, body: updateVerificationStatusSchema }), driverVerifController.updateVerificationStatus);

// --- Driver ---
router.get('/me', protect, driverVerifController.getMyVerification);
router.post(
  '/', protect,
  upload.fields([{ name: 'licensePhotoUrl', maxCount: 1 }, { name: 'selfiePhotoUrl', maxCount: 1 }]),
  validate({ body: createDriverVerificationSchema }),
  driverVerifController.createVerification,
);
router.put(
  '/:id', protect,
  upload.single('licensePhotoUrl'),
  validate({ params: idParamSchema, body: updateDriverVerificationSchema }),
  driverVerifController.updateVerification,
);

export default router;
