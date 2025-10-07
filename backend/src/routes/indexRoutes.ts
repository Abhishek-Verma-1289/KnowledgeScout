import express from "express";
import { IndexController } from "../controllers/IndexController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Index management routes
router.get("/index/stats", IndexController.getIndexStats);
router.post("/index/rebuild", authMiddleware, IndexController.rebuildIndex);
router.get("/index/health", IndexController.getIndexHealth);
router.delete("/index/cache", authMiddleware, IndexController.clearCache);

export default router;