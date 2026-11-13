import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { WorkspaceProvider } from "../context/WorkspaceContext.jsx";
import { WORKSPACE_STORAGE_KEY } from "../utils/workspaceStorage";
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

  it("updates the Card preview when the layout is changed", async () => {
    const user = userEvent.setup();

    const { container } = renderStudio();

    const layoutSelect = screen.getByLabelText("Image layout");

    expect(layoutSelect).toHaveValue("top");
    expect(container.querySelector(".card")).toHaveClass("card--top");

    await user.selectOptions(layoutSelect, "left");

    expect(layoutSelect).toHaveValue("left");
    expect(container.querySelector(".card")).toHaveClass("card--left");
  });

  it("keeps the Card layout when switching components and style states", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Image layout"), "left");

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "button",
    );

    expect(screen.queryByLabelText("Image layout")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Select component"), "card");

    expect(screen.getByLabelText("Image layout")).toHaveValue("left");

    await user.selectOptions(
      screen.getByLabelText("Select style state"),
      "hover",
    );

    expect(screen.getByLabelText("Image layout")).toHaveValue("left");
  });

  it("shows the Image Gallery only when Card is selected", async () => {
    const user = userEvent.setup();

    renderStudio();

    expect(
      screen.getByRole("heading", { name: "Image Gallery" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "button",
    );

    expect(
      screen.queryByRole("heading", { name: "Image Gallery" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Select component"), "card");

    expect(
      screen.getByRole("heading", { name: "Image Gallery" }),
    ).toBeInTheDocument();
  });

  it("updates the Card preview and persists the selected gallery image", async () => {
    const user = userEvent.setup();

    const { unmount } = renderStudio();

    await user.click(screen.getByRole("button", { name: "Select Sneakers" }));

    const previewImage = screen.getByRole("img", {
      name: "Product Title",
    });

    expect(previewImage).toHaveAttribute("src", "/images/gallery/sneakers.jpg");

    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.card.content.imageId).toBe("sneakers");

    unmount();

    renderStudio();

    expect(screen.getByRole("img", { name: "Product Title" })).toHaveAttribute(
      "src",
      "/images/gallery/sneakers.jpg",
    );

    expect(
      screen.getByRole("button", { name: "Select Sneakers" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("updates the Button label and its preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "button",
    );

    const labelInput = screen.getByLabelText("Button label");

    await user.clear(labelInput);
    await user.type(labelInput, "Continue");

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });

  it("applies Button style settings to the preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "button",
    );

    const backgroundInput = screen.getByLabelText("Background color");

    await user.clear(backgroundInput);
    await user.type(backgroundInput, "#123456");

    expect(screen.getByRole("button", { name: "Click Me" })).toHaveStyle({
      backgroundColor: "#123456",
    });
  });

  it("displays all Button style states correctly", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "button",
    );

    const stateSelect = screen.getByLabelText("Select style state");

    const button = screen.getByRole("button", { name: "Click Me" });

    for (const styleState of [
      "normal",
      "hover",
      "focus",
      "error",
      "disabled",
    ]) {
      await user.selectOptions(stateSelect, styleState);

      expect(button).toHaveClass(`button-preview--${styleState}`);

      if (styleState === "disabled") {
        expect(button).toBeDisabled();
      } else {
        expect(button).toBeEnabled();
      }
    }
  });

  it("inherits Normal styles across states and allows state-specific overrides", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "button",
    );

    const stateSelect = screen.getByLabelText("Select style state");
    const backgroundInput = screen.getByLabelText("Background color");
    const button = screen.getByRole("button", { name: "Click Me" });

    // Set the base color in Normal
    await user.type(backgroundInput, "#123456");

    expect(button).toHaveStyle({
      backgroundColor: "#123456",
    });

    // Hover inherits the Normal color
    await user.selectOptions(stateSelect, "hover");

    expect(backgroundInput).toHaveValue("#123456");
    expect(button).toHaveStyle({
      backgroundColor: "#123456",
    });

    // Focus also inherits the Normal color
    await user.selectOptions(stateSelect, "focus");

    expect(backgroundInput).toHaveValue("#123456");

    // Set a different color specifically for Hover
    await user.selectOptions(stateSelect, "hover");
    await user.clear(backgroundInput);
    await user.type(backgroundInput, "#abcdef");

    // Normal keeps its original color
    await user.selectOptions(stateSelect, "normal");

    expect(backgroundInput).toHaveValue("#123456");

    // Hover retains its own override
    await user.selectOptions(stateSelect, "hover");

    expect(backgroundInput).toHaveValue("#abcdef");
    expect(button).toHaveStyle({
      backgroundColor: "#abcdef",
    });
  });

  it("updates the Input label and placeholder in the preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "input",
    );

    const labelControl = screen.getByLabelText("Input label");
    const placeholderControl = screen.getByLabelText("Placeholder");

    await user.clear(labelControl);
    await user.type(labelControl, "Work Email");

    await user.clear(placeholderControl);
    await user.type(placeholderControl, "name@company.com");

    const previewInput = screen.getByRole("textbox", {
      name: "Work Email",
    });

    expect(previewInput).toHaveAttribute("placeholder", "name@company.com");
  });

  it("applies Input style settings to the preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "input",
    );

    const backgroundInput = screen.getByLabelText("Background color");
    const textColorInput = screen.getByLabelText("Text color");
    const borderRadiusInput = screen.getByLabelText("Border radius");
    const paddingInput = screen.getByLabelText("Padding");

    await user.type(backgroundInput, "#123456");
    await user.type(textColorInput, "#ffffff");
    await user.type(borderRadiusInput, "12px");
    await user.type(paddingInput, "16px");

    const previewInput = screen.getByRole("textbox", {
      name: "Email",
    });

    expect(previewInput).toHaveStyle({
      backgroundColor: "#123456",
      color: "#ffffff",
      borderRadius: "12px",
      padding: "16px",
    });
  });

  it("displays all Input style states correctly", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "input",
    );

    const stateSelect = screen.getByLabelText("Select style state");

    const previewInput = screen.getByRole("textbox", {
      name: "Email",
    });

    for (const styleState of [
      "normal",
      "hover",
      "focus",
      "error",
      "disabled",
    ]) {
      await user.selectOptions(stateSelect, styleState);

      expect(previewInput).toHaveClass(`input-preview--${styleState}`);

      if (styleState === "disabled") {
        expect(previewInput).toBeDisabled();
      } else {
        expect(previewInput).toBeEnabled();
      }

      if (styleState === "error") {
        expect(previewInput).toHaveAttribute("aria-invalid", "true");
      }
    }
  });

  it("inherits Normal styles for Input across style states", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(
      screen.getByLabelText("Select component"),
      "input",
    );

    const stateSelect = screen.getByLabelText("Select style state");
    const backgroundControl = screen.getByLabelText("Background color");

    const previewInput = screen.getByRole("textbox", {
      name: "Email",
    });

    await user.type(backgroundControl, "#123456");

    await user.selectOptions(stateSelect, "hover");

    expect(backgroundControl).toHaveValue("#123456");

    expect(previewInput).toHaveStyle({
      backgroundColor: "#123456",
    });

    await user.selectOptions(stateSelect, "focus");

    expect(backgroundControl).toHaveValue("#123456");

    expect(previewInput).toHaveStyle({
      backgroundColor: "#123456",
    });
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
