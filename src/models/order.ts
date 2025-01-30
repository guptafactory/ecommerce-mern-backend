import mongoose from "mongoose";

interface IUser extends mongoose.Document {
  shippingInfo: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: number;
  };
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  status: string;
  orderItems: [
    {
      name: string;
      photo: string;
      price: number;
      quantity: number;
      productId: string;
    }
  ];
}

const schema = new mongoose.Schema<IUser>(
  {
    shippingInfo: {
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      pinCode: {
        type: Number,
        required: [true, "pinCode is required"],
      },
    },
    user: {
      type: String,
      ref: "User",
      required: [true, "User is required"],
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
    },
    tax: {
      type: Number,
      required: [true, "Tax is required"],
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
    },
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    orderItems: [
      {
        name: {
          type: String,
          required: [true, "Name is required"],
        },
        photo: {
          type: String,
          required: [true, "Photo is required"],
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product Id is required"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model<IUser>("Order", schema);

export default Order;
