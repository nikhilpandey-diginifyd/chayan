import { EXAMS } from "@chayan/shared";

/** An endless, slowly moving strip of the exams we cover. Pauses on hover. */
export function ExamMarquee() {
  const items = EXAMS.map((exam) => (
    <li key={exam.code} className="flex shrink-0 items-baseline gap-2 px-6 whitespace-nowrap">
      <span aria-hidden="true" className="border-omr size-2.5 self-center rounded-full border-2" />
      <span className="font-display font-bold">{exam.shortName}</span>
      <span className="text-ink-muted text-sm" lang="hi">
        {exam.nameHi}
      </span>
    </li>
  ));
  return (
    <section
      aria-label="Exams we cover"
      className="marquee border-line/70 overflow-hidden border-y bg-white [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
    >
      <div className="marquee-track flex w-max py-5">
        <ul className="flex">{items}</ul>
        <ul className="flex" aria-hidden="true">
          {items}
        </ul>
      </div>
    </section>
  );
}
