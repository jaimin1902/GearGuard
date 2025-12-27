import express from "express";
import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
} from "../controllers/teamController.js";

const router = express.Router();

router.get("/", getAllTeams);
router.get("/:id", getTeamById);
router.post("/", createTeam);
router.put("/:id", updateTeam);
router.post("/:id/members", addTeamMember);
router.delete("/:id/members/:userId", removeTeamMember);

export default router;

