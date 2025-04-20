import { NextFunction, Request, Response } from "express";
import User from "../models/user.js";
import { NewUserRequestBody } from "../types/user.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/error-handler.js";

export const createNewUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { _id, name, email, photo, gender, dob } = req.body;

    let user = await User.findById(_id);
    if (user)
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
      });

    if (!_id || !name || !email || !photo || !gender || !dob) {
      return next(new ErrorHandler("Please fill all fields", 400));
    }

    user = await User.create({
      _id,
      name,
      email,
      photo,
      gender,
      dob: new Date(dob),
    });

    return res.status(201).json({
      success: true,
      message: `Welcome ${user.name}`,
      user,
    });
  }
);

export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find();

  return res.status(200).json({
    success: true,
    message: "All users fetched successfully",
    count: users.length,
    users,
  });
});

export const getUserById = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  return res.status(200).json({
    success: true,
    message: "User found successfully",
    user,
  });
});

export const deleteUserById = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
