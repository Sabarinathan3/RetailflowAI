import { Router } from 'express';
import { CreditLedgerController } from './credit-ledger.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new CreditLedgerController();

const addPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']),
  notes: z.string().max(500).optional(),
});

router.use(authMiddleware);

router.get('/pending', controller.getPending);
router.get('/overdue', roleMiddleware('OWNER', 'MANAGER'), controller.getOverdue);
router.get('/outstanding', roleMiddleware('OWNER', 'MANAGER'), controller.getOutstandingTotal);
router.get('/customer/:customerId', controller.getByCustomer);
router.get('/:id', controller.getById);
router.post('/:id/payment', roleMiddleware('OWNER', 'MANAGER', 'CASHIER'), validate(addPaymentSchema), controller.addPayment);
router.get('/:id/reminder', roleMiddleware('OWNER', 'MANAGER'), controller.getReminderLink);

export default router;
