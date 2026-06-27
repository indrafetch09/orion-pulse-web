import { Router } from "express";
import {
  remove,
  triggerScan,
  getLogs,
  clearLogs,
  submitAgentLogs,
} from "../controllers/portController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public / Agent authenticating route (no JWT required)
router.post("/agent/logs", submitAgentLogs);

// User authenticated routes
router.delete("/:id", authMiddleware, remove);
router.post("/:id/scan", authMiddleware, triggerScan);
router.get("/:portId/logs", authMiddleware, getLogs);
router.delete("/:portId/logs", authMiddleware, clearLogs);

export default router;
