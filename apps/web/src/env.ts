import { z } from "zod";

/**
 * Validates environment variables once at startup.
 * The app refuses to boot with a missing or malformed variable instead of
 * failing later inside a request.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
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

export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() was called in the browser");
  }
  return parse(serverSchema, {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
  });
}
