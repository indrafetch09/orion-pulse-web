import { Router } from "express";
import {
  getAll,
  getOne,
  create,
  deleteServer,
} from "../controllers/serverController";
import {
  getAll as getPorts,
  add as addPort,
} from "../controllers/portController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Apply authMiddleware globally to all server routes
router.use(authMiddleware);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", create);
router.delete("/:id", deleteServer);

// Port routes scoped under specific servers
router.get("/:serverId/ports", getPorts);
router.post("/:serverId/ports", addPort);

export default router;
