import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the Arabic label and an accessible text node", () => {
    render(<StatusBadge tone="success" label="مكتمل" />);

    expect(screen.getByText("مكتمل")).toBeInTheDocument();
  });
});
