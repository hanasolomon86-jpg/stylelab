import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";

function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
}

describe("StyleLab routing", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
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
      await screen.findByRole("heading", {
        name: "Studio",
      }),
    ).toBeInTheDocument();
  });

  it("allows navigation from Studio back to Home", async () => {
    const user = userEvent.setup();

    renderWithRouter("/studio");

    expect(
      await screen.findByRole("heading", {
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

  it("displays an accessible error when workspace storage is unavailable and clears it after recovery", async () => {
    const user = userEvent.setup();

    const storageSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

    renderWithRouter("/studio");

    const errorMessage =
      "Unable to save your changes. Your browser storage may be unavailable.";

    const storageAlert = await screen.findByText(errorMessage);

    expect(storageAlert).toHaveAttribute("role", "alert");

    // Restore storage and make a workspace change.
    storageSpy.mockRestore();

    await user.click(screen.getByRole("button", { name: "Content" }));

    const titleInput = screen.getByLabelText("Card title");

    await user.clear(titleInput);
    await user.type(titleInput, "Updated after storage recovery");

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });
});
