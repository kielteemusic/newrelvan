import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PayAgainButton } from "@/components/pay-again-button";
import { formatPrice } from "@/lib/catalog";
import { verifyPayment } from "@/lib/paystack.functions";

export const Route = createFileRoute("/order-received")({
  validateSearch: (s: Record<string, unknown>) => ({
    number: typeof s["number"] === "string" ? s["number"] : "",
    total: Number(s["total"]) || 0,
    reference: typeof s["reference"] === "string" ? s["reference"] : "",
    orderId: typeof s["orderId"] === "string" ? s["orderId"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Order received — RELVAN LUMINA" },
      { name: "description", content: "Your RELVAN LUMINA order has been received." },
      { property: "og:title", content: "Order received — RELVAN LUMINA" },
      { property: "og:description", content: "Your order is awaiting payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderReceived,
});

type State =
  | { kind: "verifying" }
  | { kind: "paid"; number: string; total: number }
  | { kind: "unpaid"; orderId: string; number: string; total: number }
  | { kind: "error"; message: string };

function OrderReceived() {
  const search = Route.useSearch();
  const [state, setState] = useState<State | null>(
    search.reference ? { kind: "verifying" } : null,
  );

  useEffect(() => {
    if (!search.reference) return;
    let cancelled = false;
    void verifyPayment({ data: { reference: search.reference } }).then((result) => {
      if (cancelled) return;
      if (!result.ok) setState({ kind: "error", message: result.error });
      else if (result.paid)
        setState({ kind: "paid", number: result.orderNumber, total: result.total });
      else
        setState({
          kind: "unpaid",
          orderId: result.orderId,
          number: result.orderNumber,
          total: result.total,
        });
    });
    return () => {
      cancelled = true;
    };
  }, [search.reference]);

  if (state?.kind === "verifying") {
    return (
      <Shell
        eyebrow="Confirming payment"
        title="One moment…"
        body="We're confirming your payment with Paystack."
      />
    );
  }

  if (state?.kind === "paid") {
    return (
      <Shell
        eyebrow="Payment confirmed"
        title="Thank you."
        body={
          <>
            Your payment for order <strong className="text-foreground">{state.number}</strong> (
            {formatPrice(state.total)}) was successful. We'll start preparing your order and contact
            you about delivery.
          </>
        }
        actions={
          <>
            <Button asChild className="h-12 rounded-none px-8">
              <Link to="/shop">CONTINUE SHOPPING</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-none px-8">
              <Link to="/account">MY ORDERS</Link>
            </Button>
          </>
        }
      />
    );
  }

  if (state?.kind === "unpaid") {
    return (
      <Shell
        eyebrow="Payment not completed"
        title="Order reserved."
        body={
          <>
            Your order <strong className="text-foreground">{state.number}</strong> for{" "}
            <strong className="text-foreground">{formatPrice(state.total)}</strong> is reserved as{" "}
            <strong className="text-foreground">Pending Payment</strong>, but the payment was not
            completed. You can pay now or contact us for help.
          </>
        }
        actions={
          <>
            <PayAgainButton orderId={state.orderId} />
            <Button asChild variant="outline" className="h-12 rounded-none px-8">
              <Link to="/contact">CONTACT US</Link>
            </Button>
          </>
        }
      />
    );
  }

  if (state?.kind === "error") {
    return (
      <Shell
        eyebrow="Order received"
        title="Thank you."
        body={
          <>
            {state.message} If you completed a payment, it will be confirmed automatically — check
            your orders shortly.
          </>
        }
        actions={
          <>
            <Button asChild className="h-12 rounded-none px-8">
              <Link to="/shop">CONTINUE SHOPPING</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-none px-8">
              <Link to="/account">MY ORDERS</Link>
            </Button>
          </>
        }
      />
    );
  }

  // Payment init failed at checkout — order reserved, allow retry by number / id.
  return (
    <Shell
      eyebrow="Order received"
      title="Thank you."
      body={
        <>
          Your order <strong className="text-foreground">{search.number}</strong> for{" "}
          <strong className="text-foreground">{formatPrice(search.total)}</strong> has been reserved
          with status <strong className="text-foreground">Pending Payment</strong>.
          <span className="mt-3 block text-sm">
            Online payment could not be started just now. You can try again below — your order is
            not complete until payment is confirmed.
          </span>
        </>
      }
      actions={
        <>
          {(search.orderId || search.number) && (
            <PayAgainButton
              {...(search.orderId ? { orderId: search.orderId } : {})}
              {...(search.number ? { orderNumber: search.number } : {})}
            />
          )}
          <Button asChild variant="outline" className="h-12 rounded-none px-8">
            <Link to="/account">MY ORDERS</Link>
          </Button>
        </>
      }
    />
  );
}

function Shell({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl">{title}</h1>
      <p className="mt-6 text-muted-foreground">{body}</p>
      {actions && (
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>
      )}
    </div>
  );
}
