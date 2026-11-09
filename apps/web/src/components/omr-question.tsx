const options = [
  { letter: "A", text: "A batch of 400 students and one teacher" },
  { letter: "B", text: "The comment section under a toppers' video" },
  { letter: "C", text: "A friend of a friend who 'almost' cleared" },
  { letter: "D", text: "Someone who actually cleared the exam" },
] as const;

/**
 * Hero illustration: a single OMR-sheet question with option D marked.
 * Pure HTML/CSS so it stays crisp, translatable and accessible.
 */
export function OmrQuestion() {
  return (
    <figure
      className="border-line bg-surface panel relative rounded-[var(--radius-panel)] border p-6 shadow-[0_1px_0_var(--color-line)] sm:p-8"
      aria-label="An exam-style question: who should guide your preparation? Option D, someone who actually cleared the exam, is marked."
    >
      <div
        aria-hidden="true"
        className="bg-omr absolute inset-y-0 left-0 w-1.5 rounded-l-[var(--radius-panel)]"
      />
      <p className="text-omr text-sm font-semibold">Question 1</p>
      <p className="font-display mt-1 text-xl font-bold">Who should guide your preparation?</p>
      <ul className="mt-6 space-y-4" aria-hidden="true">
        {options.map((option) => {
          const chosen = option.letter === "D";
          return (
            <li key={option.letter} className="flex items-center gap-4">
              <span
                className={
                  chosen
                    ? "border-ink relative grid size-8 shrink-0 place-items-center rounded-full border-2"
                    : "border-omr/60 text-omr grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold"
                }
              >
                {chosen ? (
                  <span className="animate-bubble-fill bg-ink size-full rounded-full" />
                ) : (
                  option.letter
                )}
              </span>
              <span className={chosen ? "text-ink font-semibold" : "text-ink-muted"}>
                {option.text}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
