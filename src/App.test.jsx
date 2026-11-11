import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App";

function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );
}

describe("StyleLab routing", () => {
  it("renders the Home page at the root route", () => {
    renderWithRouter("/");

    expect(
      screen.getByRole("heading", {
        name: "Design. Preview. Generate.",
      }),
    ).toBeInTheDocument();
  });

  it("navigates from Home to Studio", async () => {
    const user = userEvent.setup();

    renderWithRouter("/");

    await user.click(
      screen.getByRole("link", {
        name: "Start Creating",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Studio",
      }),
    ).toBeInTheDocument();
  });

  it("allows navigation from Studio back to Home", async () => {
    const user = userEvent.setup();

    renderWithRouter("/studio");

    expect(
      screen.getByRole("heading", {
        name: "Studio",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("link", {
        name: "Home",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Design. Preview. Generate.",
      }),
    ).toBeInTheDocument();
  });

  it("renders the Not Found page for unknown routes", () => {
    renderWithRouter("/unknown");

    expect(
      screen.getByRole("heading", {
        name: "Page Not Found",
      }),
    ).toBeInTheDocument();
  });

  it("provides a link back to Home from the Not Found page", async () => {
    const user = userEvent.setup();

    renderWithRouter("/unknown");

    await user.click(
      screen.getByRole("link", {
        name: "Back to Home",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Design. Preview. Generate.",
      }),
    ).toBeInTheDocument();
  });
});
