import { NotFoundSheet } from "@/components/not-found-sheet";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_auto]">
      <div>
        <p className="font-display text-saffron text-8xl leading-none font-extrabold sm:text-9xl">
          404
        </p>
        <h1 className="mt-4 text-4xl font-extrabold">This page doesn&apos;t exist</h1>
        <p className="text-ink-muted mt-4 max-w-md text-lg">
          The link may be old or mistyped. While you&apos;re here, try one last question.
        </p>
      </div>
      <NotFoundSheet />
    </div>
  );
}
