import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

    if (!token) {
    return res.status(401).json({
    success: false,
    message: "Token missing",
    });
}
    const decoded = verifyToken(token);

    req.user = decoded;

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};