import "server-only";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { accounts, eq, rateLimits, sessions, users, verifications } from "@chayan/db";
import { siteConfig } from "@/config/site";
import { clientEnv, getServerEnv } from "@/env";
import { getDb } from "@/lib/db";
import { actionEmail, sendEmail } from "@/lib/email";

const DAY_IN_SECONDS = 60 * 60 * 24;

function createAuth() {
  const env = getServerEnv();
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return betterAuth({
    appName: siteConfig.name,
    baseURL: clientEnv.NEXT_PUBLIC_SITE_URL,
    secret: env.BETTER_AUTH_SECRET,

    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        rateLimit: rateLimits,
      },
    }),

    advanced: {
      cookiePrefix: "chayan",
      database: { generateId: "uuid" },
    },

    user: {
      additionalFields: {
        // Roles are changed only by admins on the server, never by sign-up input.
        role: { type: "string", required: false, defaultValue: "aspirant", input: false },
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: `Reset your ${siteConfig.name} password`,
          ...actionEmail({
            brand: siteConfig.name,
            greetingName: user.name,
            intro:
              "We received a request to reset your password. The link works for one hour and can be used once.",
            actionLabel: "Choose a new password",
            actionUrl: url,
            footer: "If you didn't ask for this, ignore this email. Your password stays the same.",
          }),
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: DAY_IN_SECONDS,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: `Confirm your email for ${siteConfig.name}`,
          ...actionEmail({
            brand: siteConfig.name,
            greetingName: user.name,
            intro: "Confirm your email address to finish creating your account.",
            actionLabel: "Confirm email",
            actionUrl: url,
            footer: "The link works for 24 hours. If you didn't sign up, ignore this email.",
          }),
        });
      },
    },

    socialProviders: googleEnabled
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
          },
        }
      : {},

    account: {
      // Google verifies emails, so a Google sign-in can join an existing
      // email/password account with the same address.
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },

    session: {
      expiresIn: 30 * DAY_IN_SECONDS,
      updateAge: DAY_IN_SECONDS,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },

    rateLimit: {
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60 * 10, max: 5 },
        "/request-password-reset": { window: 60 * 10, max: 3 },
        "/send-verification-email": { window: 60 * 10, max: 3 },
      },
    },

    hooks: {
      /**
       * Sign-up never says "this email already exists", so nobody can probe who
       * uses the site. Instead the real owner of an existing account gets an
       * email telling them to sign in or reset their password.
       */
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email" && ctx.path !== "/send-verification-email") return;
        const email =
          typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : "";
        if (!email) return;
        const existing = await getDb().query.users.findFirst({
          where: eq(users.email, email),
          columns: { name: true, email: true, emailVerified: true },
        });
        const shouldNotify = existing && (ctx.path === "/sign-up/email" || existing.emailVerified);
        if (!shouldNotify) return;
        await sendEmail({
          to: existing.email,
          subject: `You already have a ${siteConfig.name} account`,
          ...actionEmail({
            brand: siteConfig.name,
            greetingName: existing.name.split(" ")[0] || existing.name,
            intro:
              "Someone (hopefully you) tried to create an account or confirm this email, but you already have an account with us. Sign in with your password, or reset it if you've forgotten it.",
            actionLabel: "Sign in",
            actionUrl: `${clientEnv.NEXT_PUBLIC_SITE_URL}/sign-in`,
            footer: `Forgot your password? Reset it at ${clientEnv.NEXT_PUBLIC_SITE_URL}/forgot-password. If this wasn't you, you can ignore this email.`,
          }),
        }).catch((error: unknown) => console.error("Existing-account email failed", error));
      }),
    },

    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

// Created on first use so `next build` never needs runtime secrets.
const globalForAuth = globalThis as unknown as { auth?: Auth };

export function getAuth(): Auth {
  globalForAuth.auth ??= createAuth();
  return globalForAuth.auth;
}
