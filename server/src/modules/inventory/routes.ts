import { Router } from 'express';
import { requireAuth } from '../../middlewares/rbac.ts';
import { 
  getInventoryItems, 
  getInventoryItemById, 
  getInventoryItemStockLots, 
  getInventoryItemStockLotById, 
  getInventoryItemStockLotValuation, 
  createInventoryItemController, 
  createStockLotController, 
  updateInventoryItemController, 
  updateStockLotController, 
  deleteInventoryItemController, 
  deleteStockLotController 
} from './controller.ts';
import { 
  validateCreateItem, 
  validateCreateStockLot, 
  validateUpdateItem, 
  validateUpdateStockLot, 
  validateItemParams, 
  validateLotParams 
} from './validation.ts';

const router = Router();

// Apply global authentication across all inventory actions
router.use(requireAuth);

// Item Management Operations
router.get('/', getInventoryItems);
router.get('/items', getInventoryItems);
router.get('/:itemId', validateItemParams, getInventoryItemById);
router.get('/items/:itemId', validateItemParams, getInventoryItemById);
router.post('/', validateCreateItem, createInventoryItemController);
router.post('/items', validateCreateItem, createInventoryItemController);
router.put('/:itemId', validateUpdateItem, updateInventoryItemController);
router.put('/items/:itemId', validateUpdateItem, updateInventoryItemController);
router.delete('/:itemId', validateItemParams, deleteInventoryItemController);
router.delete('/items/:itemId', validateItemParams, deleteInventoryItemController);

// Stock Lot Management Operations
router.get('/items/:itemId/lots', validateItemParams, getInventoryItemStockLots);
router.post('/items/:itemId/lots', validateCreateStockLot, createStockLotController);
router.get('/items/:itemId/lots/:lotId', validateLotParams, getInventoryItemStockLotById);
router.get('/items/:itemId/lots/:lotId/valuation', validateLotParams, getInventoryItemStockLotValuation);
router.put('/items/:itemId/lots/:lotId', validateUpdateStockLot, updateStockLotController);
router.delete('/items/:itemId/lots/:lotId', validateLotParams, deleteStockLotController);

export default router;
