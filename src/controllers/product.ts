import { Request } from "express";
import { rm } from "fs";
// import { faker } from "@faker-js/faker";

import Product from "../models/product.js";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "./../types/product.js";
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

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, SearchRequestQuery>, res, next) => {
    const { search, minPrice, maxPrice, category, sort } = req.query;

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search) baseQuery.name = { $regex: String(search), $options: "i" };
    if (category) baseQuery.category = String(category);
    if (minPrice)
      baseQuery.price = {
        $gte: Number(minPrice),
      };
    if (maxPrice)
      baseQuery.price = {
        ...baseQuery.price,
        $lte: Number(maxPrice),
      };

    const [filteredOnlyProducts, finalProducts] = await Promise.all([
      Product.find(baseQuery),
      Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPage = Math.ceil(filteredOnlyProducts.length / limit);

    return res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      products: finalProducts,
      totalPage,
    });
  }
);

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

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\f85ca35-c53e-4c08-8a20-4f31b5402919.jpg",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department().toLowerCase(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({
//     success: true,
//     message: "Random products created successfully",
//   });
// };

// const deleteRandomProducts = async (skip: number = 10) => {
//   const products = await Product.find({}).skip(skip);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({
//     success: true,
//     message: "Random products deleted successfully",
//   });
// };

// generateRandomProducts(20);
// deleteRandomProducts(1);
