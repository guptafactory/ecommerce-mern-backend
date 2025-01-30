import { Request } from "express";

import Order from "../models/order.js";
import { NewOrderRequestBody, orderItemType } from "../types/order.js";
import { reduceStock } from "../utils/product-stock.js";

import ErrorHandler from "../utils/error-handler.js";
import { TryCatch } from "../middlewares/error.js";
import { invalidateCache } from "../utils/cache.js";
import { myCache } from "../app.js";

export const createNewOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
      orderItems,
    } = req.body;

    if (!shippingInfo || !user || !subtotal || !tax || !total) {
      return next(
        new ErrorHandler("Please provide all the required fields", 400)
      );
    }

    if (!orderItems || orderItems.length === 0) {
      return next(new ErrorHandler("Order items cannot be empty", 400));
    }

    const order = await Order.create({
      shippingInfo,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
      orderItems,
    });

    await reduceStock(orderItems);

    await invalidateCache({ product: true, order: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  }
);

export const getMyOrders = TryCatch(async (req, res, next) => {
  const { id: userId } = req.query;

  let orders = [];
  const cacheKey = `user-${userId}`;

  if (myCache.has(cacheKey)) {
    orders = JSON.parse(myCache.get(cacheKey) as string);
  } else {
    orders = await Order.find({ user: userId });

    if (!orders || !orders.length) {
      return next(new ErrorHandler("No order items provided", 400));
    }
    myCache.set(cacheKey, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    message: `Found ${orders.length} orders`,
    orders,
  });
});

export const getAllOrders = TryCatch(async (req, res, next) => {
  let orders = [];
  const cacheKey = "all-orders";

  if (myCache.has(cacheKey)) {
    orders = JSON.parse(myCache.get(cacheKey) as string);
  } else {
    orders = await Order.find().populate("user", "name");

    myCache.set(cacheKey, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    message: `Found ${orders.length} order(s)`,
    orders,
  });
});

export const getOrderById = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  let order;
  const cacheKey = `order-${id}`;

  if (myCache.has(cacheKey)) {
    order = JSON.parse(myCache.get(cacheKey) as string);
  } else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) {
      return next(new ErrorHandler("Invalid order Id", 400));
    }
    myCache.set(cacheKey, JSON.stringify(order));
  }

  return res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    order,
  });
});

export const updateOrderById = TryCatch(async (req, res, next) => {});

export const deleteOrderById = TryCatch(async (req, res, next) => {});
