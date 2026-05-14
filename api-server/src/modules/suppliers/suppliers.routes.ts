import { Router } from 'express';
import { SuppliersController } from './suppliers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new SuppliersController();

// ── Validation Schemas ───────────────────────────────────────────────────

const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional(),
  phone: z.string().max(15).optional(),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  address: z.string().max(500).optional(),
  gstNumber: z.string().max(20).optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
});

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

const createLedgerSchema = z.object({
  supplierId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional(),
  totalAmount: z.number().min(0),
  paidAmount: z.number().min(0).optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional()
});

const createPaymentSchema = z.object({
  amount: z.number().min(0),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']),
  notes: z.string().optional()
});

// ── Middleware ───────────────────────────────────────────────────────────

router.use(authMiddleware, roleMiddleware('OWNER', 'MANAGER'));

// ── Supplier Routes ──────────────────────────────────────────────────────
// NOTE: Specific paths MUST come before parameterised /:id routes

router.get('/ai/recommendations', controller.getRecommendations);
router.post('/', validate(createSupplierSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.put('/:id', validate(createSupplierSchema.partial()), controller.update);
router.delete('/:id', controller.delete);
router.post('/:id/ai-risk', controller.analyzeRisk);

// ── Ledger Routes ────────────────────────────────────────────────────────
router.post('/ledgers', validate(createLedgerSchema), controller.createLedger);
router.get('/:supplierId/ledgers', controller.getLedgers);
router.post('/ledgers/:ledgerId/payments', validate(createPaymentSchema), controller.addLedgerPayment);

// ── Purchase Order Routes ────────────────────────────────────────────────
router.post('/purchase-orders', validate(createPOSchema), controller.createPurchaseOrder);
router.get('/purchase-orders/list', controller.listPurchaseOrders);
router.get('/purchase-orders/:id', controller.getPurchaseOrderById);
router.patch('/purchase-orders/:id/status', validate(updatePOStatusSchema), controller.updatePurchaseOrderStatus);
router.delete('/purchase-orders/:id', controller.deletePurchaseOrder);

export default router;
