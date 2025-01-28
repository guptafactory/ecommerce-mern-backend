import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  createNewProduct,
  deleteProductById,
  getAdminProducts,
  getAllCategories,
  getLatestProducts,
  getProductById,
  updateProductbyId,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

// /api/v1/product/new
router.post("/new", adminOnly, singleUpload, createNewProduct);

// /api/v1/product/latest
router.get("/latest", getLatestProducts);

// /api/v1/product/categories
router.get("/categories", getAllCategories);

// /api/v1/product/all
router.get("/admin-products", adminOnly, getAdminProducts);

// /api/v1/product/dynamic_id
router
  .route("/:id")
  .get(getProductById)
  .put(adminOnly, singleUpload, updateProductbyId)
  .delete(adminOnly, deleteProductById);

export default router;
