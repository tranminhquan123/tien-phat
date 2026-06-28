// src/routes/productRoutes.ts
import { Router } from 'express';
import {
  listPublicProducts,
  getProductDetail,
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminAddProductImage,
  adminDeleteProductImage,
} from '@/controllers/productController';
import { requireAuth } from '@/middlewares/authMiddleware';

const router = Router();

// Public routes
router.get('/', listPublicProducts);
router.get('/:slug', getProductDetail);

// Admin routes (yêu cầu đăng nhập)
router.get('/admin/list', requireAuth, adminListProducts);
router.post('/admin', requireAuth, adminCreateProduct);
router.put('/admin/:id', requireAuth, adminUpdateProduct);
router.delete('/admin/:id', requireAuth, adminDeleteProduct);
router.post('/admin/:id/images', requireAuth, adminAddProductImage);
router.delete('/admin/:id/images/:imageId', requireAuth, adminDeleteProductImage);

export default router;
