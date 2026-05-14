import { Router } from 'express';
import { CreditController } from './credit.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new CreditController();

const addPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']).optional(),
  notes: z.string().max(500).optional(),
});

const payByInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']).optional(),
  notes: z.string().max(500).optional(),
});

router.use(authMiddleware);

// --- New Native Route for Postman/Scripts using InvoiceId ---
router.post('/pay', roleMiddleware('OWNER', 'MANAGER', 'CASHIER'), validate(payByInvoiceSchema), controller.payByInvoiceId);

// --- Standard Credit Lifecycle Routes ---
router.get('/', roleMiddleware('OWNER', 'MANAGER', 'CASHIER'), controller.getAll);
router.get('/overdue', roleMiddleware('OWNER', 'MANAGER'), controller.getOverdue);
router.get('/outstanding', roleMiddleware('OWNER', 'MANAGER'), controller.getOutstandingTotal);
router.get('/customer/:customerId', controller.getByCustomer);
router.get('/:id', controller.getById);

// Add payment to a Native CreditLedgerId
router.post('/:id/payment', roleMiddleware('OWNER', 'MANAGER', 'CASHIER'), validate(addPaymentSchema), controller.addPayment);
router.get('/:id/reminder', roleMiddleware('OWNER', 'MANAGER'), controller.getReminderLink);

export default router;
