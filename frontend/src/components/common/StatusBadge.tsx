import { Badge } from "@/components/ui/badge";

type Tone = "success" | "warning" | "error" | "info" | "muted";

const toneClass: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-secondary/25 text-secondary-foreground border-secondary/50",
  error: "bg-destructive/12 text-destructive border-destructive/30",
  info: "bg-primary/10 text-primary border-primary/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  return (
    <Badge variant="outline" className={`rounded-full font-semibold ${toneClass[tone]}`}>
      {label}
    </Badge>
  );
}

export function paymentTone(status: string): Tone {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return "success";
  if (normalized === "pending") return "warning";
  return "error";
}

export function orderTone(status: string): Tone {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "SENT_TO_DELIVERY":
      return "info";
    case "IN_KITCHEN":
      return "warning";
    case "ORDER_RECEIVED":
      return "muted";
    case "CANCELLED":
      return "error";
    default:
      return "muted";
  }
}

export function stockTone(status: string): Tone {
  if (status === "In Stock") return "success";
  if (status === "Low Stock") return "warning";
  return "error";
}