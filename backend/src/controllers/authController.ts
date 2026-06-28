import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User";
import { DeviceCode } from "../models/DeviceCode";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Types } from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET;

const signToken = (user: IUser) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    `${JWT_SECRET}`,
    { expiresIn: "30d" },
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, message: error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, message: error });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, message: error });
  }
};

// CLI Device Code Request (POST /api/auth/device/code)
export const requestDeviceCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Generate a 6-character user code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let userCode = "";
    for (let i = 0; i < 6; i++) {
      userCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Generate a secure device code (UUID-like)
    const deviceCode =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Save to DB
    await DeviceCode.create({
      deviceCode,
      userCode,
      status: "pending",
    });

    const frontendUrl = process.env.FRONTEND_URL;

    return res.status(200).json({
      success: true,
      data: {
        deviceCode,
        userCode,
        verificationUri: `${frontendUrl}/cli-login?device_code=${userCode}`,
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, message: error });
  }
};

// Web dashboard authorizes the device code (POST /api/auth/device/authorize)
export const authorizeDeviceCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { deviceCode } = req.body;
    if (!deviceCode) {
      return res
        .status(400)
        .json({ success: false, message: "Device code is required" });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find by userCode or deviceCode to be flexible (since frontend uses userCode as deviceCode parameter)
    const deviceCodeDoc = await DeviceCode.findOne({
      $or: [{ deviceCode }, { userCode: deviceCode }],
      status: "pending",
    });

    if (!deviceCodeDoc) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired authorization code",
      });
    }

    deviceCodeDoc.status = "authorized";
    deviceCodeDoc.userId = new Types.ObjectId(req.user.id);
    await deviceCodeDoc.save();

    return res.status(200).json({
      success: true,
      message: "Terminal authorized successfully",
    });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, message: error });
  }
};

// CLI polls for token (POST /api/auth/device/token)
export const checkDeviceToken = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { deviceCode } = req.body;
    if (!deviceCode) {
      return res
        .status(400)
        .json({ success: false, message: "Device code is required" });
    }

    const doc = await DeviceCode.findOne({ deviceCode });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Code expired or invalid. Please run login again.",
      });
    }

    if (doc.status === "pending") {
      return res.status(200).json({
        success: true,
        data: {
          status: "pending",
        },
      });
    }

    if (doc.status === "authorized") {
      const user = await User.findById(doc.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const token = signToken(user);

      // Clean up the device code
      await DeviceCode.deleteOne({ _id: doc._id });

      return res.status(200).json({
        success: true,
        data: {
          status: "authorized",
          token,
          user,
        },
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Code expired or invalid" });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, message: error });
  }
};
