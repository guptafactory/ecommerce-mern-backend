import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/error-handler.js";
import { ControllerType } from "../types/user.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message ||= "Internal server error";
  err.statusCode ||= 500;

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export function TryCatch(func: ControllerType) {
  return function (req: Request, res: Response, next: NextFunction) {
    return Promise.resolve(func(req, res, next)).catch(next);
  };
}
