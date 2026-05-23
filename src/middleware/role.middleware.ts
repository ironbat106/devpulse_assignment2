import type { NextFunction, Response } from "express";
import type { AuthRequest } from "./auth.middleware";

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          errors: "No user in request",
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
          errors: "Insufficient permissions",
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        errors: "Role check failed",
      });
    }
  };
};