import { WORKSPACE_STORAGE_KEY } from "../utils/workspaceStorage";
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
