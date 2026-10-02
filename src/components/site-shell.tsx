import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartProvider, useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-queries";
import { SessionProvider, useSession } from "@/lib/session-context";
import { WishlistProvider, useWishlist } from "@/lib/wishlist-context";
import { cn } from "@/lib/utils";

const links = [
  ["Home", "/"], ["Shop", "/shop"], ["Categories", "/categories"], ["Routine", "/routine"],
  ["Reviews", "/reviews"], ["About", "/about"], ["Contact", "/contact"],
] as const;

function Brand() {
  return (
    <Link
      to="/"
      className="text-center font-display text-lg leading-none tracking-[0.12em] text-primary sm:text-xl"
    >
      <span className="block">RELVAN</span>
      <span className="mt-0.5 block text-[8px] font-sans tracking-[0.42em] text-muted-foreground">
        LUMINA
      </span>
    </Link>
  );
}

function SearchPanel() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { products } = useCatalog();
  const results = useMemo(() => query.trim().length < 2 ? [] : products.filter((p) => `${p.name} ${p.brand} ${p.category} ${p.concerns.join(" ")} ${p.ingredients.join(" ")} ${p.benefits.join(" ")}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6), [query, products]);
  return <div className="pt-6"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 rounded-none pl-10" placeholder="Search products, ingredients, concerns…" /></div><div className="mt-5 space-y-2">{results.map((product) => <SheetClose asChild key={product.id}><button className="flex w-full items-center gap-3 border-b border-border py-3 text-left" onClick={() => navigate({ to: "/product/$slug", params: { slug: product.slug } })}><img src={product.image} alt="" className="size-14 object-cover" /><span><span className="block text-xs text-primary">{product.brand}</span><span className="font-medium">{product.name}</span></span></button></SheetClose>)}{query.length >= 2 && results.length === 0 && <p className="py-6 text-sm text-muted-foreground">No products found. Try a different term.</p>}</div></div>;
}

function Header() {
  const { count } = useCart();
  const { userId, isAdmin } = useSession();
  const { productIds } = useWishlist();
  const { settings } = useCatalog();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      // Hide when scrolling down past the header; reveal when scrolling up.
      if (y < 48) setHidden(false);
      else if (delta > 6) setHidden(true);
      else if (delta < -6) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "sticky top-0 z-40 transition-transform duration-300 ease-out will-change-transform",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div className="bg-primary px-4 py-1.5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground sm:text-[11px]">
        {settings.announcement || "RELVAN LUMINA"}
      </div>
      <header className="border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto grid h-14 max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:h-[60px] sm:gap-3 sm:px-6 lg:px-10">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88%]">
                <SheetHeader>
                  <SheetTitle className="text-left font-display text-2xl">RELVAN LUMINA</SheetTitle>
                </SheetHeader>
                <nav className="mt-10 flex flex-col">
                  {links.map(([label, to]) => (
                    <SheetClose asChild key={to}>
                      <Link to={to} className="border-b border-border py-4 text-base font-medium">
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      to={userId ? "/account" : "/sign-in"}
                      className="border-b border-border py-4 text-base font-medium"
                    >
                      {userId ? "My account" : "Sign in"}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to="/wishlist" className="border-b border-border py-4 text-base font-medium">
                      Wishlist
                    </Link>
                  </SheetClose>
                  {isAdmin && (
                    <SheetClose asChild>
                      <Link to="/admin" className="border-b border-border py-4 text-base font-medium text-primary">
                        Admin
                      </Link>
                    </SheetClose>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <div className="justify-self-start lg:justify-self-auto">
            <Brand />
          </div>
          <nav className="hidden items-center justify-center gap-6 lg:flex">
            {links.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "text-primary" }}
                className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/75 hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-self-end gap-0 sm:gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Search">
                  <Search />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="mx-auto min-h-72">
                <div className="mx-auto max-w-2xl">
                  <SheetHeader>
                    <SheetTitle className="font-display text-3xl font-normal">Search the edit</SheetTitle>
                  </SheetHeader>
                  <SearchPanel />
                </div>
              </SheetContent>
            </Sheet>
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden px-2 text-[11px] font-semibold tracking-[0.12em] text-primary sm:inline"
              >
                ADMIN
              </Link>
            )}
            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Link to={userId ? "/account" : "/sign-in"} aria-label="Account">
                <UserRound />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative hidden sm:inline-flex">
              <Link to="/wishlist" aria-label="Wishlist">
                <Heart />
                {productIds.length > 0 && (
                  <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">
                    {productIds.length}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to="/cart" aria-label={`Cart with ${count} items`}>
                <ShoppingBag />
                {count > 0 && (
                  <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}

function Footer() {
  const { settings } = useCatalog();
  const ig = settings.instagram.replace(/^@/, "");
  const wa = settings.whatsapp.replace(/[^\d+]/g, "");
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div>
          <p className="font-display text-2xl tracking-[0.1em]">{settings.businessName}</p>
          <p className="mt-4 max-w-xs text-sm leading-6 opacity-75">
            Refined Korean skincare, thoughtfully selected for healthy, luminous skin.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">Shop</h3>
          <ul className="mt-4 space-y-3 text-sm opacity-75">
            <li>
              <Link to="/shop" className="hover:opacity-100">
                All products
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:opacity-100">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/routine" className="hover:opacity-100">
                Build a routine
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">Customer care</h3>
          <ul className="mt-4 space-y-3 text-sm opacity-75">
            <li>
              <Link to="/contact" className="hover:opacity-100">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:opacity-100">
                About us
              </Link>
            </li>
            <li>
              <Link to="/reviews" className="hover:opacity-100">
                Reviews
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">Connect</h3>
          <ul className="mt-4 space-y-3 text-sm opacity-75">
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="hover:opacity-100">
                  {settings.email}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a
                  href={`https://wa.me/${wa.replace(/^\+/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-100"
                >
                  WhatsApp {settings.whatsapp}
                </a>
              </li>
            )}
            {ig && (
              <li>
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-100"
                >
                  Instagram @{ig}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20 px-5 py-5 text-center text-xs opacity-60">
        © {new Date().getFullYear()} {settings.businessName}. Beauty, considered.
      </div>
    </footer>
  );
}


export function SiteShell({ children }: { children: ReactNode }) {
  return <SessionProvider><CartProvider><WishlistProvider><div className="min-h-screen overflow-x-clip bg-background"><Header /><main>{children}</main><Footer /></div></WishlistProvider></CartProvider></SessionProvider>;
}