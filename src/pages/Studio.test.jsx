import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { WorkspaceProvider } from "../context/WorkspaceContext.jsx";
import Studio from "./Studio";

function renderStudio() {
  return render(
    <MemoryRouter>
      <WorkspaceProvider>
        <Studio />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
}

describe("Studio workspace", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("displays the default Card component", () => {
    renderStudio();

    expect(screen.getByLabelText("Select component")).toHaveValue("card");

    expect(screen.getByLabelText("Card title")).toHaveValue("Product Title");

    expect(
      screen.getByRole("heading", { name: "Product Title" }),
    ).toBeInTheDocument();
  });

  it("allows the user to select a different component", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "button",
    );

    expect(screen.getByLabelText("Select component")).toHaveValue("button");

    expect(screen.getByLabelText("Button label")).toHaveValue("Click Me");
  });

  it("updates component content and its preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    const titleInput = screen.getByLabelText("Card title");

    await user.clear(titleInput);
    await user.type(titleInput, "My New Product");

    expect(
      screen.getByRole("heading", { name: "My New Product" }),
    ).toBeInTheDocument();
  });

  it("keeps style settings independent between Normal and Hover", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select style state"),
      "hover",
    );

    const backgroundInput = screen.getByLabelText("Background color");

    await user.type(backgroundInput, "#123456");

    expect(backgroundInput).toHaveValue("#123456");

    await user.selectOptions(
      screen.getByLabelText("Select style state"),
      "normal",
    );

    expect(screen.getByLabelText("Background color")).toHaveValue("");

    await user.selectOptions(
      screen.getByLabelText("Select style state"),
      "hover",
    );

    expect(screen.getByLabelText("Background color")).toHaveValue("#123456");
  });
});
