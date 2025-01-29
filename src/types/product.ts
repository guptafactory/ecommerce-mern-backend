export interface NewProductRequestBody {
  name: string;
  category: string;
  price: Number;
  stock: Number;
}

export type SearchRequestQuery = {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $gte?: number;
    $lte?: number;
  };
  category?: string;
}
