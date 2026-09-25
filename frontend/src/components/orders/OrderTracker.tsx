import { Check, Circle, Loader2 } from "lucide-react";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "../../utils/orderStatus";

export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <ol className="space-y-1">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step}>
            <div className="flex items-center gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                  done
                    ? "border-success bg-success text-success-foreground"
                    : active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </span>
              <div className="min-w-0">
                <p className={`truncate font-semibold ${active ? "text-primary" : done ? "" : "text-muted-foreground"}`}>
                  {ORDER_STATUS_LABELS[step]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {done ? "Completed" : active ? "In progress" : "Pending"}
                </p>
              </div>
            </div>
            {index < ORDER_STATUS_FLOW.length - 1 && (
              <span
                className={`ml-4 block h-6 w-0.5 ${index < currentIndex ? "bg-success" : "bg-border"}`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}