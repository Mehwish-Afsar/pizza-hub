import { useEffect, useState } from "react";

import { MainLayout } from "@/layouts/MainLayout";
import { PizzaCard } from "@/components/pizza/PizzaCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getPizzas } from "@/services/api";
import type { Pizza } from "@/utils/pizza";

export function MenuPage() {
  const [items, setItems] = useState<Pizza[] | null>(null);

  useEffect(() => {
    getPizzas().then((res) => {
      setItems(res.success ? res.data : []);
    });
  }, []);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-extrabold">Our Menu</h1>

        <p className="mt-2 text-muted-foreground">
          Every pizza can be customized in the builder.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items === null
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="card-soft overflow-hidden"
                >
                  <Skeleton className="h-48 w-full" />

                  <div className="space-y-3 p-5">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))
            : items.map((pizza) => (
                <PizzaCard
                  key={pizza.id}
                  pizza={pizza}
                />
              ))}
        </div>
      </div>
    </MainLayout>
  );
}
