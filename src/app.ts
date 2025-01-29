import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import NodeCache from "node-cache";

import { connectDb } from "./utils/db.js";
import { errorMiddleware } from "./middlewares/error.js";

import userRoutes from "./routes/user.js";
import productRoutes from "./routes/product.js";

dotenv.config();
connectDb();

export const myCache = new NodeCache();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to ecommerce backend");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
