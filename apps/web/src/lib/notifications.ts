import "server-only";
import { MENTOR_BADGE_INFO, type MentorBadge } from "@chayan/shared";
import { siteConfig } from "@/config/site";
import { getServerEnv } from "@/env";
import { actionEmail, sendEmail } from "@/lib/email";

type Recipient = { name: string; email: string };

const firstName = (name: string) => name.split(" ")[0] || name;
const link = (path: string) => `${siteConfig.url}${path}`;

/** Emails must never break the action that triggered them. */
async function safeSend(send: () => Promise<void>, context: string) {
  try {
    await send();
  } catch (error) {
    console.error(`Email failed: ${context}`, error);
  }
}

export async function notifyApplicationReceived(user: Recipient) {
  await safeSend(
    () =>
      sendEmail({
        to: user.email,
        subject: `We received your mentor application`,
        ...actionEmail({
          brand: siteConfig.name,
          greetingName: firstName(user.name),
          intro:
            "Thanks for applying to mentor on " +
            siteConfig.name +
            ". We check every document against official results, usually within 3 working days. We'll email you when there's an update.",
          actionLabel: "View your application",
          actionUrl: link("/mentor/apply"),
          footer: "You can't edit the application while it's under review.",
        }),
      }),
    "application received",
  );

  const adminEmail = getServerEnv().ADMIN_NOTIFY_EMAIL;
  if (adminEmail) {
    await safeSend(
      () =>
        sendEmail({
          to: adminEmail,
          subject: `New mentor application: ${user.name}`,
          ...actionEmail({
            brand: siteConfig.name,
            greetingName: "team",
            intro: `${user.name} (${user.email}) submitted a mentor application.`,
            actionLabel: "Open the review queue",
            actionUrl: link("/admin/mentors"),
            footer: "Sent because ADMIN_NOTIFY_EMAIL is set.",
          }),
        }),
      "admin notification",
    );
  }
}

export async function notifyApplicationApproved(user: Recipient, badge: MentorBadge) {
  await safeSend(
    () =>
      sendEmail({
        to: user.email,
        subject: `You're a verified mentor on ${siteConfig.name}`,
        ...actionEmail({
          brand: siteConfig.name,
          greetingName: firstName(user.name),
          intro: `Your application is approved with the "${MENTOR_BADGE_INFO[badge].label}" badge. Next, set your session prices and available hours so aspirants can book you.`,
          actionLabel: "Open your mentor dashboard",
          actionUrl: link("/mentor"),
          footer: "Welcome aboard.",
        }),
      }),
    "application approved",
  );
}

export async function notifyChangesRequested(user: Recipient, note: string) {
  await safeSend(
    () =>
      sendEmail({
        to: user.email,
        subject: `Your mentor application needs a change`,
        ...actionEmail({
          brand: siteConfig.name,
          greetingName: firstName(user.name),
          intro: `We reviewed your application and need one more thing before we can approve it: ${note}`,
          actionLabel: "Update your application",
          actionUrl: link("/mentor/apply"),
          footer: "Make the change and submit again. We'll review it as soon as it comes in.",
        }),
      }),
    "changes requested",
  );
}

export async function notifyApplicationRejected(user: Recipient, note: string) {
  await safeSend(
    () =>
      sendEmail({
        to: user.email,
        subject: `Update on your mentor application`,
        ...actionEmail({
          brand: siteConfig.name,
          greetingName: firstName(user.name),
          intro: `We couldn't approve your application this time. Reason: ${note}`,
          actionLabel: "View your application",
          actionUrl: link("/mentor/apply"),
          footer: "If you have new documents that address this, you can apply again.",
        }),
      }),
    "application rejected",
  );
}
