import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/rbac.ts';
import {
  createUserHandler,
  deactivateUserHandler,
  getUserByIdHandler,
  getUsersHandler,
  updateUserHandler,
} from './controller.ts';
import {
  validateCreateUser,
  validateGetUsersQuery,
  validateUpdateUser,
  validateUserId,
} from './validation.ts';

const router = Router();

// Apply RBAC: Restrict all user management endpoints to ADMINISTRATOR role (SRS Section 4.4.8)
router.use(requireAuth, requireRole('ADMINISTRATOR'));

router.get('/', validateGetUsersQuery, getUsersHandler);
router.post('/', validateCreateUser, createUserHandler);
router.get('/:id', validateUserId, getUserByIdHandler);
router.put('/:id', validateUpdateUser, updateUserHandler);
// Soft delete user route (deactivates account by setting isActive to false)
router.delete('/:id', validateUserId, deactivateUserHandler);

export default router;
