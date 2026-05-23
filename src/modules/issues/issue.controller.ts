import { Request, Response } from "express";
import pool from "../../db/pool.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";

/* CREATE ISSUE */
export const createIssue = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { title, description, type } = req.body;

    if (title.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: "Title max length is 150",
      });
    }

    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: "Description minimum 20 characters",
      });
    }

    if (!["bug", "feature_request"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: "Invalid issue type",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO issues(title,description,type,reporter_id)
      VALUES($1,$2,$3,$4)
      RETURNING *
      `,
      [title, description, type, req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message,
    });
  }
};