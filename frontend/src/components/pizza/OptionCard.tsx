import { Check } from "lucide-react";
import { currency } from "@/utils/format";
import type { BuilderOption } from "@/utils/pizza";

export function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: BuilderOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`card-soft group relative w-full p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${
        selected ? "border-primary ring-2 ring-primary/40" : ""
      }`}
    >
      <span
        className={`absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border transition-colors ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-xl">🍕</span>
      <h3 className="mt-3 pr-8 font-bold">{option.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
      <p className="mt-3 font-extrabold text-primary">{currency(option.price)}</p>
    </button>
  );
}
