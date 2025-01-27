import express from "express";
import {
  createNewUser,
  deleteUserById,
  getAllUsers,
  getUserById,
} from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const router = express.Router();

// /api/v1/user/new
router.post("/new", createNewUser);

// /api/v1/user/all
router.get("/all", adminOnly, getAllUsers);

// /api/v1/user/dynamic_id
router
  .route("/:id")
  .get(adminOnly, getUserById)
  .delete(adminOnly, deleteUserById);

export default router;
