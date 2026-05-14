import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { auditMiddleware } from '../../middleware/audit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new BillingController();

const createInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']),
  discountPercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
  paidAmount: z.number().min(0).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    discount: z.number().min(0).optional().default(0),
    batchNumber: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

router.use(authMiddleware, tenantMiddleware);

router.post('/', validate(createInvoiceSchema), auditMiddleware('CREATE_INVOICE', 'Invoice'), controller.createInvoice);
router.get('/', controller.listInvoices);
router.get('/:id', controller.getInvoice);
router.get('/:id/pdf', controller.downloadPdf);
router.post('/:id/refund', roleMiddleware('OWNER', 'MANAGER'), auditMiddleware('REFUND_INVOICE', 'Invoice'), controller.refundInvoice);

export default router;
