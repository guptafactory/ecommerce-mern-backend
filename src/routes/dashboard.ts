import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  getBarCharts,
  getLineCharts,
  getPieCharts,
  getStats,
} from "../controllers/dashboard.js";

const router = express.Router();

// /api/v1/dashboard/stats
router.get("/stats", adminOnly, getStats);

// /api/v1/dashboard/pie
router.get("/pie", adminOnly, getPieCharts);

// /api/v1/dashboard/bar
router.get("/bar", adminOnly, getBarCharts);

// /api/v1/dashboard/line
router.get("/line", adminOnly, getLineCharts);

export default router;
