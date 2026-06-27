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
router.get("/profile", authMiddleware as any, getProfile as any);

// OAuth Device Flow endpoints
router.post("/device/code", requestDeviceCode as any);
router.post(
  "/device/authorize",
  authMiddleware as any,
  authorizeDeviceCode as any,
);
router.post("/device/token", checkDeviceToken as any);

export default router;
