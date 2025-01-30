import Product from "../models/product.js";
import { orderItemType } from "../types/order.js";

export const reduceStock = async (orderItems: orderItemType[]) => {
  orderItems.forEach(async (item: orderItemType) => {
    const product = await Product.findById(item.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    if (item.quantity > product.stock) {
      throw new Error("Invalid item quantity selected");
    } else product.stock -= item.quantity;

    await product.save();
  });
};
