import express from "express";
import {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  getCalendarRequests,
  getRequestStatistics,
} from "../controllers/requestController.js";

const router = express.Router();

router.get("/", getAllRequests);
router.get("/calendar", getCalendarRequests);
router.get("/statistics", getRequestStatistics);
router.get("/:id", getRequestById);
router.post("/", createRequest);
router.put("/:id", updateRequest);

export default router;

