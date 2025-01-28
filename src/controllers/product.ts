import { Request } from "express";
import { rm } from "fs";

import Product from "../models/product.js";
import { TryCatch } from "../middlewares/error.js";
import { NewProductRequestBody } from "./../types/product.js";
import ErrorHandler from "../utils/error-handler.js";

export const createNewProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, category, price, stock } = req.body;
    const photo = req.file;

    if (!name || !category || !price || !stock || !photo) {
      if (photo) {
        rm(photo.path, (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log("File deleted successfully");
          }
        });
      }
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
      photo: photo.path,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  }
);

export const getLatestProducts = TryCatch(async (req, res, next) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(5);

  return res.status(200).json({
    success: true,
    message: "Latest products fetched successfully",
    products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  const categories = await Product.distinct("category");

  return res.status(200).json({
    success: true,
    message: "All categories fetched successfully",
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  const products = await Product.find();

  return res.status(200).json({
    success: true,
    message: "All products fetched successfully",
    products,
  });
});

export const getProductById = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Invalid product Id", 400));
  }

  return res.status(200).json({
    success: true,
    message: "Product details fetched successfully",
    product,
  });
});

export const updateProductbyId = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, category, price, stock } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);

  if (!product) {
    if (photo) {
      rm(photo.path, (err) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log("New photo deleted successfully");
        }
      });
    }
    return next(new ErrorHandler("Invalid product Id ", 400));
  }

  if (photo) {
    rm(product.photo, (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Old Photo deleted successfully");
      }
    });
    // new photo path set to product's photo path
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (category) product.category = category;
  if (price) product.price = Number(price);
  if (stock) product.stock = Number(stock);

  // console.log(product);
  await product.save();

  const newProd = await Product.findById(id);

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    newProd,
  });
});

export const deleteProductById = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 400));
  }

  rm(product.photo, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Photo deleted successfully");
    }
  });

  await product.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
