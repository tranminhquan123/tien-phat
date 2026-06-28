// src/controllers/configController.ts
import type { Request, Response } from 'express';
import { getAllConfigs, updateConfigs, getBanners, upsertBanner, deleteBanner } from '@/services/configService';

export async function getPublicConfig(_req: Request, res: Response) {
  try {
    const config = await getAllConfigs();
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function adminUpdateConfig(req: Request, res: Response) {
  try {
    const config = await updateConfigs(req.body as Record<string, string>);
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function listBanners(req: Request, res: Response) {
  try {
    const activeOnly = req.query['activeOnly'] === 'true';
    const banners = await getBanners(activeOnly);
    res.json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function saveBanner(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string | undefined;
    const banner = await upsertBanner(id, req.body as Parameters<typeof upsertBanner>[1]);
    res.json({ success: true, data: banner });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function removeBanner(req: Request, res: Response) {
  try {
    await deleteBanner(req.params['id'] as string);
    res.json({ success: true, message: 'Đã xóa banner' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}
