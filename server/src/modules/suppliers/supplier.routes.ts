import { Router } from 'express';
import { handleCreateSupplier, handleGetSuppliers } from './supplier.controller.ts';

const router = Router();

// POST /api/suppliers
router.post('/', handleCreateSupplier);

// GET /api/suppliers
router.get('/', handleGetSuppliers);

export default router;