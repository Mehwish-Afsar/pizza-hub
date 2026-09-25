import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Pizza, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/pizza-builder", label: "Build Your Pizza" },
];

const authedLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/profile", label: "Profile" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = isAuthenticated
    ? [...publicLinks, ...authedLinks]
    : publicLinks;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (<header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md"> <nav className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6"> <Link to="/" className="flex min-w-0 items-center gap-2"> <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"> <Pizza className="h-5 w-5" /> </span> <span className="truncate text-xl font-extrabold tracking-tight">
    PizzaHub </span> </Link>


    <div className="hidden items-center gap-1 lg:flex">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${location.pathname === link.to
              ? "text-primary"
              : "text-foreground/80"
            }`}
        >
          {link.label}
        </Link>
      ))}

      {isAuthenticated ? (
        <div className="ml-3 flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground xl:inline">
            Hi, {user?.name}
          </span>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <div className="ml-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Login</Link>
          </Button>

          <Button asChild size="sm">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      )}
    </div>

    <button
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border lg:hidden"
      aria-label="Toggle navigation"
      onClick={() => setOpen((value) => !value)}
    >
      {open ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </button>
  </nav>

    {open && (
      <div className="border-t border-border bg-card px-4 pb-4 pt-2 lg:hidden">
        <div className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-accent ${location.pathname === link.to
                  ? "text-primary"
                  : "text-foreground"
                }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-3 flex gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/login">Login</Link>
                </Button>

                <Button
                  asChild
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
  </header>


  );
}
