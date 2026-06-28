// src/controllers/categoryController.ts
import type { Request, Response } from 'express';
import {
  getAllCategories, getCategoryBySlug,
  createCategory, updateCategory, deleteCategory,
} from '@/services/categoryService';

export async function listCategories(req: Request, res: Response) {
  try {
    const activeOnly = req.query['activeOnly'] === 'true';
    const categories = await getAllCategories(activeOnly);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function getCategoryDetail(req: Request, res: Response) {
  try {
    const category = await getCategoryBySlug(req.params['slug'] as string);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function adminCreateCategory(req: Request, res: Response) {
  try {
    const category = await createCategory(req.body as Parameters<typeof createCategory>[0]);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function adminUpdateCategory(req: Request, res: Response) {
  try {
    const category = await updateCategory(req.params['id'] as string, req.body);
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function adminDeleteCategory(req: Request, res: Response) {
  try {
    await deleteCategory(req.params['id'] as string);
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}
