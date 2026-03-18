import { Request, Response } from 'express';
import * as lineWebhookService from '../services/lineWebhook.service';

export const handleWebhook = async (req: Request, res: Response) => {
  // LINE Webhook ต้องตอบ 200 ทันที ไม่งั้นจะ retry
  res.status(200).json({ success: true });

  const events = req.body?.events;
  if (!Array.isArray(events)) return;

  for (const event of events) {
    try {
      switch (event.type) {
        case 'follow':
          await lineWebhookService.handleFollow(event);
          break;
        case 'message':
          if (event.message?.type === 'text') {
            await lineWebhookService.handleMessage(event);
          }
          break;
        case 'unfollow':
          await lineWebhookService.handleUnfollow(event);
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error(`[LINE Webhook] Error handling ${event.type}:`, err.message);
    }
  }
};
