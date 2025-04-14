import mongoose from "mongoose";

interface IProduct extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: string;
  price: number;
  stock: number;
  photo: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
    },
    category: {
      type: String,
      required: [true, "Category name is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
    },
    photo: {
      type: String,
      required: [true, "Photo is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model<IProduct>("Product", schema);

export default Product;
