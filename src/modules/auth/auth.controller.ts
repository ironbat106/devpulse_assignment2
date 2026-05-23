import type { Request, Response } from "express";
import pool from "../../db/pool";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";


export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const hashed = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users(name,email,password,role)
       VALUES ($1,$2,$3,$4)
       RETURNING id,name,email,role,created_at,updated_at`,
      [name, email, hashed, role]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!user.rows.length) {
      return res.status(404).json({
    success: false,
    message: "User not found",
    errors: null,
    });
    }

    const valid = await comparePassword(
      password,
      user.rows[0].password
    );

    if (!valid) {
      return res.status(401).json({ 
    success: false,
    message: "Wrong Password",
    errors: null,
    });
    }

    const token = generateToken({
      id: user.rows[0].id,
      name: user.rows[0].name,
      role: user.rows[0].role,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          role: user.rows[0].role,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};