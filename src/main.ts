import "dotenv/config";
import express from "express";

import authRoutes       from "./routes/auth-routes";
import categoryRoutes   from "./routes/category-routes";
import foodRoutes       from "./routes/food-routes";
import DashboardRoutes  from "./routes/dashboard-routes";
import resepRoutes      from "./routes/resep-routes";
import { ResponseError } from "./errors/response-error";

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ─── Global middleware ────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/categories",  categoryRoutes);
app.use("/api/foods",       foodRoutes);
app.use("/api/dashboard",   DashboardRoutes);
app.use("/api/resep",       resepRoutes);

// ─── Health check ─────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 catch-all ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ResponseError) {
        res.status(err.status).json({ success: false, message: err.message });
    } else {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
