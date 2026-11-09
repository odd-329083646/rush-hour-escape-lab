import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
function matchLast(path: string) {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  return router.matchRoutes(path).at(-1)?.routeId;
}

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    expect(matchLast("/")).not.toBe(rootRouteId);
  });

  // The menu links to these three; a missing route file would leave the card dead.
  it.each(["/play", "/daily", "/competitions", "/tutorial"])("serves the menu target %s", (path) => {
    expect(matchLast(path)).not.toBe(rootRouteId);
  });

  it("still serves the game flow at /game/$level", () => {
    expect(matchLast("/game/easy")).toBe("/game/$level");
  });
});
