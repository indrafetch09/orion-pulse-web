import { Router } from 'express';
import {
  remove,
  triggerScan,
  getLogs,
  clearLogs,
  submitAgentLogs,
} from '../controllers/portController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public / Agent authenticating route (no JWT required)
router.post('/agent/logs', submitAgentLogs as any);

// User authenticated routes
router.delete('/:id', authMiddleware as any, remove as any);
router.post('/:id/scan', authMiddleware as any, triggerScan as any);
router.get('/:portId/logs', authMiddleware as any, getLogs as any);
router.delete('/:portId/logs', authMiddleware as any, clearLogs as any);

export default router;
