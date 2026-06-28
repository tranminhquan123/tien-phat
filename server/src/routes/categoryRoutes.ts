// src/routes/categoryRoutes.ts
import { Router } from 'express';
import { listCategories, getCategoryDetail, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '@/controllers/categoryController';
import { requireAuth } from '@/middlewares/authMiddleware';

const router = Router();

router.get('/', listCategories);
router.get('/:slug', getCategoryDetail);
router.post('/admin', requireAuth, adminCreateCategory);
router.put('/admin/:id', requireAuth, adminUpdateCategory);
router.delete('/admin/:id', requireAuth, adminDeleteCategory);

export default router;
