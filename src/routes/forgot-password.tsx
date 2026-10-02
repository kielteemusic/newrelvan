import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — RELVAN LUMINA" }, { name: "description", content: "Reset your RELVAN LUMINA password." }, { property: "og:title", content: "Forgot password — RELVAN LUMINA" }, { property: "og:description", content: "Receive a password reset link." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) setError(error.message); else setSent(true);
  };
  return <AuthLayout title="Reset your password." intro={sent ? "If an account exists for that email, a reset link is on its way." : "Enter your email and we'll send you a reset link."}>{!sent && <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Email<Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 rounded-none bg-card" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="h-12 w-full rounded-none tracking-[0.12em]">SEND RESET LINK</Button></form>}<Link to="/sign-in" className="mt-6 inline-block text-sm text-primary">Back to sign in</Link></AuthLayout>;
}
