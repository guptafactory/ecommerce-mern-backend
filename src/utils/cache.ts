import { myCache } from "../app.js";
import Product from "../models/product.js";
import { InvalidateCacheProps } from "../types/cache.js";

export const invalidateCache = async ({
  product,
  order,
  admin,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "admin-products",
    ];
    const products = await Product.find().select("_id");
    products.forEach((product) => {
      productKeys.push(`product-${product._id}`);
    });
    myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = ["", "", ""];
    myCache.del(orderKeys);
  }
  if (admin) {
    const adminKeys: string[] = ["", "", ""];
    myCache.del(adminKeys);
  }
};
