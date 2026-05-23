import express from "express";
import {
  createIssue,
  getIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
} from "./issue.controller.js";

import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, createIssue);
router.get("/", getIssues);
router.get("/:id", getSingleIssue);
router.patch("/:id", authMiddleware, updateIssue);
router.delete("/:id", authMiddleware, deleteIssue);

export default router;