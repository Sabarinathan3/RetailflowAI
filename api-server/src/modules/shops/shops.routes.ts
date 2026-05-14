import { Router } from 'express';
import { ShopsController } from './shops.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateShopSchema } from './shops.validator';

const router = Router();
const controller = new ShopsController();

router.get('/', authMiddleware, roleMiddleware('OWNER', 'ADMIN'), controller.getShop);
router.put('/', authMiddleware, roleMiddleware('OWNER', 'ADMIN'), validate(updateShopSchema), controller.updateShop);

export default router;
