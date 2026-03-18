import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import validate from '../middlewares/validate';
import { loginSchema, changePasswordSchema } from '../validations/auth.validation';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/login', validate({ body: loginSchema }), authController.login);
router.put('/change-password', protect, validate({ body: changePasswordSchema }), authController.changePassword);

export default router;
