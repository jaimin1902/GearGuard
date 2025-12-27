import express from "express";
import {
  getDashboardStats,
  getDashboardTable,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getDashboardStats);
router.get("/table", getDashboardTable);

export default router;

