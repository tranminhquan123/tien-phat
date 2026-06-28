// src/controllers/uploadController.ts
import type { Request, Response } from 'express';

export function uploadProductImages(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Bạn chưa chọn hình ảnh nào',
    });
  }

  const images = files.map((file) => ({
    url: `/uploads/products/${file.filename}`,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  }));

  return res.status(201).json({
    success: true,
    data: images,
  });
}
