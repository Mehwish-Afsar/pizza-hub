import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { getPizzaOptions } from "@/services/api";
import type { BuilderOption } from "@/utils/pizza";

type BuilderState = {
  base: BuilderOption | null;
  sauce: BuilderOption | null;
  cheese: BuilderOption | null;
  veggies: BuilderOption[];
  quantity: number;
};

type BuilderOptions = {
  bases: BuilderOption[];
  sauces: BuilderOption[];
  cheeses: BuilderOption[];
  vegetables: BuilderOption[];
};

const EMPTY_OPTIONS: BuilderOptions = {
  bases: [],
  sauces: [],
  cheeses: [],
  vegetables: [],
};

type BuilderContextValue = BuilderState & {
  setBase: (o: BuilderOption) => void;
  setSauce: (o: BuilderOption) => void;
  setCheese: (o: BuilderOption) => void;
  toggleVeggie: (o: BuilderOption) => void;
  setQuantity: (n: number) => void;
  reset: () => void;
  options: BuilderOptions;
  optionsLoading: boolean;
  optionsError: boolean;
  subtotals: { base: number; sauce: number; cheese: number; veggies: number };
  unitPrice: number;
  total: number;
  isComplete: boolean;
};

const PizzaBuilderContext = createContext<BuilderContextValue | null>(null);

export function PizzaBuilderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BuilderState>({
    base: null,
    sauce: null,
    cheese: null,
    veggies: [],
    quantity: 1,
  });

  const [options, setOptions] = useState<BuilderOptions>(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getPizzaOptions().then((res) => {
      if (cancelled) return;

      if (res.success) {
        setOptions(res.data);
      } else {
        setOptionsError(true);
        toast.error(res.message || "Couldn't load ingredients.");
      }

      setOptionsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<BuilderContextValue>(() => {
    const subtotals = {
      base: state.base?.price ?? 0,
      sauce: state.sauce?.price ?? 0,
      cheese: state.cheese?.price ?? 0,
      veggies: state.veggies.reduce((sum, v) => sum + v.price, 0),
    };
    const unitPrice =
      subtotals.base + subtotals.sauce + subtotals.cheese + subtotals.veggies;

    return {
      ...state,
      options,
      optionsLoading,
      optionsError,
      subtotals,
      unitPrice,
      total: unitPrice * state.quantity,
      isComplete: Boolean(state.base && state.sauce && state.cheese),
      setBase: (base) => setState((s) => ({ ...s, base })),
      setSauce: (sauce) => setState((s) => ({ ...s, sauce })),
      setCheese: (cheese) => setState((s) => ({ ...s, cheese })),
      toggleVeggie: (veg) =>
        setState((s) => ({
          ...s,
          veggies: s.veggies.some((v) => v.id === veg.id)
            ? s.veggies.filter((v) => v.id !== veg.id)
            : [...s.veggies, veg],
        })),
      setQuantity: (quantity) =>
        setState((s) => ({
          ...s,
          quantity: Math.min(10, Math.max(1, quantity)),
        })),
      reset: () =>
        setState({
          base: null,
          sauce: null,
          cheese: null,
          veggies: [],
          quantity: 1,
        }),
    };
  }, [state, options, optionsLoading, optionsError]);

  return (
    <PizzaBuilderContext.Provider value={value}>
      {children}
    </PizzaBuilderContext.Provider>
  );
}

export function usePizzaBuilder() {
  const ctx = useContext(PizzaBuilderContext);
  if (!ctx)
    throw new Error(
      "usePizzaBuilder must be used inside <PizzaBuilderProvider>"
    );
  return ctx;
}