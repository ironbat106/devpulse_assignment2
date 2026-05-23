import type { Request, Response } from "express";
import pool from "../../db/pool";
import type { AuthRequest } from "../../middleware/auth.middleware";


export const createIssue = async (req: AuthRequest, res: Response) => {
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


export const getIssues = async (req: Request, res: Response) => {
  try {
    const { sort = "newest", type, status } = req.query;

    let query = "SELECT * FROM issues";
    const values: any[] = [];
    const conditions: string[] = [];

    if (type) {
      values.push(type);
      conditions.push(`type=$${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`status=$${values.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query +=
      sort === "oldest"
        ? " ORDER BY created_at ASC"
        : " ORDER BY created_at DESC";

    const issuesResult = await pool.query(query, values);

    const issues = issuesResult.rows;

    const reporterIds = [
      ...new Set(issues.map((i) => i.reporter_id)),
    ];

    const usersResult = await pool.query(
      `SELECT id,name,role FROM users WHERE id = ANY($1::int[])`,
      [reporterIds]
    );

    const users = usersResult.rows;

    const formatted = issues.map((issue) => {
      const reporter = users.find((u) => u.id === issue.reporter_id);

      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message,
    });
  }
};


export const getSingleIssue = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const issueResult = await pool.query(
      "SELECT * FROM issues WHERE id=$1",
      [id]
    );

    if (!issueResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        errors: null,
      });
    }

    const issue = issueResult.rows[0];

    const userResult = await pool.query(
      "SELECT id,name,role FROM users WHERE id=$1",
      [issue.reporter_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...issue,
        reporter: userResult.rows[0] || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message,
    });
  }
};


export const updateIssue = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;

    const issueResult = await pool.query(
      "SELECT * FROM issues WHERE id=$1",
      [id]
    );

    if (!issueResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        errors: null,
      });
    }

    const issue = issueResult.rows[0];

    // contributor rule
    if (
      req.user.role === "contributor" &&
      issue.reporter_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: "Not your issue",
      });
    }

    if (
      req.user.role === "contributor" &&
      issue.status !== "open"
    ) {
      return res.status(409).json({
        success: false,
        message: "Conflict",
        errors: "Issue not open anymore",
      });
    }

    const updated = await pool.query(
      `
      UPDATE issues
      SET title=$1, description=$2, type=$3, updated_at=NOW()
      WHERE id=$4
      RETURNING *
      `,
      [title, description, type, id]
    );

    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message,
    });
  }
};


export const deleteIssue = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const issueResult = await pool.query(
      "SELECT * FROM issues WHERE id=$1",
      [id]
    );

    if (!issueResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        errors: null,
      });
    }

    await pool.query("DELETE FROM issues WHERE id=$1", [id]);

    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
      data: null,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message,
    });
  }
};