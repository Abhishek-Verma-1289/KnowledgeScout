import express from "express";
import { AskController } from "../controllers/AskController";
import { optionalAuthMiddleware } from "../middleware/authMiddleware";
import { askRateLimit } from "../middleware/rateLimit";

const router = express.Router();

// Q&A routes
router.post("/ask", optionalAuthMiddleware, askRateLimit, AskController.askQuestion);
router.get("/ask/history", optionalAuthMiddleware, AskController.getQueryHistory);

export default router;