import { Router } from 'express';
import * as lineWebhookController from '../controllers/lineWebhook.controller';

const router = Router();

// ไม่ใช้ protect middleware — LINE เป็นผู้เรียก
router.post('/', lineWebhookController.handleWebhook);

export default router;
