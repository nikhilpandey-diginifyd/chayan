import { eq, mentorProfiles } from "@chayan/db";
import { getDb } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

/** Public mentor photos. Each upload gets a new file name, so responses can be cached forever. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; file: string }> },
) {
  const { userId, file } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f-]{36}\.webp$/i.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  const key = `mentor-photos/${userId}/${file}`;
  const profile = await getDb().query.mentorProfiles.findFirst({
    where: eq(mentorProfiles.userId, userId),
    columns: { photoKey: true },
  });
  if (profile?.photoKey !== key) return new Response("Not found", { status: 404 });

  const body = await getStorage().get(key);
  if (!body) return new Response("Not found", { status: 404 });

  return new Response(body, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
