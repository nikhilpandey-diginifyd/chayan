import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "./exams";

describe("parseYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("reads %s", (input, id) => {
    expect(parseYouTubeId(input)).toBe(id);
  });
  it.each(["https://vimeo.com/123", "https://youtube.com/watch?v=short", "not a link", ""])(
    "rejects %s",
    (input) => {
      expect(parseYouTubeId(input)).toBeNull();
    },
  );
});
