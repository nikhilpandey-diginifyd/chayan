import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="text-4xl font-extrabold">This page doesn&apos;t exist</h1>
      <p className="text-ink-muted mt-4 max-w-md">
        The link may be old or mistyped. Go back to the home page to find a mentor.
      </p>
      <ButtonLink href="/" className="mt-8">
        Go to home page
      </ButtonLink>
    </div>
  );
}
