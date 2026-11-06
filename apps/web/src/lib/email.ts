import "server-only";
import { and, desc, emailDeliveries, eq, gte } from "@chayan/db";
import { getServerEnv } from "@/env";
import { getDb } from "@/lib/db";

type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends a transactional email through Resend's HTTP API.
 * Without RESEND_API_KEY (local development), the email is printed in the
 * terminal instead, so sign-up and password reset can be tested offline.
 */
export async function sendEmail(email: Email): Promise<void> {
  const env = getServerEnv();

  const record = (status: "sent" | "failed" | "logged", extra: { id?: string; error?: string }) =>
    getDb()
      .insert(emailDeliveries)
      .values({
        toEmail: email.to.toLowerCase(),
        subject: email.subject,
        status,
        providerMessageId: extra.id ?? null,
        error: extra.error?.slice(0, 1000) ?? null,
      })
      .catch((error: unknown) => console.error("Could not record email delivery", error));

  if (!env.RESEND_API_KEY) {
    console.info(
      [
        "",
        "──────── Email (not sent: RESEND_API_KEY is empty) ────────",
        `To:      ${email.to}`,
        `Subject: ${email.subject}`,
        "",
        email.text,
        "────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    const outbox = process.env.EMAIL_LOG_FILE;
    if (outbox && env.NODE_ENV !== "production") {
      const { appendFile } = await import("node:fs/promises");
      await appendFile(
        outbox,
        JSON.stringify({ to: email.to, subject: email.subject, text: email.text }) + "\n",
      );
    }
    await record("logged", {});
    return;
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    await record("failed", { error: `Network error: ${String(error)}` });
    throw error;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    await record("failed", { error: `${response.status}: ${body}` });
    throw new Error(`Resend rejected the email (${response.status}): ${body}`);
  }

  const data = (await response.json().catch(() => null)) as { id?: string } | null;
  await record("sent", { id: data?.id });
}

/** True if the latest email to this address in the last few minutes failed to send. */
export async function lastEmailFailed(to: string, withinMinutes = 15): Promise<boolean> {
  const [latest] = await getDb()
    .select({ status: emailDeliveries.status })
    .from(emailDeliveries)
    .where(
      and(
        eq(emailDeliveries.toEmail, to.toLowerCase()),
        gte(emailDeliveries.createdAt, new Date(Date.now() - withinMinutes * 60_000)),
      ),
    )
    .orderBy(desc(emailDeliveries.createdAt))
    .limit(1);
  return latest?.status === "failed";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Plain, single-column layout that renders well in Gmail on phones. */
export function actionEmail(options: {
  brand: string;
  greetingName: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  footer: string;
}): Pick<Email, "text" | "html"> {
  const { brand, greetingName, intro, actionLabel, actionUrl, footer } = options;

  const text = [
    `Hi ${greetingName},`,
    "",
    intro,
    "",
    `${actionLabel}: ${actionUrl}`,
    "",
    footer,
    "",
    `— ${brand}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#fafbfd;font-family:Arial,Helvetica,sans-serif;color:#18233f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #d9deea;border-radius:12px;padding:32px;">
            <tr><td style="font-size:20px;font-weight:bold;padding-bottom:24px;">${escapeHtml(brand)}</td></tr>
            <tr><td style="font-size:16px;line-height:1.6;padding-bottom:8px;">Hi ${escapeHtml(greetingName)},</td></tr>
            <tr><td style="font-size:16px;line-height:1.6;padding-bottom:24px;color:#4b5675;">${escapeHtml(intro)}</td></tr>
            <tr>
              <td style="padding-bottom:24px;">
                <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#2b4fc7;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">${escapeHtml(actionLabel)}</a>
              </td>
            </tr>
            <tr><td style="font-size:13px;line-height:1.6;color:#4b5675;padding-bottom:8px;">If the button doesn't work, copy this link into your browser:</td></tr>
            <tr><td style="font-size:13px;line-height:1.6;word-break:break-all;padding-bottom:24px;"><a href="${escapeHtml(actionUrl)}" style="color:#2b4fc7;">${escapeHtml(actionUrl)}</a></td></tr>
            <tr><td style="font-size:13px;line-height:1.6;color:#4b5675;">${escapeHtml(footer)}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}
