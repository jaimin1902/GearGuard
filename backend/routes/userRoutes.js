import express from "express";
import {
  getAllUsers,
  getTechnicians,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/technicians", getTechnicians);

export default router;

