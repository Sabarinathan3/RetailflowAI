import { Router } from 'express';
import { BranchesController } from './branches.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createBranchSchema, updateBranchSchema } from './branches.validator';

const router = Router();
const controller = new BranchesController();

router.post('/', authMiddleware, roleMiddleware('OWNER', 'ADMIN'), validate(createBranchSchema), controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.getById);
router.put('/:id', authMiddleware, roleMiddleware('OWNER', 'ADMIN'), validate(updateBranchSchema), controller.update);
router.delete('/:id', authMiddleware, roleMiddleware('OWNER', 'ADMIN'), controller.delete);

export default router;
