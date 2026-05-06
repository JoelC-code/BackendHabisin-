import { Router } from "express";
import { FoodController } from "../controllers/food-controller";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// Public
router.get("/all",FoodController.getAll);
router.get("/:id", FoodController.getById);

// Admin only
router.post("/", authenticate, requireAdmin, FoodController.create);
router.delete("/:id", authenticate, requireAdmin, FoodController.remove);

export default router;
