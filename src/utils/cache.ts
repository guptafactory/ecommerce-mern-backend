import { myCache } from "../app.js";
import { InvalidateCacheProps } from "../types/cache.js";

export const invalidateCache = ({
  product,
  order,
  admin,
  productId,
  userId,
  orderId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "admin-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((id) => productKeys.push(`product-${id}`));

    myCache.del(productKeys);
  }

  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `orders-user-${userId}`,
      `order-${orderId}`,
    ];
    myCache.del(orderKeys);
  }

  if (admin) {
    const adminKeys: string[] = [
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ];
    myCache.del(adminKeys);
  }
};
