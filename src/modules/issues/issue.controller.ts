import { Request, Response } from "express";
import pool from "../../server.js";

/* CREATE ISSUE */
export const createIssue = async (req: any, res: Response) => {
  const { title, description, type } = req.body;

  const result = await pool.query(
    `INSERT INTO issues(title,description,type,reporter_id)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [title, description, type, req.user.id]
  );

  res.status(201).json({
    success: true,
    message: "Issue created successfully",
    data: result.rows[0],
  });
};

/* GET ALL */
export const getIssues = async (req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT * FROM issues ORDER BY id DESC"
  );

  res.json({ success: true, data: result.rows });
};

/* SINGLE */
export const getSingleIssue = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT * FROM issues WHERE id=$1",
    [id]
  );

  res.json({ success: true, data: result.rows[0] });
};

/* UPDATE */
export const updateIssue = async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, description, type } = req.body;

  const result = await pool.query(
    `UPDATE issues SET title=$1,description=$2,type=$3,updated_at=NOW()
     WHERE id=$4 RETURNING *`,
    [title, description, type, id]
  );

  res.json({
    success: true,
    message: "Issue updated",
    data: result.rows[0],
  });
};

/* DELETE */
export const deleteIssue = async (req: any, res: Response) => {
  const { id } = req.params;

  await pool.query("DELETE FROM issues WHERE id=$1", [id]);

  res.json({
    success: true,
    message: "Issue deleted successfully",
  });
};