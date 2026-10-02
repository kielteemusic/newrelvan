import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — RELVAN LUMINA" }, { name: "description", content: "Choose a new password." }, { property: "og:title", content: "Set new password — RELVAN LUMINA" }, { property: "og:description", content: "Choose a new password for your account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState(""); const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message); else navigate({ to: "/account" });
  };
  return <AuthLayout title="Choose a new password." intro="Open this page from the link in your reset email."><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">New password<Input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 rounded-none bg-card" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="h-12 w-full rounded-none tracking-[0.12em]">UPDATE PASSWORD</Button></form></AuthLayout>;
}
