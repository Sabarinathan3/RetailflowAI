import { Router } from 'express';
import { SuppliersController } from './suppliers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new SuppliersController();

const createPOSchema = z.object({
  supplierId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  expectedDate: z.coerce.date().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      }),
    )
    .min(1, 'At least one item required'),
});

const updatePOStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED']),
});

router.use(authMiddleware, roleMiddleware('OWNER', 'MANAGER'));

router.post('/', validate(createPOSchema), controller.createPurchaseOrder);
router.get('/', controller.listPurchaseOrders);
router.get('/:id', controller.getPurchaseOrderById);
router.put('/:id', validate(updatePOStatusSchema), controller.updatePurchaseOrderStatus);
router.delete('/:id', controller.deletePurchaseOrder);

export default router;
