import express from "express";
const router = express.Router();

import {
  createNewOrder,
  deleteOrderById,
  getMyOrders,
  getAllOrders,
  getOrderById,
  processOrderById,
} from "../controllers/order.js";
import { adminOnly } from "../middlewares/auth.js";

// Create new order: /api/v1/order/new
router.post("/new", createNewOrder);

// Get my orders: /api/v1/order/my
router.get("/my", getMyOrders);

// Get all orders: /api/v1/order/all
router.get("/all", adminOnly, getAllOrders);

// Perform CRUD on an order: /api/v1/order/dynamic_id
router
  .route("/:id")
  .get(getOrderById)
  .put(adminOnly, processOrderById)
  .delete(adminOnly, deleteOrderById);

export default router;
