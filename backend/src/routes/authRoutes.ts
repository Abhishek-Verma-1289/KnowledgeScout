import express from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middleware/authMiddleware";
import { authRateLimit } from "../middleware/rateLimit";

const router = express.Router();

// Authentication routes
router.post("/register", authRateLimit, AuthController.register);
router.post("/login", authRateLimit, AuthController.login);
router.get("/profile", authMiddleware, AuthController.getProfile);

export default router;