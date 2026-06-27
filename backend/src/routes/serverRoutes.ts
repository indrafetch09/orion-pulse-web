import { Router } from 'express';
import { getAll, getOne, create, deleteServer } from '../controllers/serverController';
import { getAll as getPorts, add as addPort } from '../controllers/portController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply authMiddleware globally to all server routes
router.use(authMiddleware as any);

router.get('/', getAll as any);
router.get('/:id', getOne as any);
router.post('/', create as any);
router.delete('/:id', deleteServer as any);

// Port routes scoped under specific servers
router.get('/:serverId/ports', getPorts as any);
router.post('/:serverId/ports', addPort as any);

export default router;
