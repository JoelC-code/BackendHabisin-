import { Router } from "express";
import { getAll } from "../controllers/category-controller";
import {authenticate} from "../middleware/auth";

const router = Router();

router.get("/",    getAll);
export default router;
