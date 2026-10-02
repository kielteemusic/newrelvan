import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { initializePayment } from "@/lib/paystack.functions";

type Props = {
  orderId?: string;
  orderNumber?: string;
  className?: string;
  label?: string;
};

/** Restart Paystack checkout for a reserved / unpaid order. */
export function PayAgainButton({
  orderId,
  orderNumber,
  className,
  label = "PAY NOW",
}: Props) {
  const [pending, setPending] = useState(false);

  const pay = async () => {
    if (!orderId && !orderNumber) {
      toast.error("Missing order details.");
      return;
    }
    setPending(true);
    try {
      const result = await initializePayment({
        data: {
          ...(orderId ? { orderId } : {}),
          ...(orderNumber ? { orderNumber } : {}),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.authorizationUrl;
    } catch {
      toast.error("We could not start payment. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => void pay()}
      className={className ?? "h-12 rounded-none px-8"}
    >
      {pending ? "STARTING…" : label}
    </Button>
  );
}
