import { prisma } from "./db";

/**
 * Email a user and log the message to the Notification outbox.
 *
 * With RESEND_API_KEY set the mail goes out via Resend's API (free tier:
 * 3 000 emails/month; without a verified domain use the default
 * onboarding@resend.dev sender, which delivers to the Resend account owner).
 * Without a key the message is recorded as SIMULATED so the demo shows
 * exactly what would send.
 */
export async function sendEmail(
  user: { id: string; email: string },
  subject: string,
  body: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Estate Portal <onboarding@resend.dev>";

  let status = "SIMULATED";
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: user.email, subject, text: body }),
      });
      status = res.ok ? "SENT" : "FAILED";
    } catch {
      status = "FAILED";
    }
  }

  await prisma.notification.create({
    data: { userId: user.id, channel: "EMAIL", to: user.email, body: `${subject} — ${body}`, status },
  });
}
