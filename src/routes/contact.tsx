import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { EditorialPage } from "@/components/editorial-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/lib/contact.functions";
import { useCatalog } from "@/lib/catalog-queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — RELVAN LUMINA" },
      { name: "description", content: "Contact RELVAN LUMINA for skincare and order support." },
      { property: "og:title", content: "Contact Us — RELVAN LUMINA" },
      {
        property: "og:description",
        content: "We are here to help with products, routines and orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { settings } = useCatalog();
  const [pending, setPending] = useState(false);
  const wa = settings.whatsapp.replace(/[^\d+]/g, "");
  const ig = settings.instagram.replace(/^@/, "");

  const channels = [
    {
      Icon: MessageCircle,
      title: "WhatsApp",
      text: settings.whatsapp || "Chat with our customer care team",
      href: wa ? `https://wa.me/${wa.replace(/^\+/, "")}` : undefined,
    },
    {
      Icon: Mail,
      title: "Email",
      text: settings.email || "hello@relvanlumina.com",
      href: settings.email ? `mailto:${settings.email}` : undefined,
    },
    {
      Icon: Instagram,
      title: "Instagram",
      text: ig ? `@${ig}` : "@relvanlumina",
      href: ig ? `https://instagram.com/${ig}` : undefined,
    },
  ];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    try {
      const result = await submitContactMessage({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Message sent — we'll be in touch soon.");
      form.reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <EditorialPage
      eyebrow="We are here"
      title="Let’s talk skincare."
      intro="Questions about a product, your routine or an order? Our care team would be glad to help."
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          {channels.map(({ Icon, title, text, href }) => (
            <div key={title} className="flex gap-4 border-b border-border py-5">
              <Icon className="size-5 text-primary" />
              <div>
                <h2 className="font-medium">{title}</h2>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                    className="mt-1 block text-sm text-muted-foreground hover:text-primary"
                  >
                    {text}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                )}
              </div>
            </div>
          ))}
          <div className="pt-5">
            <h2 className="font-display text-2xl">Business enquiries</h2>
            <p className="mt-3 max-w-md leading-7 text-muted-foreground">
              For partnerships and other business enquiries, please include the nature of your
              request in your message.
            </p>
          </div>
        </div>

        <form className="space-y-5 border border-border bg-card p-6 sm:p-8" onSubmit={onSubmit}>
          <h2 className="font-display text-3xl">Send a note</h2>
          <label className="block text-sm font-medium">
            Name
            <Input name="name" required maxLength={120} className="mt-2 h-11 rounded-none" />
          </label>
          <label className="block text-sm font-medium">
            Email
            <Input
              name="email"
              type="email"
              required
              maxLength={200}
              className="mt-2 h-11 rounded-none"
            />
          </label>
          <label className="block text-sm font-medium">
            Subject
            <Input name="subject" required maxLength={200} className="mt-2 h-11 rounded-none" />
          </label>
          <label className="block text-sm font-medium">
            Message
            <Textarea
              name="message"
              required
              minLength={10}
              maxLength={4000}
              className="mt-2 min-h-32 rounded-none"
            />
          </label>
          <Button type="submit" disabled={pending} className="h-12 w-full rounded-none">
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                SENDING…
              </>
            ) : (
              "SEND MESSAGE"
            )}
          </Button>
        </form>
      </div>
    </EditorialPage>
  );
}
