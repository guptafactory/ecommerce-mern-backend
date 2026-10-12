import Product from "../models/product.js";

export const calculatePercent = (
  currMonth: number,
  prevMonth: number
): number => {
  if (prevMonth === 0) return Number((currMonth * 100).toFixed(0));

  const percent = (currMonth / prevMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getCategories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );
  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

interface chartDataDoc {
  createdAt: Date;
  discount?: number;
  total?: number;
}

type chartDataProps = {
  length: number;
  docsArr: chartDataDoc[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docsArr,
  today,
  property,
}: chartDataProps) => {
  const data: number[] = new Array(length).fill(0);

  docsArr.forEach((curr) => {
    const creationDate = curr.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += curr[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};
