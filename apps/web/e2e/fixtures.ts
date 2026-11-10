import { test as base, type BrowserContext } from "@playwright/test";

/**
 * The dev server sends "reload" commands to open pages over its hot-reload
 * websocket whenever it recompiles. That's handy while coding but makes tests
 * flaky: a page can reload in the middle of typing or clicking, sometimes over
 * and over right after the server starts. Every test browser passes that
 * websocket through untouched, except for the messages that reload or
 * refresh the page. (The socket itself must stay connected: pages need it to
 * finish loading in development.)
 */
const HOT_RELOAD_SOCKET = /\/_next\/(webpack-hmr|turbopack-hmr|hmr)/;
const RELOAD_MESSAGES = new Set([
  "reloadPage",
  "serverComponentChanges",
  "serverOnlyChanges",
  "middlewareChanges",
  "addedPage",
  "removedPage",
]);

function isReloadMessage(message: string | Buffer) {
  if (typeof message !== "string") return false;
  try {
    const data = JSON.parse(message) as { type?: string; action?: string };
    return RELOAD_MESSAGES.has(data.type ?? data.action ?? "");
  } catch {
    return false;
  }
}

async function muteHotReload(context: BrowserContext) {
  await context.routeWebSocket(HOT_RELOAD_SOCKET, (socket) => {
    const server = socket.connectToServer();
    server.onMessage((message) => {
      if (!isReloadMessage(message)) socket.send(message);
    });
  });
}

export const test = base.extend<object, { muteBrowser: void }>({
  context: async ({ context }, provide) => {
    await muteHotReload(context);
    await provide(context);
  },
  // Tests also open extra contexts with browser.newContext() for second users.
  muteBrowser: [
    async ({ browser }, provide) => {
      const original = browser.newContext.bind(browser);
      browser.newContext = async (...args: Parameters<typeof original>) => {
        const context = await original(...args);
        await muteHotReload(context);
        return context;
      };
      await provide();
      browser.newContext = original;
    },
    { scope: "worker", auto: true },
  ],
});

export { expect } from "@playwright/test";
