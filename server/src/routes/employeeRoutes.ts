import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/authMiddleware';
import { adminGetAssignableEmployees, adminGetEmployee, adminGetEmployeeStats, adminListEmployees } from '@/controllers/employeeQueryController';
import { adminCreateEmployee, adminUpdateEmployee } from '@/controllers/employeeMutationController';

const router = Router();
router.use(requireAuth, requireRole('OWNER', 'MANAGER'));
router.get('/stats', adminGetEmployeeStats);
router.get('/assignable', adminGetAssignableEmployees);
router.get('/', adminListEmployees);
router.post('/', adminCreateEmployee);
router.get('/:id', adminGetEmployee);
router.put('/:id', adminUpdateEmployee);

export default router;
