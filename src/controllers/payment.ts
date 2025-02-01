import { TryCatch } from "../middlewares/error.js";
import Coupon from "../models/payment.js";
import ErrorHandler from "../utils/error-handler.js";

// Coupons
export const createNewCoupon = TryCatch(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount || isNaN(amount)) {
    return next(new ErrorHandler("Provide valid coupon details", 400));
  }

  const coupon = await Coupon.create({
    code,
    amount: Number(amount),
  });

  return res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    coupon,
  });
});

export const updateCouponById = TryCatch(async (req, res, next) => {
  const { id: couponId } = req.params;
  const { amount } = req.body;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new ErrorHandler("Invalid coupon Id", 404));

  if (!amount || isNaN(amount))
    return next(new ErrorHandler("Provide coupon Id", 400));

  coupon.amount = amount;
  await coupon.save();

  return res.status(200).json({
    success: true,
    message: "Coupon details updated successfully",
    coupon,
  });
});

export const deleteCouponById = TryCatch(async (req, res, next) => {
  const { id: couponId } = req.params;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new ErrorHandler("Invalid coupon Id", 404));

  await coupon.deleteOne();

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} deleted successfully`,
  });
});

export const getCouponById = TryCatch(async (req, res, next) => {
  const { id: couponId } = req.params;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new ErrorHandler("Invalid coupon Id", 404));

  return res.status(200).json({
    success: true,
    message: "Coupon details fetched successfully",
    coupon,
  });
});

export const getAllCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find();

  return res.status(200).json({
    success: true,
    message: "All Coupon details fetched successfully",
    coupons,
  });
});

// Discount
export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon: code } = req.query;

  const coupon = await Coupon.findOne({ code });

  if (!coupon) {
    if (!code) return next(new ErrorHandler("Coupon not found", 404));
  }

  return res.status(200).json({
    success: true,
    message: "Discount applied successfully",
    discount: coupon?.amount,
  });
});
