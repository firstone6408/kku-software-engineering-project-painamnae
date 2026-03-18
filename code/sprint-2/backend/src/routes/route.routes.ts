import { Router } from 'express';
import validate from '../middlewares/validate';
import { protect, requireAdmin } from '../middlewares/auth';
import requireDriverVerified from '../middlewares/driverVerified';
import * as routeController from '../controllers/route.controller';
import {
  idParamSchema,
  createRouteSchema,
  updateRouteSchema,
  createRouteByAdminSchema,
  updateRouteByAdminSchema,
  adminDriverIdParamSchema,
  listRoutesQuerySchema,
  cancelRouteSchema,
} from '../validations/route.validation';

const router = Router();

// --- Admin ---
router.get('/admin', protect, requireAdmin, validate({ query: listRoutesQuerySchema }), routeController.adminListRoutes);
router.get('/admin/driver/:driverId', protect, requireAdmin, validate({ params: adminDriverIdParamSchema }), routeController.adminGetRoutesByDriver);
router.get('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), routeController.getRouteById);
router.post('/admin', protect, requireAdmin, validate({ body: createRouteByAdminSchema }), routeController.adminCreateRoute);
router.put('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema, body: updateRouteByAdminSchema }), routeController.adminUpdateRoute);
router.delete('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), routeController.adminDeleteRoute);

// --- Public ---
router.get('/', validate({ query: listRoutesQuerySchema }), routeController.listRoutes);
router.get('/me', protect, routeController.getMyRoutes);
router.get('/:id', validate({ params: idParamSchema }), routeController.getRouteById);
router.post('/', protect, requireDriverVerified, validate({ body: createRouteSchema }), routeController.createRoute);
router.put('/:id', protect, requireDriverVerified, validate({ params: idParamSchema, body: updateRouteSchema }), routeController.updateRoute);
router.patch('/:id/cancel', protect, requireDriverVerified, validate({ params: idParamSchema, body: cancelRouteSchema }), routeController.cancelRoute);
router.delete('/:id', protect, requireDriverVerified, validate({ params: idParamSchema }), routeController.deleteRoute);

export default router;
