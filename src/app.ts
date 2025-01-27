import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";

import userRoutes from "./routes/user.js";
import { connectDb } from "./utils/db.js";
import { errorMiddleware } from "./middlewares/error.js";

dotenv.config();
connectDb();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Welcome to ecommerce backend");
});

app.use("/api/v1/user", userRoutes);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
