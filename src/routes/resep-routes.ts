// routes/resep-routes.ts
import { Router } from "express";
import { ResepController } from "../controllers/resep-controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Cukup login. Generate AI dibatasi kuota harian (cost-control) di service,
// bukan di-gate subscription — biar fitur andalan tetap bisa dipakai semua.
router.use(authenticate);

router.post("/generate", ResepController.generate);
router.post("/", ResepController.create);     // save / resep manual
router.get("/all", ResepController.getAll);
router.get("/:id", ResepController.getById);
router.delete("/remove/:id", ResepController.remove);

export default router;