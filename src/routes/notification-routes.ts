import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { NotificationController } from "../controllers/notification-controller";

const router = Router();

router.get("/", authenticate, NotificationController.getAll);

export default router;
