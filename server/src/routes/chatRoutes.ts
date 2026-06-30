import { Router } from 'express';
import { createSession, getSession, handoffSession, postMessage } from '@/controllers/chatController';
import { adminChangeChatStatus, adminGetChatSession, adminGetChatStats, adminListChatSessions, adminPostChatMessage } from '@/controllers/adminChatController';
import { adminAnalyzeChat, adminDraftChatReply, adminGetStoredAiAnalysis } from '@/controllers/adminAiController';
import { chatRateLimit } from '@/middlewares/chatRateLimit';
import { adminAiLimiter } from '@/middlewares/adminAiLimiter';
import { requireAuth } from '@/middlewares/authMiddleware';

const router = Router();

router.get('/admin/stats', requireAuth, adminGetChatStats);
router.get('/admin/sessions', requireAuth, adminListChatSessions);
router.get('/admin/sessions/:id', requireAuth, adminGetChatSession);
router.post('/admin/sessions/:id/messages', requireAuth, adminPostChatMessage);
router.put('/admin/sessions/:id/status', requireAuth, adminChangeChatStatus);
router.get('/admin/sessions/:id/analysis', requireAuth, adminGetStoredAiAnalysis);
router.post('/admin/sessions/:id/analysis', requireAuth, adminAiLimiter, adminAnalyzeChat);
router.post('/admin/sessions/:id/draft', requireAuth, adminAiLimiter, adminDraftChatReply);

router.post('/sessions', chatRateLimit, createSession);
router.get('/sessions/:id', getSession);
router.post('/sessions/:id/messages', chatRateLimit, postMessage);
router.post('/sessions/:id/handoff', chatRateLimit, handoffSession);

export default router;
