import { prisma } from "./db";

/**
 * Send a WhatsApp message to a user and log it to the Notification outbox.
 *
 * With TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM set,
 * the message goes out via the Twilio WhatsApp API. Without credentials the
 * message is recorded as SIMULATED so the demo shows exactly what would send.
 */
export async function sendWhatsApp(user: { id: string; phone: string | null }, body: string) {
  if (!user.phone) return;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  let status = "SIMULATED";
  if (sid && token && from) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from,
          To: `whatsapp:${user.phone}`,
          Body: body,
        }),
      });
      status = res.ok ? "SENT" : "FAILED";
    } catch {
      status = "FAILED";
    }
  }

  await prisma.notification.create({
    data: { userId: user.id, channel: "WHATSAPP", to: user.phone, body, status },
  });
}
