import { myCache } from "../app.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import User from "../models/user.js";

import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/error-handler.js";
import { calculatePercent, getChartData } from "../utils/dashboard.js";
import { getCategories } from "../utils/dashboard.js";

export const getStats = TryCatch(async (req, res, next) => {
  let stats;
  const key = "admin-stats";
  if (myCache.has(key)) stats = JSON.parse(myCache.get(key) as string);
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

    const ordersMonthlyCount = getChartData({
      length: 6,
      today,
      docsArr: last6MonthsOrders,
    });

    const ordersMonthlyRevenue = getChartData({
      length: 6,
      today,
      docsArr: last6MonthsOrders,
      property: "total",
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

    myCache.set(key, JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    message: "Stats fetched successfully",
    stats,
  });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-pie-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
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

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    message: "Pie charts fetched successfully",
    charts,
  });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-bar-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const last6MonthsProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const last6MonthsUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const last12MonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      last6MonthsProductsPromise,
      last6MonthsUsersPromise,
      last12MonthsOrdersPromise,
    ]);

    const productsCount = getChartData({ length: 6, today, docsArr: products });
    const usersCount = getChartData({
      length: 6,
      today,
      docsArr: users,
    });
    const ordersCount = getChartData({
      length: 12,
      today,
      docsArr: orders,
    });

    charts = {
      users: usersCount,
      products: productsCount,
      orders: ordersCount,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    message: "Bar charts fetched successfully",
    charts,
  });
});

export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-line-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);

    const productsCount = getChartData({
      length: 12,
      today,
      docsArr: products,
    });
    const usersCount = getChartData({
      length: 12,
      today,
      docsArr: users,
    });
    const discount = getChartData({
      length: 12,
      today,
      docsArr: orders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docsArr: orders,
      property: "total",
    });

    charts = {
      users: usersCount,
      products: productsCount,
      discounts: discount,
      revenues: revenue,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    message: "Line charts fetched successfully",
    charts,
  });
});
