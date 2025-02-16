import { myCache } from "../app.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import User from "../models/user.js";

import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/error-handler.js";
import { calculatePercent } from "../utils/dashboard.js";
import { getCategories } from "../utils/order.js";

export const getStats = TryCatch(async (req, res, next) => {
  let stats;

  if (myCache.has("admin-stats"))
    stats = JSON.parse(myCache.get("admin-stats") as string);
  else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const currMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1), // First day of current month
      end: today, // Current date and time
    };

    const prevMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1), // First day of previous month
      end: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999),
      // Last day of previous month
    };

    const currMonthProductsPromise = Product.find({
      createdAt: {
        $gte: currMonth.start,
        $lte: currMonth.end,
      },
    });
    const prevMonthProductsPromise = Product.find({
      createdAt: {
        $gte: prevMonth.start,
        $lte: prevMonth.end,
      },
    });

    const currMonthUsersPromise = User.find({
      createdAt: {
        $gte: currMonth.start,
        $lte: currMonth.end,
      },
    });
    const prevMonthUsersPromise = User.find({
      createdAt: {
        $gte: prevMonth.start,
        $lte: prevMonth.end,
      },
    });

    const currMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: currMonth.start,
        $lte: currMonth.end,
      },
    });
    const prevMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: prevMonth.start,
        $lte: prevMonth.end,
      },
    });

    const last6MonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const latestOrdersPromise = Order.find()
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      currMonthProducts,
      currMonthUsers,
      currMonthOrders,
      prevMonthProducts,
      prevMonthUsers,
      prevMonthOrders,
      productsCount,
      usersCount,
      allOrders,
      last6MonthsOrders,
      categories,
      femaleUsers,
      latestOrders,
    ] = await Promise.all([
      currMonthProductsPromise,
      currMonthUsersPromise,
      currMonthOrdersPromise,
      prevMonthProductsPromise,
      prevMonthUsersPromise,
      prevMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find().select("total"),
      last6MonthsOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestOrdersPromise,
    ]);

    const currMonthRevenue = currMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const prevMonthRevenue = prevMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const changePercent = {
      revenue: calculatePercent(currMonthRevenue, prevMonthRevenue),
      product: calculatePercent(
        currMonthProducts.length,
        prevMonthProducts.length
      ),
      user: calculatePercent(currMonthUsers.length, prevMonthUsers.length),
      order: calculatePercent(currMonthOrders.length, prevMonthOrders.length),
    };

    const totalRevenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      totalRevenue,
      product: productsCount,
      user: usersCount,
      order: allOrders.length,
    };

    const ordersMonthlyCount = new Array(6).fill(0);
    const ordersMonthlyRevenue = new Array(6).fill(0);

    last6MonthsOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = today.getMonth() - creationDate.getMonth();

      if (monthDiff < 6) {
        ordersMonthlyCount[6 - monthDiff - 1] += 1;
        ordersMonthlyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const categoryCount = await getCategories({ categories, productsCount });

    const userRatio = {
      male: usersCount - femaleUsers,
      female: femaleUsers,
    };

    const modifiedLatestOrders = latestOrders.map((order) => ({
      _id: order._id,
      discount: order.discount,
      amount: order.total,
      quantity: order.orderItems.length,
      status: order.status,
    }));

    stats = {
      categoryCount,
      changePercent,
      count,
      chart: {
        order: ordersMonthlyCount,
        revenue: ordersMonthlyRevenue,
      },
      userRatio,
      latestTransactions: modifiedLatestOrders,
    };

    myCache.set("admin-stats", JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    message: "Stats fetched successfully",
    stats,
  });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  if (myCache.has("admin-pie-charts")) {
    charts = JSON.parse(myCache.get("admin-pie-charts") as string);
  } else {
    const allOrdersPromise = Order.find().select([
      "subtotal",
      "total",
      "discount",
      "tax",
      "shippingCharges",
    ]);

    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      cancelledOrder,
      categories,
      productsCount,
      outOfStock,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Order.countDocuments({ status: "Cancelled" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find().select("dob"),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFulfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategories = await getCategories({
      categories,
      productsCount,
    });

    const stockAvailability = {
      inStock: productsCount - outOfStock,
      outOfStock,
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const marketingCost = Math.round(grossIncome * (30 / 100)); // for simplicity

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const burn = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0); // for simplicity

    const netMargin =
      grossIncome - productionCost - marketingCost - discount - burn;

    const revenueDistribution = {
      productionCost,
      marketingCost,
      discount,
      burn,
      netMargin,
    };

    const usersAgeGroup = {
      teen: allUsers.filter((user) => user.age < 20).length,
      adult: allUsers.filter((user) => user.age >= 20 && user.age < 40).length,
      old: allUsers.filter((user) => user.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminUsers,
      customer: customerUsers,
    };

    charts = {
      orderFulfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      adminCustomer,
      usersAgeGroup,
    };

    myCache.set("admin-pie-charts", JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    message: "Pie chart fetched successfully",
    charts,
  });
});

export const getBarCharts = TryCatch(async (req, res, next) => {});

export const getLineCharts = TryCatch(async (req, res, next) => {});
