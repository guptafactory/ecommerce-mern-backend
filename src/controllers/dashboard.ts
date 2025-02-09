import { myCache } from "../app.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import User from "../models/user.js";

import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/error-handler.js";
import { calculatePercent } from "../utils/dashboard.js";

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

    console.log("Today: ", today);
    console.log("Curr:", currMonth);
    console.log("Prev:", prevMonth);

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

    const latestTransactionsPromise = Order.find()
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
      latestTransactions,
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
      latestTransactionsPromise,
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

    const categoriesCountPromise = categories.map((category) =>
      Product.countDocuments({ category })
    );
    const categoriesCount = await Promise.all(categoriesCountPromise);

    const categoryCount: Record<string, number>[] = [];

    categories.forEach((category, i) => {
      categoryCount.push({
        [category]: Math.round((categoriesCount[i] / productsCount) * 100),
      });
    });

    const userRatio = {
      male: usersCount - femaleUsers,
      female: femaleUsers,
    };

    stats = {
      categoryCount,
      changePercent,
      count,
      chart: {
        order: ordersMonthlyCount,
        revenue: ordersMonthlyRevenue,
      },
      userRatio,
      latestTransactions,
    };

    // myCache.set("admin-stats", stats);
  }

  return res.status(200).json({
    success: true,
    message: "Stats fetched successfully",
    stats,
  });
});

export const getLineCharts = TryCatch(async (req, res, next) => {});

export const getPieCharts = TryCatch(async (req, res, next) => {});

export const getBarCharts = TryCatch(async (req, res, next) => {});
