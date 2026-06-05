import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { CatalogController } from "../controllers/catalog-controller";

const router = Router();

// Login wajib supaya kita tahu tier user (premium dikunci untuk free).
router.use(authenticate);

router.get("/", CatalogController.list);
router.get("/categories", CatalogController.categories);
router.get("/:id", CatalogController.getById);

export default router;
