import { bookingAttachments, eq } from "@chayan/db";
import { userRoleSchema } from "@chayan/shared";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

/** Streams a session file to the two participants (and admins). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return new Response("Not found", { status: 404 });

  const attachment = await getDb().query.bookingAttachments.findFirst({
    where: eq(bookingAttachments.id, id),
    with: { booking: { columns: { mentorUserId: true, aspirantUserId: true } } },
  });
  const role = userRoleSchema.catch("aspirant").parse(session.user.role);
  const allowed =
    attachment &&
    (attachment.booking.mentorUserId === session.user.id ||
      attachment.booking.aspirantUserId === session.user.id ||
      role === "admin");
  if (!allowed) return new Response("Not found", { status: 404 });

  const body = await getStorage().get(attachment.storageKey);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, {
    headers: {
      "Content-Type": attachment.contentType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
