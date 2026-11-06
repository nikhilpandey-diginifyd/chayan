"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server rendering and until React has attached event handlers.
 * Forms that submit with JavaScript keep their button disabled until then,
 * so an early click can't fall back to a plain browser submit (which would
 * put what was typed, such as a password, into the page address).
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
