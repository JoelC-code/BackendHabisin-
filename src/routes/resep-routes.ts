// routes/resep-routes.ts
import { Router } from "express";
import { ResepController } from "../controllers/resep-controller";
import { authenticate } from "../middleware/auth";
import { checkSubscription } from "../middleware/subscription-middleware";

const router = Router();

// Semua route resep dilindungi oleh 2 gembok: Login & Subscribe
router.use(authenticate);
router.use(checkSubscription);
router.post("/generate", ResepController.generate);
router.get("/all", ResepController.getAll);
router.get("/:id", ResepController.getById);
router.delete("/remove/:id", ResepController.remove);

export default router;