import express from "express";
import {
  getAllWorkCenters,
  getWorkCenterById,
  createWorkCenter,
  updateWorkCenter,
} from "../controllers/workCenterController.js";

const router = express.Router();

router.get("/", getAllWorkCenters);
router.get("/:id", getWorkCenterById);
router.post("/", createWorkCenter);
router.put("/:id", updateWorkCenter);

export default router;

