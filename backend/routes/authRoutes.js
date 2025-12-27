import express from "express";
import {
  signup,
  signin,
  forgotPassword,
  getCurrentUser,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/forgot-password", forgotPassword);
router.get("/me", authenticate, getCurrentUser);

export default router;

