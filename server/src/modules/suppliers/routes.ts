import { Router } from 'express';
import { handleCreateSupplier, handleGetSuppliers } from './supplier.controller.ts';
import { validateCreateSupplier } from './validation.ts';

const router = Router();

// POST /api/suppliers - Enforces input data validation schemas
router.post('/', validateCreateSupplier, handleCreateSupplier);

// GET /api/suppliers
router.get('/', handleGetSuppliers);

export default router;
