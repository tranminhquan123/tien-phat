import { Router } from 'express';
import {
  createSession,
  getSession,
  handoffSession,
  postMessage,
} from '@/controllers/chatController';
import { chatRateLimit } from '@/middlewares/chatRateLimit';

const router = Router();

router.use(chatRateLimit);
router.post('/sessions', createSession);
router.get('/sessions/:id', getSession);
router.post('/sessions/:id/messages', postMessage);
router.post('/sessions/:id/handoff', handoffSession);

export default router;
