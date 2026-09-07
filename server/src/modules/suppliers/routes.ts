import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createSupplierHandler,
  deleteSupplierHandler,
  getSupplierByIdHandler,
  getSuppliersHandler,
  updateSupplierHandler,
} from './controller.ts';
import {
  validateCreateSupplier,
  validateGetSuppliersQuery,
  validateSupplierId,
  validateUpdateSupplier,
} from './validation.ts';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole(
    'ADMINISTRATOR',
    'PAO',
    'STOREKEEPER',
    'STOCK_CLERK',
    'ACCOUNTANT',
    'DEPARTMENT_HEAD',
    'SECURITY_OFFICER'
  ),
  validateGetSuppliersQuery,
  getSuppliersHandler
);
router.post(
  '/',
  requireAuth,
  requireRole('ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK'),
  validateCreateSupplier,
  createSupplierHandler
);

router.get(
  '/:id',
  requireAuth,
  requireRole(
    'ADMINISTRATOR',
    'PAO',
    'STOREKEEPER',
    'STOCK_CLERK',
    'ACCOUNTANT',
    'DEPARTMENT_HEAD',
    'SECURITY_OFFICER'
  ),
  validateSupplierId,
  getSupplierByIdHandler
);
router.put(
  '/:id',
  requireAuth,
  requireRole('ADMINISTRATOR', 'PAO'),
  validateUpdateSupplier,
  updateSupplierHandler
);
router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMINISTRATOR', 'PAO'),
  validateSupplierId,
  deleteSupplierHandler
);

export default router;
