import { Pizza } from "lucide-react";

export function Footer() {
return ( <footer className="mt-24 border-t border-border bg-ink text-ink-foreground"> <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3"> <div> <a href="/" className="flex items-center gap-2"> <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground"> <Pizza className="h-4 w-4" /> </span> <span className="text-lg font-extrabold">PizzaHub</span> </a>

      <p className="mt-3 max-w-xs text-sm opacity-75">
        Fresh dough, bold sauces and a pizza builder that puts you in the kitchen.
      </p>
    </div>

    <div className="text-sm">
      <p className="font-semibold">Explore</p>
      <div className="mt-3 flex flex-col gap-2 opacity-80">
        <a href="/menu">Menu</a>
        <a href="/pizza-builder">Build Your Pizza</a>
        <a href="/orders">Order History</a>
      </div>
    </div>

    <div className="text-sm">
      <p className="font-semibold">Account</p>
      <div className="mt-3 flex flex-col gap-2 opacity-80">
        <a href="/login">Login</a>
        <a href="/register">Register</a>
        <a href="/admin/login">Admin</a>
      </div>
    </div>
  </div>

  <div className="border-t border-white/10 py-5 text-center text-xs opacity-60">
    © {new Date().getFullYear()} PizzaHub. Frontend demo — connect your own API.
  </div>
</footer>

);
}
