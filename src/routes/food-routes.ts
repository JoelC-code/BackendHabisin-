import { Router } from "express";
import { FoodController } from "../controllers/food-controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/all",FoodController.getAll);
router.get("/:id", FoodController.getById);
router.post("/create", authenticate, FoodController.create);
router.delete("/remove/:id", authenticate, FoodController.remove);

export default router;
