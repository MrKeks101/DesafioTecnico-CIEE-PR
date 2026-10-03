import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Sanity check for the Vitest + React Testing Library + jest-dom pipeline
// itself (ticket 007), not a feature under test. Safe to delete once real
// component tests exist (e.g. ticket 008's registration form), since this
// doesn't exercise any application code.
describe("frontend test setup", () => {
  it("renders a component and asserts on the DOM via jest-dom matchers", () => {
    render(<div>ok</div>);

    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});
