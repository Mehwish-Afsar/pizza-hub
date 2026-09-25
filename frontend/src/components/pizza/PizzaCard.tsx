import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { createOrder, createPaymentCheckout } from "@/services/api";
import { currency } from "@/utils/format";
import type { Pizza } from "@/utils/pizza";

export function PizzaCard({ pizza }: { pizza: Pizza }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);

  const orderNow = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to place an order.");
      navigate("/login");
      return;
    }

    setOrdering(true);
    try {
      const orderRes = await createOrder({ pizzaId: pizza.id, quantity: 1 });
      if (!orderRes.success) {
        toast.error(orderRes.message);
        return;
      }

      const paymentRes = await createPaymentCheckout(orderRes.data.id);
      if (!paymentRes.success) {
        toast.error(paymentRes.message);
        return;
      }

      window.location.href = paymentRes.data.checkoutUrl;
    } finally {
      setOrdering(false);
    }
  };

  return (
    <article className="card-soft card-hover flex flex-col overflow-hidden">
      <img
        src={pizza.image}
        alt={`${pizza.name} pizza`}
        loading="lazy"
        width={800}
        height={600}
        className="h-48 w-full object-cover"
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <h3 className="truncate text-lg font-bold">{pizza.name}</h3>
          <span className="shrink-0 text-lg font-extrabold text-primary">
            {currency(pizza.price)}
          </span>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">{pizza.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {pizza.ingredients.map((ing) => (
            <span
              key={ing}
              className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
            >
              {ing}
            </span>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/pizza-builder">Customize</Link>
          </Button>

          <Button className="flex-1" onClick={orderNow} disabled={ordering}>
            {ordering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ordering ? "Ordering..." : "Order Now"}
          </Button>
        </div>
      </div>
    </article>
  );
}