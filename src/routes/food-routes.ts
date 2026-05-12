import { Router } from "express";
import { FoodController } from "../controllers/food-controller";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload-middleware";

const router = Router();

router.get("/all", authenticate, FoodController.getAll);
router.get("/:id", authenticate, FoodController.getById);
router.post("/create", authenticate, upload.single('image'), FoodController.create);
router.delete("/remove/:id", authenticate, FoodController.remove);

export default router;
