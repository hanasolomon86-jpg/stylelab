import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

function changeColor(input, value) {
  fireEvent.change(input, {
    target: { value },
  });
}

function changeNumber(input, value) {
  fireEvent.change(input, {
    target: { value: String(value) },
  });
}

describe("Studio workspace", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("displays the default Card component", async () => {
    const user = userEvent.setup();

    renderStudio();

    expect(screen.getByLabelText("Component")).toHaveValue("card");

    await user.click(screen.getByRole("button", { name: "Content" }));

    expect(screen.getByLabelText("Card title")).toHaveValue("Product Title");

    expect(
      screen.getByRole("heading", { name: "Product Title" }),
    ).toBeInTheDocument();
  });

  it("allows the user to select a different component", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Component"), "button");

    await user.click(screen.getByRole("button", { name: "Content" }));

    expect(screen.getByLabelText("Component")).toHaveValue("button");

    expect(screen.getByLabelText("Button label")).toHaveValue("Click Me");
  });

  it("updates component content and its preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.click(screen.getByRole("button", { name: "Content" }));
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

    await user.click(screen.getByRole("button", { name: "Layout" }));

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

    await user.click(screen.getByRole("button", { name: "Layout" }));

    await user.selectOptions(screen.getByLabelText("Image layout"), "left");

    // Switch to Button
    await user.selectOptions(screen.getByLabelText("Component"), "button");

    expect(screen.queryByLabelText("Image layout")).not.toBeInTheDocument();

    // Return to Card
    await user.selectOptions(screen.getByLabelText("Component"), "card");

    // Layout is available again, but Style is the active category
    await user.click(screen.getByRole("button", { name: "Layout" }));

    expect(screen.getByLabelText("Image layout")).toHaveValue("left");

    // Changing style state must not reset the Card layout
    await user.selectOptions(screen.getByLabelText("Style state"), "hover");

    expect(screen.getByLabelText("Image layout")).toHaveValue("left");
  });

  it("shows the Image Gallery only when Card is selected", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.click(screen.getByRole("button", { name: "Content" }));

    expect(
      screen.getByRole("heading", { name: "Image Gallery" }),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Component"), "button");

    expect(
      screen.queryByRole("heading", { name: "Image Gallery" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Component"), "card");

    expect(
      screen.getByRole("heading", { name: "Image Gallery" }),
    ).toBeInTheDocument();
  });

  it("updates the Card preview and persists the selected gallery image", async () => {
    const user = userEvent.setup();

    const { unmount } = renderStudio();

    await user.click(screen.getByRole("button", { name: "Content" }));
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

    await user.click(screen.getByRole("button", { name: "Content" }));

    expect(
      screen.getByRole("button", { name: "Select Sneakers" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("updates the Button label and its preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.click(screen.getByRole("button", { name: "Content" }));
    await user.selectOptions(screen.getByLabelText("Component"), "button");

    const labelInput = screen.getByLabelText("Button label");

    await user.clear(labelInput);
    await user.type(labelInput, "Continue");

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });

  it("does not create style overrides when displaying default or inherited colors", async () => {
    const user = userEvent.setup();

    renderStudio();

    const backgroundInput = screen.getByLabelText("Background color");
    const stateSelect = screen.getByLabelText("Style state");

    // Card displays its default background color
    expect(backgroundInput).toHaveValue("#ffffff");

    let savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.card.styles.normal).not.toHaveProperty(
      "backgroundColor",
    );

    // Switch to Hover without changing the color
    await user.selectOptions(stateSelect, "hover");

    expect(backgroundInput).toHaveValue("#ffffff");

    savedWorkspace = JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY));

    expect(savedWorkspace.components.card.styles.hover).not.toHaveProperty(
      "backgroundColor",
    );
  });

  it("displays the correct default colors for each component", async () => {
    const user = userEvent.setup();

    renderStudio();

    const backgroundInput = screen.getByLabelText("Background color");
    const textColorInput = screen.getByLabelText("Text color");

    // Card defaults
    expect(backgroundInput).toHaveValue("#ffffff");
    expect(textColorInput).toHaveValue("#6b6375");

    // Button defaults
    await user.selectOptions(screen.getByLabelText("Component"), "button");

    expect(backgroundInput).toHaveValue("#aa3bff");
    expect(textColorInput).toHaveValue("#ffffff");

    // Input defaults
    await user.selectOptions(screen.getByLabelText("Component"), "input");

    expect(backgroundInput).toHaveValue("#ffffff");
    expect(textColorInput).toHaveValue("#08060d");

    // Displaying default colors must not create overrides
    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    for (const componentId of ["card", "button", "input"]) {
      expect(
        savedWorkspace.components[componentId].styles.normal,
      ).not.toHaveProperty("backgroundColor");

      expect(
        savedWorkspace.components[componentId].styles.normal,
      ).not.toHaveProperty("color");
    }
  });

  it("applies Button style settings to the preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Component"), "button");

    const backgroundInput = screen.getByLabelText("Background color");

    changeColor(backgroundInput, "#123456");

    expect(screen.getByRole("button", { name: "Click Me" })).toHaveStyle({
      backgroundColor: "#123456",
    });
  });

  it("displays all Button style states correctly", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Component"), "button");

    const stateSelect = screen.getByLabelText("Style state");

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

  it("uses the same Normal styles across all interaction states", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Component"), "button");

    const stateSelect = screen.getByLabelText("Style state");
    const backgroundInput = screen.getByLabelText("Background color");
    const button = screen.getByRole("button", { name: "Click Me" });

    changeColor(backgroundInput, "#123456");

    for (const styleState of [
      "normal",
      "hover",
      "focus",
      "disabled",
      "error",
    ]) {
      await user.selectOptions(stateSelect, styleState);

      expect(backgroundInput).toHaveValue("#123456");
      expect(button).toHaveStyle({
        backgroundColor: "#123456",
      });
    }
  });

  it("does not create state-specific overrides or show reset actions", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Component"), "button");

    const stateSelect = screen.getByLabelText("Style state");
    const backgroundInput = screen.getByLabelText("Background color");
    const button = screen.getByRole("button", { name: "Click Me" });

    await user.selectOptions(stateSelect, "hover");

    const backgroundControl = backgroundInput.closest(".style-control");

    expect(backgroundControl).not.toHaveTextContent(
      /Inherited from Normal|Custom/i,
    );
    expect(backgroundControl.querySelector("button")).toBeNull();

    expect(
      screen.queryByRole("button", {
        name: /Reset .* override/i,
      }),
    ).not.toBeInTheDocument();

    changeColor(backgroundInput, "#abcdef");

    expect(button).toHaveStyle({
      backgroundColor: "#abcdef",
    });

    await user.selectOptions(stateSelect, "normal");

    expect(backgroundInput).toHaveValue("#abcdef");

    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.button.styles.normal.backgroundColor).toBe(
      "#abcdef",
    );

    expect(
      savedWorkspace.components.button.styles.hover.backgroundColor,
    ).toBeUndefined();
  });

  it("updates the Input label and placeholder in the preview", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.click(screen.getByRole("button", { name: "Content" }));
    await user.selectOptions(screen.getByLabelText("Component"), "input");

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

    await user.selectOptions(screen.getByLabelText("Component"), "input");

    const backgroundInput = screen.getByLabelText("Background color");
    const textColorInput = screen.getByLabelText("Text color");
    const borderRadiusInput = screen.getByLabelText("Border radius");
    const paddingInput = screen.getByLabelText("Padding");

    changeColor(backgroundInput, "#123456");
    changeColor(textColorInput, "#ffffff");
    changeNumber(borderRadiusInput, 12);
    changeNumber(paddingInput, 16);

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

    await user.selectOptions(screen.getByLabelText("Component"), "input");

    const stateSelect = screen.getByLabelText("Style state");

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

    await user.selectOptions(screen.getByLabelText("Component"), "input");

    const stateSelect = screen.getByLabelText("Style state");
    const backgroundControl = screen.getByLabelText("Background color");

    const previewInput = screen.getByRole("textbox", {
      name: "Email",
    });

    changeColor(backgroundControl, "#123456");

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

  it("updates base numeric styles when an interaction state is selected", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Component"), "button");
    await user.selectOptions(screen.getByLabelText("Style state"), "hover");

    const borderRadiusInput = screen.getByLabelText("Border radius");
    const button = screen.getByRole("button", { name: "Click Me" });

    changeNumber(borderRadiusInput, 18);

    expect(button).toHaveStyle({
      borderRadius: "18px",
    });

    await user.selectOptions(screen.getByLabelText("Style state"), "normal");

    expect(borderRadiusInput).toHaveValue("18");
    expect(button).toHaveStyle({
      borderRadius: "18px",
    });

    await user.selectOptions(screen.getByLabelText("Style state"), "hover");

    expect(borderRadiusInput).toHaveValue("18");
    expect(button).toHaveStyle({
      borderRadius: "18px",
    });
  });

  it("updates the preview and persists the selected design effect", async () => {
    const user = userEvent.setup();

    const { container } = renderStudio();

    await user.click(screen.getByRole("button", { name: "Effects" }));

    const effectSelect = screen.getByLabelText("Select design effect");
    const previewStage = container.querySelector(".preview-stage");

    expect(effectSelect).toHaveValue("none");
    expect(previewStage).toHaveClass("preview-stage--none");

    await user.selectOptions(effectSelect, "glassmorphism");

    expect(effectSelect).toHaveValue("glassmorphism");
    expect(previewStage).toHaveClass("preview-stage--glassmorphism");

    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.card.designEffect).toBe("glassmorphism");
  });

  it("switches the Live Preview background between Dark and Light", async () => {
    const user = userEvent.setup();

    const { container } = renderStudio();

    const darkButton = screen.getByRole("button", { name: "Dark" });
    const lightButton = screen.getByRole("button", { name: "Light" });
    const previewCanvas = container.querySelector(".preview-canvas");

    expect(darkButton).toHaveAttribute("aria-pressed", "true");
    expect(lightButton).toHaveAttribute("aria-pressed", "false");
    expect(previewCanvas).toHaveClass("preview-canvas--dark");

    await user.click(lightButton);

    expect(lightButton).toHaveAttribute("aria-pressed", "true");
    expect(darkButton).toHaveAttribute("aria-pressed", "false");
    expect(previewCanvas).toHaveClass("preview-canvas--light");

    await user.click(darkButton);

    expect(darkButton).toHaveAttribute("aria-pressed", "true");
    expect(lightButton).toHaveAttribute("aria-pressed", "false");
    expect(previewCanvas).toHaveClass("preview-canvas--dark");
  });

  it("supports zero and prevents negative numeric style values", async () => {
    const user = userEvent.setup();

    renderStudio();

    await user.selectOptions(screen.getByLabelText("Component"), "input");

    const borderRadiusInput = screen.getByLabelText("Border radius");
    const previewInput = screen.getByRole("textbox", {
      name: "Email",
    });

    expect(borderRadiusInput).toHaveAttribute("min", "0");
    expect(borderRadiusInput).toHaveAttribute("step", "1");

    changeNumber(borderRadiusInput, 0);

    expect(previewInput).toHaveStyle({
      borderRadius: "0px",
    });

    let savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.input.styles.normal.borderRadius).toBe(
      "0px",
    );

    changeNumber(borderRadiusInput, -2);

    savedWorkspace = JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY));

    expect(savedWorkspace.components.input.styles.normal.borderRadius).toBe(
      "0px",
    );

    expect(previewInput).toHaveStyle({
      borderRadius: "0px",
    });
  });
});
