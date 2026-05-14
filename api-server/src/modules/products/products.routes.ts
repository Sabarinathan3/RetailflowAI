import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createProductSchema, updateProductSchema, searchProductSchema } from './products.validator';
import { auditMiddleware } from '../../middleware/audit.middleware';

const router = Router();
const controller = new ProductsController();

router.use(authMiddleware);

router.post('/', roleMiddleware('OWNER', 'MANAGER'), validate(createProductSchema), auditMiddleware('CREATE_PRODUCT', 'Product'), controller.create);
router.get('/', validate(searchProductSchema, 'query'), controller.search);
router.get('/categories', controller.getCategories);
router.get('/low-stock', roleMiddleware('OWNER', 'MANAGER'), controller.getLowStock);
router.get('/barcode/:barcode', controller.getByBarcode);
router.get('/:id', controller.getById);
router.put('/:id', roleMiddleware('OWNER', 'MANAGER'), validate(updateProductSchema), auditMiddleware('UPDATE_PRODUCT', 'Product'), controller.update);
router.delete('/:id', roleMiddleware('OWNER', 'MANAGER'), auditMiddleware('DELETE_PRODUCT', 'Product'), controller.delete);

export default router;
