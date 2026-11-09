import type { ReactNode } from "react";

/** Re-mounts on every navigation, so each page arrives with a short fade. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
