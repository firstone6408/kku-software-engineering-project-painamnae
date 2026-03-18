import { Router } from 'express';
import validate from '../middlewares/validate';
import * as vehicleController from '../controllers/vehicle.controller';
import {
  idParamSchema,
  createVehicleSchema,
  updateVehicleSchema,
  createVehicleByAdminSchema,
  updateVehicleByAdminSchema,
  listMyVehiclesQuerySchema,
  listVehiclesAdminQuerySchema,
  adminUserIdParamSchema,
} from '../validations/vehicle.validation';
import { protect, requireAdmin } from '../middlewares/auth';
import upload from '../middlewares/upload.middleware';
import parseVehicleBody from '../middlewares/parseVehicleBody';

const router = Router();

// --- Admin ---
router.get('/admin', protect, requireAdmin, validate({ query: listVehiclesAdminQuerySchema }), vehicleController.adminListVehicles);
router.get('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), vehicleController.getVehicleByIdAdmin);
router.get('/admin/user/:userId', protect, requireAdmin, validate({ params: adminUserIdParamSchema, query: listMyVehiclesQuerySchema }), vehicleController.adminListVehiclesByUser);
router.post('/admin', protect, requireAdmin, upload.fields([{ name: 'photos', maxCount: 5 }]), parseVehicleBody, validate({ body: createVehicleByAdminSchema }), vehicleController.adminCreateVehicle);
router.put('/admin/:id', protect, requireAdmin, upload.fields([{ name: 'photos', maxCount: 5 }]), parseVehicleBody, validate({ params: idParamSchema, body: updateVehicleByAdminSchema }), vehicleController.adminUpdateVehicle);
router.delete('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), vehicleController.adminDeleteVehicle);

// --- Public ---
router.get('/', protect, validate({ query: listMyVehiclesQuerySchema }), vehicleController.listMyVehicles);
router.get('/:id', protect, validate({ params: idParamSchema }), vehicleController.getVehicleById);
router.post('/', protect, upload.fields([{ name: 'photos', maxCount: 5 }]), parseVehicleBody, validate({ body: createVehicleSchema }), vehicleController.createVehicle);
router.put('/:id', protect, upload.fields([{ name: 'photos', maxCount: 5 }]), parseVehicleBody, validate({ params: idParamSchema, body: updateVehicleSchema }), vehicleController.updateVehicle);
router.delete('/:id', protect, validate({ params: idParamSchema }), vehicleController.deleteVehicle);
router.put('/:id/default', protect, validate({ params: idParamSchema }), vehicleController.setDefaultVehicle);

export default router;
