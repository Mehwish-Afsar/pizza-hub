import { Link } from "react-router-dom";
import {
  ChefHat,
  ClipboardCheck,
  CreditCard,
  Sparkles,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import heroPizza from "@/assets/hero-pizza.jpg";
import { MainLayout } from "@/layouts/MainLayout";
import { PizzaCard } from "@/components/pizza/PizzaCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPizzas } from "@/services/api";
import type { Pizza } from "@/utils/pizza";

const steps = [
  { icon: ChefHat, title: "Build Your Pizza", text: "Choose your favorite ingredients." },
  { icon: ClipboardCheck, title: "Review Your Order", text: "Check your customized pizza." },
  { icon: CreditCard, title: "Pay Securely", text: "Complete your payment." },
  { icon: Truck, title: "Track Your Delivery", text: "Follow your order status." },
];

export function Home() {
  const [pizzas, setPizzas] = useState<Pizza[] | null>(null);

  useEffect(() => {
    getPizzas().then((res) => setPizzas(res.success ? res.data : []));
  }, []);

  return (
    <MainLayout>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Fresh dough baked
            to order
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Build Your <span className="text-primary">Perfect Pizza</span>
          </h1>

          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Choose your favorite base, sauce, cheese, and fresh vegetables.
            Create a pizza made exactly the way you like it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/pizza-builder">Build Your Pizza</Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link to="/menu">Explore Pizzas</Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ["30 min", "Avg delivery"],
              ["25+", "Fresh toppings"],
              ["4.9★", "Customer rating"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-extrabold text-primary">
                  {value}
                </dt>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-6 rounded-full bg-secondary/25 blur-3xl"
            aria-hidden
          />

          <img
            src={heroPizza}
            alt="Freshly baked margherita pizza with basil"
            width={1200}
            height={1200}
            className="relative w-full rounded-[2.5rem] object-cover shadow-[var(--shadow-lift)]"
          />
        </div>
      </section>

      <section id="popular" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-2 sm:flex sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-3xl font-extrabold">Popular Pizzas</h2>
            <p className="mt-1 text-muted-foreground">
              Crowd favourites, ready to customize.
            </p>
          </div>

          <Button asChild variant="ghost">
            <Link to="/menu">View full menu</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pizzas === null
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))
            : pizzas
                .slice(0, 6)
                .map((pizza) => <PizzaCard key={pizza.id} pizza={pizza} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-extrabold">How It Works</h2>

        <p className="mt-1 text-muted-foreground">
          From dough to doorstep in four simple steps.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="card-soft card-hover p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </span>

              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Step {i + 1}
              </p>

              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="card-soft flex flex-col items-center gap-4 bg-ink px-6 py-14 text-center text-ink-foreground">
          <h2 className="text-3xl font-extrabold">Hungry yet?</h2>

          <p className="max-w-md text-sm opacity-80">
            Start building your pizza now — pick a base, stack the toppings
            and we'll take it from there.
          </p>

          <Button asChild size="lg">
            <Link to="/pizza-builder">Start Building</Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}