import { Router } from 'express';
import { getHomepageData } from '@/controllers/homeController';

const router = Router();

router.get('/', getHomepageData);

export default router;
