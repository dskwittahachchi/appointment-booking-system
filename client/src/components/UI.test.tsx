import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./UI";

describe("StatusBadge", () => {
  it("renders a human-readable appointment status", () => {
    render(<StatusBadge status="no-show" />);
    expect(screen.getByText("No show")).toBeTruthy();
  });
});
