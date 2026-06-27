import { Router } from "express";
import {
  register,
  login,
  getProfile,
  requestDeviceCode,
  authorizeDeviceCode,
  checkDeviceToken,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);

// OAuth Device Flow endpoints
router.post("/device/code", requestDeviceCode);
router.post("/device/authorize", authMiddleware, authorizeDeviceCode);
router.post("/device/token", checkDeviceToken);

export default router;
