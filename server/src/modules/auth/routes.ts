import { Router } from 'express';
import { loginUser } from './controller.ts';
import { validateLogin } from './validation.ts';

const router = Router();

router.post('/login', validateLogin, loginUser);

export default router;
