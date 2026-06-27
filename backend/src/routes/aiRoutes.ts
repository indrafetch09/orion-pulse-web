import { Router } from 'express';
import { getSolutions, getSolution } from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/solutions', getSolutions as any);
router.get('/solutions/:id', getSolution as any);

export default router;
