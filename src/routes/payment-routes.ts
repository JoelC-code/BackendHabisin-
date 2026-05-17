import { Router } from "express";
import { PaymentController } from "../controllers/payment-controller";
import { authenticate } from "../middleware/auth";

// console.log("✅ payment-routes.ts loaded");

const router = Router();

// Webhook dari Midtrans — TIDAK pake authenticate karena Midtrans yg panggil
router.post("/notification", PaymentController.notification);

// Endpoint untuk user yang udah login
router.post("/subscribe", authenticate, PaymentController.subscribe);
router.get("/status", authenticate, PaymentController.getStatus);

export default router;