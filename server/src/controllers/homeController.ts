import type { Request, Response } from 'express';
import { getHomeData } from '@/services/homeService';

export async function getHomepageData(_req: Request, res: Response) {
  try {
    const data = await getHomeData();
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Home API]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Không thể tải dữ liệu trang chủ',
    });
  }
}
