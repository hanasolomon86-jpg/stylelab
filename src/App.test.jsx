import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App component", () => {
  it("renders the main heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Get started" }),
    ).toBeInTheDocument();
  });

  it("increments the counter when the user clicks the button", async () => {
    const user = userEvent.setup();

    render(<App />);

    const button = screen.getByRole("button", {
      name: "Count is 0",
    });

    await user.click(button);

    expect(
      screen.getByRole("button", { name: "Count is 1" }),
    ).toBeInTheDocument();
  });
});
