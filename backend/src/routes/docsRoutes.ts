import express from "express";
import { DocsController } from "../controllers/DocsController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware";
import { uploadRateLimit } from "../middleware/rateLimit";

const router = express.Router();

// Document routes
router.post(
  "/docs", 
  authMiddleware, 
  uploadRateLimit, 
  DocsController.uploadMiddleware, 
  DocsController.uploadDocument
);

router.get("/docs", optionalAuthMiddleware, DocsController.getDocuments);
router.get("/docs/:id", optionalAuthMiddleware, DocsController.getDocumentById);
router.delete("/docs/:id", authMiddleware, DocsController.deleteDocument);
router.post("/docs/:id/share", authMiddleware, DocsController.generateShareToken);

export default router;