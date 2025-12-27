import express from "express";
import {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  getEquipmentRequests,
  scrapEquipment,
} from "../controllers/equipmentController.js";

const router = express.Router();

router.get("/", getAllEquipment);
router.get("/:id", getEquipmentById);
router.post("/", createEquipment);
router.put("/:id", updateEquipment);
router.get("/:id/requests", getEquipmentRequests);
router.post("/:id/scrap", scrapEquipment);

export default router;

