import { Pizza } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
title,
subtitle,
children,
footer,
}: {
title: string;
subtitle: string;
children: ReactNode;
footer?: ReactNode | undefined;
}) {
return ( <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12"> <div className="w-full max-w-md"> <a
       href="/"
       className="mb-6 flex items-center justify-center gap-2"
     > <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"> <Pizza className="h-5 w-5" /> </span>

      <span className="text-xl font-extrabold">PizzaHub</span>
    </a>

    <div className="card-soft p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-6">{children}</div>
    </div>

    {footer && (
      <div className="mt-5 text-center text-sm text-muted-foreground">
        {footer}
      </div>
    )}
  </div>
</div>

);
}
