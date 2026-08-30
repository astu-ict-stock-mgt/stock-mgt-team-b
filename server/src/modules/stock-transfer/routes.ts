import { Router } from 'express';
import {
  createTransfer,
} from './controller.ts';

const router = Router();

router.post('/', createTransfer);

export default router;