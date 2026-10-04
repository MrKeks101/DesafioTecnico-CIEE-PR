// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument(),
// toHaveTextContent(), etc.) and their TypeScript types, for every test file
// (wired up via `test.setupFiles` in vitest.config.ts).
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library auto-cleans the DOM after each test only when it
// detects global test-framework hooks (e.g. `test.globals: true` in the
// Vitest config). This project keeps globals off, so cleanup is wired up
// explicitly here instead — without it, components rendered by one test
// file stay mounted for the next, and later tests start matching multiple
// stale copies of the same markup.
afterEach(() => {
  cleanup();
});
