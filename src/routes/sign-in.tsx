import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — RELVAN LUMINA" }, { name: "description", content: "Sign in to your RELVAN LUMINA account." }, { property: "og:title", content: "Sign in — RELVAN LUMINA" }, { property: "og:description", content: "Access your orders, wishlist and saved cart." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/account" });
  };
  return <AuthLayout title="Welcome back." intro="Sign in to view orders, your wishlist and saved cart."><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Email<Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 rounded-none bg-card" /></label><label className="block text-sm font-medium">Password<Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 rounded-none bg-card" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="h-12 w-full rounded-none tracking-[0.12em]">{busy ? "SIGNING IN…" : "SIGN IN"}</Button></form><div className="mt-6 flex justify-between text-sm"><Link to="/forgot-password" className="text-primary">Forgot password?</Link><Link to="/sign-up" className="text-primary">Create an account</Link></div></AuthLayout>;
}
