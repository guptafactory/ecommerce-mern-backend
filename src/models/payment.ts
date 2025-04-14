import mongoose from "mongoose";

interface IPayment extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  amount: number;
}

const couponSchema = new mongoose.Schema<IPayment>({
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

const Coupon = mongoose.model<IPayment>("Coupon", couponSchema);

export default Coupon;
