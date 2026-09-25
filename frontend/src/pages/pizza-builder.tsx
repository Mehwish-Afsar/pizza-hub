import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserLayout } from "@/layouts/UserLayout";
import { OptionCard } from "@/components/pizza/OptionCard";
import { Button } from "@/components/ui/button";
import { usePizzaBuilder } from "@/context/PizzaBuilderContext";
import { currency } from "@/utils/format";

const steps = ["Base", "Sauce", "Cheese", "Vegetables", "Summary"] as const;

function BuilderPage() {
  const [step, setStep] = useState(0);
  const builder = usePizzaBuilder();
  const navigate = useNavigate();

  const canContinue =
    (step === 0 && !!builder.base) ||
    (step === 1 && !!builder.sauce) ||
    (step === 2 && !!builder.cheese) ||
    step === 3 ||
    step === 4;

  const next = () => {
    if (!canContinue) {
      const currentStep = steps[step];

      if (currentStep) {
        toast.error(`Please choose a ${currentStep.toLowerCase()}`);
      }

      return;
    }

    if (step === 4) {
      navigate("/order-summary");
      return;
    }

    setStep((current) => current + 1);
  };

  return (
    <UserLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Build Your Pizza
        </h1>

        <p className="mt-1 text-muted-foreground">
          Your choices are saved as you move between steps.
        </p>

        <ol className="mt-8 flex flex-wrap items-center gap-2">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-black/10 text-xs">
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {label}
              </button>

              {i < steps.length - 1 && (
                <span className="hidden h-px w-6 bg-border sm:block" />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8">
          {step === 0 && (
            <Grid>
              {builder.options.bases.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  selected={builder.base?.id === option.id}
                  onSelect={() => builder.setBase(option)}
                />
              ))}
            </Grid>
          )}

          {step === 1 && (
            <Grid>
              {builder.options.sauces.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  selected={builder.sauce?.id === option.id}
                  onSelect={() => builder.setSauce(option)}
                />
              ))}
            </Grid>
          )}

          {step === 2 && (
            <Grid>
              {builder.options.cheeses.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  selected={builder.cheese?.id === option.id}
                  onSelect={() => builder.setCheese(option)}
                />
              ))}
            </Grid>
          )}

          {step === 3 && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Pick as many vegetables as you like.
              </p>

              <Grid>
                {builder.options.vegetables.map((option) => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    selected={builder.veggies.some(
                      (veggie) => veggie.id === option.id,
                    )}
                    onSelect={() => builder.toggleVeggie(option)}
                  />
                ))}
              </Grid>
            </>
          )}

          {step === 4 && (
            <div className="card-soft p-6">
              <h2 className="text-xl font-bold">Your Pizza</h2>

              <dl className="mt-5 space-y-3 text-sm">
                <Row
                  label="Base"
                  value={builder.base?.name ?? "—"}
                  price={builder.subtotals.base}
                />

                <Row
                  label="Sauce"
                  value={builder.sauce?.name ?? "—"}
                  price={builder.subtotals.sauce}
                />

                <Row
                  label="Cheese"
                  value={builder.cheese?.name ?? "—"}
                  price={builder.subtotals.cheese}
                />

                <Row
                  label="Vegetables"
                  value={
                    builder.veggies.length
                      ? builder.veggies.map((v) => v.name).join(", ")
                      : "None"
                  }
                  price={builder.subtotals.veggies}
                />
              </dl>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-lg font-extrabold">
                <span>Total</span>
                <span className="text-primary">
                  {currency(builder.unitPrice)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Running total:{" "}
              <strong>{currency(builder.unitPrice)}</strong>
            </span>

            <Button onClick={next}>
              {step === 4 ? "Review Pizza" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  price,
}: {
  label: string;
  value: string;
  price: number;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="font-semibold">{value}</dd>
      </div>

      <span className="shrink-0 font-semibold">{currency(price)}</span>
    </div>
  );
}

export default BuilderPage;