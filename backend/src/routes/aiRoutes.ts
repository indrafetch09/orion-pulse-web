import { Router } from "express";
import { getSolutions, getSolution } from "../controllers/aiController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/solutions", getSolutions);
router.get("/solutions/:id", getSolution);

export default router;
