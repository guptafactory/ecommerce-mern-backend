import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  createNewProduct,
  deleteProductById,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getProductById,
  updateProductbyId,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

// Create new product: /api/v1/product/new
router.post("/new", adminOnly, singleUpload, createNewProduct);

// Get all categories: /api/v1/product/categories
router.get("/categories", getAllCategories);

// Get last 10 products: /api/v1/product/latest
router.get("/latest", getLatestProducts);

// Get all products (with filters): /api/v1/product/latest
router.get("/all", getAllProducts);

// Get all products: /api/v1/product/all
router.get("/admin-products", adminOnly, getAdminProducts);

// Perform CRUD on a product: /api/v1/product/dynamic_id
router
  .route("/:id")
  .get(getProductById)
  .put(adminOnly, singleUpload, updateProductbyId)
  .delete(adminOnly, deleteProductById);

export default router;
