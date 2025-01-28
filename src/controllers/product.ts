import { Request } from "express";

import Product from "../models/product.js";
import { TryCatch } from "../middlewares/error.js";
import { NewProductRequestBody } from "./../types/product.js";
import ErrorHandler from "../utils/error-handler.js";

export const createNewProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, category, price, stock } = req.body;
    const photo = req.file;

    if (!name || !category || !price || !stock || !photo) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    if (isNaN(Number(price)) || isNaN(Number(stock))) {
      return next(new ErrorHandler("Price and stock must be numbers", 400));
    }

    const product = await Product.create({
      name,
      category: category.toLowerCase(),
      price,
      stock,
      photo: photo?.path,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  }
);
