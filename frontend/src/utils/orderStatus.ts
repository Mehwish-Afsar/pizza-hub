export type OrderStatus =
  | "ORDER_RECEIVED"
  | "IN_KITCHEN"
  | "SENT_TO_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_FLOW: Exclude<OrderStatus, "CANCELLED">[] = [
  "ORDER_RECEIVED",
  "IN_KITCHEN",
  "SENT_TO_DELIVERY",
  "DELIVERED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_RECEIVED: "Order Received",
  IN_KITCHEN: "In Kitchen",
  SENT_TO_DELIVERY: "Sent to Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};