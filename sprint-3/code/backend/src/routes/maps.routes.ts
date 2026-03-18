import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate';
import { protect } from '../middlewares/auth';
import * as ctrl from '../controllers/maps.controller';

const router = Router();

router.post(
  '/directions',
  protect,
  validate({
    body: z.object({
      origin: z.any(),
      destination: z.any(),
      waypoints: z.array(z.any()).optional(),
      alternatives: z.boolean().optional(),
      departureTime: z.string().optional(),
      optimizeWaypoints: z.boolean().optional(),
    }),
  }),
  ctrl.directions,
);

router.get('/geocode', protect, validate({ query: z.object({ address: z.string().min(1) }) }), ctrl.geocodeCtrl);
router.get('/reverse-geocode', protect, validate({ query: z.object({ lat: z.string(), lng: z.string() }) }), ctrl.reverseGeocodeCtrl);

export default router;
