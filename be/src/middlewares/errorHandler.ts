import { Request, Response, NextFunction } from "express";
import logger from "../services/logger/logger";

// Wrapper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// General error handler middleware
const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ service: "General Error Handler", message: "Unhandled error occurred", payload: err });
    res.status(500).json({ success: false, message: "An unexpected error occurred", error: err });
};

export { asyncHandler, errorHandler };
