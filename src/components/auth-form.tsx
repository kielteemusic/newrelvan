import type { ReactNode } from "react";

export function AuthLayout({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <div className="mx-auto max-w-md px-5 py-20"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">RELVAN LUMINA</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1><p className="mt-3 text-muted-foreground">{intro}</p><div className="mt-10">{children}</div></div>;
}
