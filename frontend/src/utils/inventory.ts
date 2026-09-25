export type AdminInventoryItem = {
  id: string;
  name: string;
  category: "base" | "sauce" | "cheese" | "vegetable";
  stock: number;
  threshold: number;
  price: number;
};

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export function stockStatus(item: { stock: number; threshold: number }): StockStatus {
  if (item.stock <= 0) return "Out of Stock";
  if (item.stock <= item.threshold) return "Low Stock";
  return "In Stock";
}

export const CATEGORY_LABELS: Record<AdminInventoryItem["category"], string> = {
  base: "Pizza Bases",
  sauce: "Sauces",
  cheese: "Cheeses",
  vegetable: "Vegetables",
};