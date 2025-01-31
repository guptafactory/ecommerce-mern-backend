import { Request } from "express";

import Order from "../models/order.js";
import { myCache } from "../app.js";
import { NewOrderRequestBody } from "../types/order.js";

import { invalidateCache } from "../utils/cache.js";
import { reduceStock } from "../utils/product-stock.js";
import ErrorHandler from "../utils/error-handler.js";
import { TryCatch } from "../middlewares/error.js";

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

    await invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: orderItems.map((order) => order.productId),
    });

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
  const cacheKey = `orders-user-${userId}`;

  if (myCache.has(cacheKey)) {
    orders = JSON.parse(myCache.get(cacheKey) as string);
  } else {
    orders = await Order.find({ user: userId });

    if (!orders) {
      return next(new ErrorHandler("Orders not found", 404));
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
  const { id: orderId } = req.params;
  let order;
  const cacheKey = `order-${orderId}`;

  if (myCache.has(cacheKey)) {
    order = JSON.parse(myCache.get(cacheKey) as string);
  } else {
    order = await Order.findById(orderId).populate("user", "name");

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }
    myCache.set(cacheKey, JSON.stringify(order));
  }

  return res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    order,
  });
});

export const processOrderById = TryCatch(async (req, res, next) => {
  const { id: orderId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    case "Delivered":
      return next(new ErrorHandler("Order already delivered", 400));
    case "Cancelled":
      return next(new ErrorHandler("Order is cancelled", 400));
    default:
      return next(new ErrorHandler("Invalid order status", 400));
  }

  await order.save();

  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId,
  });

  return res.status(200).json({
    success: true,
    message: "Order processed successfully",
    status: order.status,
  });
});

export const deleteOrderById = TryCatch(async (req, res, next) => {
  const { id: orderId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  await order.deleteOne();

  ///TODO - add stock back to the products & invalidate product caches also

  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId,
  });

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

// Cache keys - all-orders, order-{id}, orders-user-{id}
