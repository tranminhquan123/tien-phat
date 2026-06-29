// src/controllers/productController.ts
import type { Request, Response } from 'express';
import {
  getPublicProducts,
  getPublicProductBySlug,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
} from '@/services/productService';

// PUBLIC
export async function listPublicProducts(req: Request, res: Response) {
  try {
    const { category, size, search, featured, page, limit } = req.query as Record<string, string>;
    const result = await getPublicProducts({
      categorySlug: category,
      size,
      search,
      featured: featured === 'true',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function getProductDetail(req: Request, res: Response) {
  try {
    const result = await getPublicProductBySlug(req.params['slug'] as string);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: (err as Error).message });
  }
}

// ADMIN
export async function adminListProducts(req: Request, res: Response) {
  try {
    const { search, categoryId, size, page, limit } = req.query as Record<string, string>;
    const result = await getAdminProducts({
      search,
      categoryId,
      size,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function adminCreateProduct(req: Request, res: Response) {
  try {
    const product = await createProduct(req.body as Parameters<typeof createProduct>[0]);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function adminUpdateProduct(req: Request, res: Response) {
  try {
    const product = await updateProduct(req.params['id'] as string, req.body);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function adminDeleteProduct(req: Request, res: Response) {
  try {
    await deleteProduct(req.params['id'] as string);
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function adminAddProductImage(req: Request, res: Response) {
  try {
    const image = await addProductImage(
      req.params['id'] as string,
      req.body as Parameters<typeof addProductImage>[1]
    );
    res.status(201).json({ success: true, data: image });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function adminDeleteProductImage(req: Request, res: Response) {
  try {
    await deleteProductImage(req.params['imageId'] as string);
    res.json({ success: true, message: 'Đã xóa ảnh' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}
