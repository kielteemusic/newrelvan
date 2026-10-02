import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [{ title: "Create account — RELVAN LUMINA" }, { name: "description", content: "Create your RELVAN LUMINA account." }, { property: "og:title", content: "Create account — RELVAN LUMINA" }, { property: "og:description", content: "Save your cart, wishlist and track orders." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SignUp,
});

function SignUp() {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: window.location.origin + "/account", data: { full_name: form.fullName, phone: form.phone } } });
    setBusy(false);
    if (error) setError(error.message); else setDone(true);
  };
  if (done) return <AuthLayout title="Check your inbox." intro={`We sent a confirmation link to ${form.email}. Confirm your email, then sign in.`}><Link to="/sign-in" className="text-primary">Go to sign in</Link></AuthLayout>;
  const field = (label: string, key: keyof typeof form, type = "text") => <label className="block text-sm font-medium">{label}<Input required={key !== "phone"} minLength={key === "password" ? 8 : undefined} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-2 h-11 rounded-none bg-card" /></label>;
  return <AuthLayout title="Create your account." intro="Checkout is always available as a guest — an account simply keeps everything in one place."><form onSubmit={submit} className="space-y-5">{field("Full name", "fullName")}{field("Phone (optional)", "phone", "tel")}{field("Email", "email", "email")}{field("Password (min. 8 characters)", "password", "password")}{error && <p className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="h-12 w-full rounded-none tracking-[0.12em]">{busy ? "CREATING…" : "CREATE ACCOUNT"}</Button></form><p className="mt-6 text-sm">Already have an account? <Link to="/sign-in" className="text-primary">Sign in</Link></p></AuthLayout>;
}
