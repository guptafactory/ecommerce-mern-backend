import { NextFunction, Request, Response } from "express";
import User from "../models/user.js";
import { NewUserRequestBody } from "../types/user.js";
import ErrorHandler from "../utils/error-handler.js";

export const newUser = async (
  req: Request<{}, {}, NewUserRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id, name, email, photo, gender, dob } = req.body;

    const user = await User.create({
      _id,
      name,
      email,
      photo,
      gender,
      dob: new Date(dob),
    });

    res.status(201).json({
      success: true,
      message: `Welcome ${user.name}`,
    });
  } catch (err) {
    next(err);
  }
};
