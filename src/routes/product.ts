import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { createNewProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

// /api/v1/product/new
router.post("/new", singleUpload, createNewProduct);

export default router;
