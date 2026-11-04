import { eq, mentorApplications, mentorDocuments } from "@chayan/db";
import { userRoleSchema } from "@chayan/shared";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Streams a private verification document. Only the applicant and admins can
 * open it. Responses are never cached.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return new Response("Not found", { status: 404 });

  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const [document] = await getDb()
    .select({
      storageKey: mentorDocuments.storageKey,
      fileName: mentorDocuments.fileName,
      contentType: mentorDocuments.contentType,
      ownerId: mentorApplications.userId,
    })
    .from(mentorDocuments)
    .innerJoin(mentorApplications, eq(mentorApplications.id, mentorDocuments.applicationId))
    .where(eq(mentorDocuments.id, id))
    .limit(1);

  const role = userRoleSchema.catch("aspirant").parse(session.user.role);
  const allowed = document && (document.ownerId === session.user.id || role === "admin");
  if (!allowed) return new Response("Not found", { status: 404 });

  const body = await getStorage().get(document.storageKey);
  if (!body) return new Response("Not found", { status: 404 });

  const asciiName = document.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(body, {
    headers: {
      "Content-Type": document.contentType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
