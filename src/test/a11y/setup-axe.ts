import { configureAxe } from "jest-axe";
import { expect } from "vitest";
import * as matchers from "jest-axe/matchers";

expect.extend(matchers);

export const axe = configureAxe({
  rules: {
    // Region rule can be noisy for isolated component tests
    region: { enabled: false },
  },
});
