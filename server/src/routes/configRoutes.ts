// src/routes/configRoutes.ts
import { Router } from 'express';
import { getPublicConfig, adminUpdateConfig, listBanners, saveBanner, removeBanner } from '@/controllers/configController';
import { requireAuth } from '@/middlewares/authMiddleware';

const router = Router();

router.get('/', getPublicConfig);
router.put('/admin', requireAuth, adminUpdateConfig);

router.get('/banners', listBanners);
router.post('/banners/admin', requireAuth, saveBanner);
router.put('/banners/admin/:id', requireAuth, saveBanner);
router.delete('/banners/admin/:id', requireAuth, removeBanner);

export default router;
