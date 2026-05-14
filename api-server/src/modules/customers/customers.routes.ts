import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createCustomerSchema, updateCustomerSchema, searchCustomerSchema } from './customers.validator';

const router = Router();
const controller = new CustomersController();

router.use(authMiddleware);

router.post('/', validate(createCustomerSchema), controller.create);
router.get('/', validate(searchCustomerSchema, 'query'), controller.search);
router.get('/:id', controller.getById);
router.put('/:id', validate(updateCustomerSchema), controller.update);
router.get('/:id/purchases', controller.getPurchaseHistory);

export default router;
