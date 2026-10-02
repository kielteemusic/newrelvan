import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email.").max(200),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  message: z.string().trim().min(10, "Please write a bit more detail.").max(4000),
});

export type ContactResult = { ok: true } | { ok: false; error: string };

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
    }
    return parsed.data;
  })
  .handler(async ({ data }): Promise<ContactResult> => {
    try {
      const { sendContactEmails } = await import("@/lib/email.server");
      await sendContactEmails(data);
      return { ok: true };
    } catch (err) {
      console.error("[contact]", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "We could not send your message. Please try again.",
      };
    }
  });
