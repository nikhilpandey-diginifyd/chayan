import { z } from "zod";

/**
 * Validates environment variables once at startup.
 * The app refuses to boot with a missing or malformed variable instead of
 * failing later inside a request.
 */
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    BETTER_AUTH_SECRET: z
      .string()
      .min(
        32,
        "BETTER_AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32",
      ),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: z.string().min(3).default("Chayan <onboarding@resend.dev>"),
    ADMIN_NOTIFY_EMAIL: optionalString.pipe(z.email().optional()),
    R2_ACCOUNT_ID: optionalString,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,
    R2_BUCKET: optionalString,
  })
  .superRefine((env, ctx) => {
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["GOOGLE_CLIENT_SECRET"],
        message: "Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither",
      });
    }
    if (env.NODE_ENV === "production" && env.BETTER_AUTH_SECRET.startsWith("replace-me")) {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_SECRET"],
        message: "Use a real secret in production: openssl rand -base64 32",
      });
    }
    const r2Values = [
      env.R2_ACCOUNT_ID,
      env.R2_ACCESS_KEY_ID,
      env.R2_SECRET_ACCESS_KEY,
      env.R2_BUCKET,
    ];
    const r2Count = r2Values.filter(Boolean).length;
    if (r2Count !== 0 && r2Count !== r2Values.length) {
      ctx.addIssue({
        code: "custom",
        path: ["R2_BUCKET"],
        message: "Set all four R2_* variables, or none to store files on disk locally",
      });
    }
    if (env.NODE_ENV === "production" && r2Count === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["R2_BUCKET"],
        message:
          "R2_* variables are required in production. Files on the server disk are lost on redeploy",
      });
    }
    if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required in production",
      });
    }
  });

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
});

const skip = process.env.SKIP_ENV_VALIDATION === "1";

function parse<T extends z.ZodType>(schema: T, values: Record<string, unknown>): z.infer<T> {
  if (skip) return values as z.infer<T>;
  const result = schema.safeParse(values);
  if (!result.success) {
    console.error("Invalid environment variables:", z.flattenError(result.error).fieldErrors);
    throw new Error("Invalid environment variables. Check .env.local against .env.example");
  }
  return result.data;
}

// NEXT_PUBLIC_* must be referenced explicitly so Next.js can inline them.
export const clientEnv = parse(clientSchema, {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() was called in the browser");
  }
  cachedServerEnv ??= parse(serverSchema, {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
  });
  return cachedServerEnv;
}

export function isGoogleLoginEnabled(): boolean {
  const env = getServerEnv();
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
