import { and, count, eq, gte, paperDownloads, pyqPapers, sql } from "@chayan/db";
import { CONTENT_LIMITS } from "@chayan/shared";
import { clientEnv } from "@/env";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Downloads a paper (or its answer key with ?file=answer-key). Free, but needs
 * an account: signed-out visitors are sent to sign in and come back here.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const wantsKey = new URL(request.url).searchParams.get("file") === "answer-key";

  const db = getDb();
  const [paper] = await db
    .select()
    .from(pyqPapers)
    .where(and(eq(pyqPapers.id, id), eq(pyqPapers.isPublished, true)))
    .limit(1);
  if (!paper) return new Response("Not found", { status: 404 });

  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) {
    const signIn = new URL("/sign-in", clientEnv.NEXT_PUBLIC_SITE_URL);
    signIn.searchParams.set("next", `/papers/${paper.slug}`);
    return Response.redirect(signIn, 303);
  }

  const [today] = await db
    .select({ total: count() })
    .from(paperDownloads)
    .where(
      and(
        eq(paperDownloads.userId, session.user.id),
        gte(paperDownloads.createdAt, sql`now() - interval '1 day'`),
      ),
    );
  if ((today?.total ?? 0) >= CONTENT_LIMITS.downloadsPerUserPerDay) {
    return new Response("You've reached today's download limit. Try again tomorrow.", {
      status: 429,
    });
  }

  const key = wantsKey ? paper.answerKeyStorageKey : paper.storageKey;
  if (!key) return new Response("Not found", { status: 404 });
  const body = await getStorage().get(key);
  if (!body) return new Response("Not found", { status: 404 });

  await db.insert(paperDownloads).values({
    paperId: paper.id,
    userId: session.user.id,
    kind: wantsKey ? "answer_key" : "paper",
  });
  if (!wantsKey) {
    await db
      .update(pyqPapers)
      .set({ downloadCount: sql`${pyqPapers.downloadCount} + 1` })
      .where(eq(pyqPapers.id, paper.id));
  }

  const fileName = `${paper.slug}${wantsKey ? "-answer-key" : ""}.pdf`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
