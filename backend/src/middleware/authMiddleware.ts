import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided or token is malformed" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid" });
  }
};
