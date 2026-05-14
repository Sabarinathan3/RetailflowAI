import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limit.middleware';
import { registerSchema, loginSchema, pinLoginSchema, refreshTokenSchema } from './auth.validator';

const router = Router();
const controller = new AuthController();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/pin-login', authLimiter, validate(pinLoginSchema), controller.pinLogin);
router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
router.get('/me', authMiddleware, controller.me);

export default router;
