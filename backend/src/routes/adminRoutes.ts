import express from "express";
import { AdminController } from "../controllers/AdminController";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Admin routes (all require admin access)
router.use(authMiddleware, adminMiddleware);

router.get("/admin/dashboard", AdminController.getDashboardStats);
router.get("/admin/users", AdminController.getUsers);
router.put("/admin/users/:id", AdminController.updateUser);
router.delete("/admin/users/:id", AdminController.deleteUser);
router.get("/admin/documents", AdminController.getAllDocuments);
router.get("/admin/logs", AdminController.getSystemLogs);

export default router;