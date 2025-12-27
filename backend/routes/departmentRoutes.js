import express from "express";
import {
  getAllDepartments,
  createDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

router.get("/", getAllDepartments);
router.post("/", createDepartment);

export default router;

