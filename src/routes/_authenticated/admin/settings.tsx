import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultRoutineSteps,
  defaultValueProps,
  type ContentCard,
  type RoutineStep,
} from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: Settings,
});

const storeFields = [
  ["business_name", "Business name"],
  ["whatsapp", "WhatsApp"],
  ["instagram", "Instagram"],
  ["email", "Email"],
  ["currency", "Currency"],
  ["delivery_fee", "Flat delivery fee (₦)"],
  ["free_delivery_threshold", "Free delivery above (₦)"],
  ["low_stock_threshold", "Low-stock threshold"],
] as const;

type StoreKey = (typeof storeFields)[number][0];

function asCards(value: unknown): ContentCard[] {
  if (!Array.isArray(value) || value.length === 0) return defaultValueProps.map((c) => ({ ...c }));
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      title: typeof row["title"] === "string" ? row["title"] : "",
      text: typeof row["text"] === "string" ? row["text"] : "",
    };
  });
}

function asSteps(value: unknown): RoutineStep[] {
  if (!Array.isArray(value) || value.length === 0)
    return defaultRoutineSteps.map((s) => ({ ...s }));
  return value.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      number:
        typeof row["number"] === "string"
          ? row["number"]
          : String(index + 1).padStart(2, "0"),
      title: typeof row["title"] === "string" ? row["title"] : "",
      text: typeof row["text"] === "string" ? row["text"] : "",
    };
  });
}

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("*").maybeSingle()).data,
  });

  const [store, setStore] = useState<Record<StoreKey, string>>({} as Record<StoreKey, string>);
  const [announcement, setAnnouncement] = useState("");
  const [home, setHome] = useState({ eyebrow: "", headline: "", subcopy: "" });
  const [about, setAbout] = useState({
    eyebrow: "",
    title: "",
    intro: "",
    quote: "",
    body: "",
  });
  const [valueProps, setValueProps] = useState<ContentCard[]>(defaultValueProps);
  const [routineMeta, setRoutineMeta] = useState({ eyebrow: "", title: "", intro: "" });
  const [routineSteps, setRoutineSteps] = useState<RoutineStep[]>(defaultRoutineSteps);

  useEffect(() => {
    if (!data) return;
    setStore(
      Object.fromEntries(storeFields.map(([k]) => [k, String(data[k] ?? "")])) as Record<
        StoreKey,
        string
      >,
    );
    setAnnouncement(data.announcement ?? "");
    setHome({
      eyebrow: data.homepage_eyebrow ?? "",
      headline: data.homepage_headline ?? "",
      subcopy: data.homepage_subcopy ?? "",
    });
    setAbout({
      eyebrow: data.about_eyebrow ?? "",
      title: data.about_title ?? "",
      intro: data.about_intro ?? "",
      quote: data.about_quote ?? "",
      body: data.about_body ?? "",
    });
    setValueProps(asCards(data.value_props));
    setRoutineMeta({
      eyebrow: data.routine_eyebrow ?? "",
      title: data.routine_title ?? "",
      intro: data.routine_intro ?? "",
    });
    setRoutineSteps(asSteps(data.routine_steps));
  }, [data]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("site_settings")
      .update({
        ...store,
        delivery_fee: Number(store.delivery_fee),
        free_delivery_threshold: Number(store.free_delivery_threshold),
        low_stock_threshold: Number(store.low_stock_threshold),
        announcement,
        homepage_eyebrow: home.eyebrow,
        homepage_headline: home.headline,
        homepage_subcopy: home.subcopy,
        about_eyebrow: about.eyebrow,
        about_title: about.title,
        about_intro: about.intro,
        about_quote: about.quote,
        about_body: about.body,
        value_props: valueProps,
        routine_eyebrow: routineMeta.eyebrow,
        routine_title: routineMeta.title,
        routine_intro: routineMeta.intro,
        routine_steps: routineSteps,
      })
      .eq("id", true);
    if (error) toast.error(error.message);
    else {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["catalog"] });
      void qc.invalidateQueries({ queryKey: ["admin-settings"] });
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Store settings</h1>
      <form onSubmit={save} className="mt-8 space-y-12">
        <section>
          <h2 className="font-display text-2xl">Business</h2>
          <div className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
            {storeFields.map(([k, l]) => (
              <label key={k} className="block text-sm font-medium">
                {l}
                <Input
                  value={store[k] ?? ""}
                  onChange={(e) => setStore({ ...store, [k]: e.target.value })}
                  className="mt-1 h-10 rounded-none bg-card"
                />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Announcement bar</h2>
          <label className="mt-4 block max-w-3xl text-sm font-medium">
            Text shown at the top of every page
            <Input
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="mt-1 h-10 rounded-none bg-card"
            />
          </label>
        </section>

        <section>
          <h2 className="font-display text-2xl">Homepage hero</h2>
          <div className="mt-4 grid max-w-3xl gap-4">
            <label className="block text-sm font-medium">
              Eyebrow
              <Input
                value={home.eyebrow}
                onChange={(e) => setHome({ ...home, eyebrow: e.target.value })}
                className="mt-1 h-10 rounded-none bg-card"
              />
            </label>
            <label className="block text-sm font-medium">
              Headline
              <Input
                value={home.headline}
                onChange={(e) => setHome({ ...home, headline: e.target.value })}
                className="mt-1 h-10 rounded-none bg-card"
              />
            </label>
            <label className="block text-sm font-medium">
              Supporting copy
              <Textarea
                value={home.subcopy}
                onChange={(e) => setHome({ ...home, subcopy: e.target.value })}
                className="mt-1 min-h-24 rounded-none bg-card"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Homepage value props</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Four cards on the dark band of the homepage.
          </p>
          <div className="mt-4 grid max-w-3xl gap-4">
            {valueProps.map((card, index) => (
              <div key={index} className="grid gap-2 border border-border p-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Title
                  <Input
                    value={card.title}
                    onChange={(e) => {
                      const next = [...valueProps];
                      next[index] = { ...card, title: e.target.value };
                      setValueProps(next);
                    }}
                    className="mt-1 h-10 rounded-none bg-card"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Text
                  <Input
                    value={card.text}
                    onChange={(e) => {
                      const next = [...valueProps];
                      next[index] = { ...card, text: e.target.value };
                      setValueProps(next);
                    }}
                    className="mt-1 h-10 rounded-none bg-card"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">About page</h2>
          <div className="mt-4 grid max-w-3xl gap-4">
            {(
              [
                ["eyebrow", "Eyebrow"],
                ["title", "Title"],
                ["intro", "Intro"],
                ["quote", "Quote"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm font-medium">
                {label}
                <Input
                  value={about[key]}
                  onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
                  className="mt-1 h-10 rounded-none bg-card"
                />
              </label>
            ))}
            <label className="block text-sm font-medium">
              Body (separate paragraphs with a blank line)
              <Textarea
                value={about.body}
                onChange={(e) => setAbout({ ...about, body: e.target.value })}
                className="mt-1 min-h-36 rounded-none bg-card"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Routine page</h2>
          <div className="mt-4 grid max-w-3xl gap-4">
            <label className="block text-sm font-medium">
              Eyebrow
              <Input
                value={routineMeta.eyebrow}
                onChange={(e) => setRoutineMeta({ ...routineMeta, eyebrow: e.target.value })}
                className="mt-1 h-10 rounded-none bg-card"
              />
            </label>
            <label className="block text-sm font-medium">
              Title
              <Input
                value={routineMeta.title}
                onChange={(e) => setRoutineMeta({ ...routineMeta, title: e.target.value })}
                className="mt-1 h-10 rounded-none bg-card"
              />
            </label>
            <label className="block text-sm font-medium">
              Intro
              <Textarea
                value={routineMeta.intro}
                onChange={(e) => setRoutineMeta({ ...routineMeta, intro: e.target.value })}
                className="mt-1 min-h-24 rounded-none bg-card"
              />
            </label>
            {routineSteps.map((step, index) => (
              <div key={index} className="grid gap-2 border border-border p-4 sm:grid-cols-[80px_1fr_1.4fr]">
                <label className="block text-sm font-medium">
                  No.
                  <Input
                    value={step.number}
                    onChange={(e) => {
                      const next = [...routineSteps];
                      next[index] = { ...step, number: e.target.value };
                      setRoutineSteps(next);
                    }}
                    className="mt-1 h-10 rounded-none bg-card"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Title
                  <Input
                    value={step.title}
                    onChange={(e) => {
                      const next = [...routineSteps];
                      next[index] = { ...step, title: e.target.value };
                      setRoutineSteps(next);
                    }}
                    className="mt-1 h-10 rounded-none bg-card"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Text
                  <Input
                    value={step.text}
                    onChange={(e) => {
                      const next = [...routineSteps];
                      next[index] = { ...step, text: e.target.value };
                      setRoutineSteps(next);
                    }}
                    className="mt-1 h-10 rounded-none bg-card"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <Button className="rounded-none">SAVE ALL SETTINGS</Button>
      </form>
    </div>
  );
}
