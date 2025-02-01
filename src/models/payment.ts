import mongoose from "mongoose";

interface IUser extends mongoose.Document {
  code: string;
  amount: number;
}

const couponSchema = new mongoose.Schema<IUser>({
  code: {
    type: String,
    required: [true, "Coupon is required"],
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, "Discount Amount is required"],
  },
});

const Coupon = mongoose.model<IUser>("Coupon", couponSchema);

export default Coupon;
