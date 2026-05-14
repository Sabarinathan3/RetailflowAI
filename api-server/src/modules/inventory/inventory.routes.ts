import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { auditMiddleware } from '../../middleware/audit.middleware';
import { addStockSchema, adjustStockSchema, transferStockSchema } from './inventory.validator';

const router = Router();
const controller = new InventoryController();

router.use(authMiddleware, tenantMiddleware);

router.post('/add', roleMiddleware('OWNER', 'MANAGER'), validate(addStockSchema), auditMiddleware('ADD_STOCK', 'Inventory'), controller.addStock);
router.post('/adjust', roleMiddleware('OWNER', 'MANAGER'), validate(adjustStockSchema), auditMiddleware('ADJUST_STOCK', 'Inventory'), controller.adjustStock);
router.post('/transfer', roleMiddleware('OWNER', 'MANAGER'), validate(transferStockSchema), auditMiddleware('TRANSFER_STOCK', 'Inventory'), controller.transferStock);
router.get('/', controller.getInventory);
router.get('/logs', controller.getLogs);

export default router;
