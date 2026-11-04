import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createDb } from "./client";
import { users } from "./schema";

config({ path: ".env", quiet: true });

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: pnpm db:make-admin you@example.com");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is missing");

const db = createDb(url, { max: 1 });
try {
  const [updated] = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, email))
    .returning({ email: users.email });

  if (!updated) {
    console.error(`No user with email ${email}. Sign up first, then run this again.`);
    process.exitCode = 1;
  } else {
    console.log(`${updated.email} is now an admin`);
  }
} finally {
  await db.$client.end();
}
