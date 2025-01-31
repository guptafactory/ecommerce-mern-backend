export interface InvalidateCacheProps {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  productId?: string | string[];
  userId?: string;
  orderId?: string;
}
