import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { DashboardController } from "../controllers/DashboardController";

const router = Router();

router.get("/dashboard", authenticate, DashboardController.getDashboard)

export default router