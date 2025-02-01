import express from "express";
import dotenv from "dotenv";
import NodeCache from "node-cache";
import morgan from "morgan";

import userRoutes from "./routes/user.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import dashboardRoutes from "./routes/dashboard.js";

import { errorMiddleware } from "./middlewares/error.js";
import { connectDb } from "./utils/db.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "";

connectDb(mongoURI);

export const myCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Welcome to ecommerce backend");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
