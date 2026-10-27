"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center ${light ? "rounded-2xl bg-white px-3 py-1" : ""}`}>
      <img src="/aura-logo.png" alt="" className="h-12 w-12 object-contain" />
    </span>
  );
}

const primary = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/plans", label: "Meal Plans" },
  { href: "/about", label: "About" },
];

const secondary = [
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Cancellation and refunds" },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/menu" && (path === "/menu" || path.startsWith("/menu/") || path.startsWith("/meals"))) return true;
  return path === href || path.startsWith(`${href}/`);
}

function useCartCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const read = () => {
      try {
        const menu = sessionStorage.getItem("aurabowls.menu.v1");
        const lines = menu ? JSON.parse(menu) as { quantity?: number }[] : [];
        const menuCount = Array.isArray(lines) ? lines.reduce((sum, line) => sum + (line.quantity || 0), 0) : 0;
        const raw = sessionStorage.getItem("aurabowls.draft.v1");
        const draft = raw ? JSON.parse(raw) : null;
        setCount(menuCount || draft?.selections?.length || 0);
      } catch {
        setCount(0);
      }
    };
    read();
    window.addEventListener("aurabowls-menu", read);
    window.addEventListener("aurabowls-draft", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("aurabowls-menu", read);
      window.removeEventListener("aurabowls-draft", read);
      window.removeEventListener("focus", read);
    };
  }, []);
  return count;
}

function Bag({ count }: { count: number }) {
  return (
    <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-full text-[#1A4A16] transition duration-200 hover:bg-[#F6F2EC] motion-reduce:transition-none" aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M6.5 8h11l-.8 11H7.3L6.5 8z" strokeLinejoin="round" />
        <path d="M9 8a3 3 0 0 1 6 0" strokeLinecap="round" />
      </svg>
      {count > 0 ? <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#F15C00] px-1 text-[10px] font-semibold text-white">{count}</span> : null}
    </Link>
  );
}

export function Header() {
  const path = usePathname();
  const count = useCartCount();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [path]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => (dialog ? [...dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")] : []);
    focusable()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);

  return (
    <header className={`sticky top-0 ${open ? "z-50" : "z-40"}`}>
      <a href="#content" className="skip-link">Skip to content</a>
      <div className="mx-auto hidden h-[4.5rem] max-w-7xl items-center px-5 md:flex sm:px-8">
        <div className="nav-pill flex h-14 w-full items-center justify-between gap-4 rounded-full px-2.5">
          <Link href="/" aria-label="AuraBowls home" className="shrink-0 rounded-full"><Logo /></Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {primary.map((item) => {
              const active = isActive(path, item.href);
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="relative px-3 py-2 text-sm font-semibold text-[#1A4A16] transition duration-200 hover:text-[#F15C00] motion-reduce:transition-none">
                  {item.label}
                  <span className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#F15C00] transition-opacity duration-200 motion-reduce:transition-none ${active ? "opacity-100" : "opacity-0"}`} />
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1 pr-1">
            <Bag count={count} />
            <Link href="/menu" className="btn btn-forest h-10 min-h-10 rounded-full px-4 text-sm">Order Now</Link>
          </div>
        </div>
      </div>
      <div className="flex h-16 items-center justify-between bg-[#FFF8F2]/80 px-4 backdrop-blur-md md:hidden">
        <Link href="/" aria-label="AuraBowls home"><Logo /></Link>
        <div className="flex items-center">
          <Bag count={count} />
          <button ref={menuButtonRef} type="button" className="grid h-11 w-11 place-items-center rounded-full text-[#1A4A16]" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(true)}>
            <span className="sr-only">Open menu</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-[#22251F]/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div ref={dialogRef} id={menuId} role="dialog" aria-modal="true" aria-label="More pages" className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_8px_24px_rgba(34,37,31,0.08)]">
            <button type="button" className="self-end grid h-11 w-11 place-items-center rounded-full text-[#1A4A16]" onClick={() => setOpen(false)}>
              <span className="sr-only">Close menu</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
            <nav className="mt-4 flex flex-col" aria-label="Secondary">
              {[...primary, ...secondary].map((item) => (
                <Link key={item.href} href={item.href} className="border-b border-[#EAE4DD] py-4 text-lg font-semibold text-[#1A4A16]" aria-current={isActive(path, item.href) ? "page" : undefined}>{item.label}</Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function MobileNav() {
  const path = usePathname();
  if (path.startsWith("/checkout") || path.startsWith("/pay")) return null;
  const items = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/plans", label: "Plans" },
    { href: "/track", label: "Track Order" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAE4DD] bg-white/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Mobile">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = isActive(path, item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-[#F15C00]" : "text-[#6A5A4E]"}`}>
                <span className={`h-1 w-1 rounded-full bg-[#F15C00] ${active ? "opacity-100" : "opacity-0"}`} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Footer({ whatsapp }: { whatsapp: string }) {
  return (
    <footer className="mt-20 bg-[#1A4A16] text-[#EAF6DC]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#d5e4d8]">Fresh, balanced meals for everyday living. Breakfast and lunch, on a schedule you choose.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Order</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/plans">Meal plans</Link></li>
            <li><Link href="/cart">Cart</Link></li>
            <li><Link href="/track">Track an order</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Policies</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/refund-policy">Cancellation and refunds</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Support</h2>
          <p className="mt-3 text-sm leading-6">WhatsApp is the support channel. Opening it does not send a message by itself.</p>
          {whatsapp ? (
            <a className="mt-3 inline-block text-sm text-[#F15C00]" href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hello AuraBowls, I need help with an order.")}`}>Message on WhatsApp</a>
          ) : (
            <p className="mt-3 text-sm">WhatsApp support is not configured yet. Add the number in admin settings.</p>
          )}
        </div>
      </div>
    </footer>
  );
}
