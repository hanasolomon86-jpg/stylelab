import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkspaceProvider } from "./WorkspaceContext.jsx";
import { useWorkspace } from "../hooks/useWorkspace";
import { WORKSPACE_STORAGE_KEY } from "../utils/workspaceStorage";

function WorkspaceConsumer() {
  const {
    workspace,
    selectedComponent,
    activeStyleState,
    hasStorageError,
    selectComponent,
    selectStyleState,
    updateComponentContent,
    updateComponentStyle,
    updateComponentLayout,
    updateComponentDesignEffect,
  } = useWorkspace();

  return (
    <div>
      <p data-testid="selected-component">{selectedComponent}</p>

      <p data-testid="active-style-state">{activeStyleState}</p>

      <p data-testid="card-title">{workspace.components.card.content.title}</p>
      <p data-testid="card-layout">
        {workspace.components.card.layout ?? "top"}
      </p>

      <p data-testid="normal-background">
        {workspace.components.card.styles.normal.backgroundColor ?? ""}
      </p>

      <p data-testid="hover-background">
        {workspace.components.card.styles.hover.backgroundColor ?? ""}
      </p>

      <p data-testid="card-design-effect">
        {workspace.components.card.designEffect}
      </p>

      <p data-testid="storage-error">{String(hasStorageError)}</p>

      <button
        onClick={() => updateComponentDesignEffect("card", "glassmorphism")}
      >
        Update card design effect
      </button>

      <button
        onClick={() => updateComponentContent("card", "title", "Saved title")}
      >
        Update card title
      </button>
      <button onClick={() => updateComponentLayout("card", "left")}>
        Update card layout
      </button>

      <button
        onClick={() =>
          updateComponentStyle("card", "normal", "backgroundColor", "#123456")
        }
      >
        Update base style
      </button>

      <button
        onClick={() =>
          updateComponentStyle("card", "hover", "backgroundColor", "#abcdef")
        }
      >
        Attempt hover style
      </button>

      <button onClick={() => selectComponent("button")}>Select button</button>

      <button onClick={() => selectStyleState("hover")}>Select hover</button>

      <button onClick={() => selectComponent("invalid")}>
        Select invalid component
      </button>

      <button onClick={() => selectStyleState("invalid")}>
        Select invalid style
      </button>
    </div>
  );
}

function renderWorkspace() {
  return render(
    <WorkspaceProvider>
      <WorkspaceConsumer />
    </WorkspaceProvider>,
  );
}

describe("WorkspaceContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides the initial workspace and editor defaults", () => {
    renderWorkspace();

    expect(screen.getByTestId("selected-component")).toHaveTextContent("card");

    expect(screen.getByTestId("active-style-state")).toHaveTextContent(
      "normal",
    );

    expect(screen.getByTestId("card-title")).toHaveTextContent("Product Title");
  });

  it("updates workspace data and saves it to LocalStorage", async () => {
    const user = userEvent.setup();

    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Update card title" }));

    await user.click(screen.getByRole("button", { name: "Update base style" }));

    expect(screen.getByTestId("card-title")).toHaveTextContent("Saved title");

    expect(screen.getByTestId("normal-background")).toHaveTextContent(
      "#123456",
    );
    expect(screen.getByTestId("hover-background")).toBeEmptyDOMElement();

    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.card.content.title).toBe("Saved title");

    expect(savedWorkspace.components.card.styles.normal.backgroundColor).toBe(
      "#123456",
    );

    expect(savedWorkspace.components.card.styles.hover).toEqual({});
  });

  it("restores workspace data but resets temporary editor state", async () => {
    const user = userEvent.setup();

    const { unmount } = renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Update card title" }));

    await user.click(screen.getByRole("button", { name: "Select button" }));

    await user.click(screen.getByRole("button", { name: "Select hover" }));

    expect(screen.getByTestId("selected-component")).toHaveTextContent(
      "button",
    );

    expect(screen.getByTestId("active-style-state")).toHaveTextContent("hover");

    unmount();

    renderWorkspace();

    expect(screen.getByTestId("card-title")).toHaveTextContent("Saved title");

    expect(screen.getByTestId("selected-component")).toHaveTextContent("card");

    expect(screen.getByTestId("active-style-state")).toHaveTextContent(
      "normal",
    );
  });
  it("updates the Card layout and saves it to LocalStorage", async () => {
    const user = userEvent.setup();

    const { unmount } = renderWorkspace();

    await user.click(
      screen.getByRole("button", { name: "Update card layout" }),
    );

    expect(screen.getByTestId("card-layout")).toHaveTextContent("left");

    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.card.layout).toBe("left");

    unmount();

    renderWorkspace();

    expect(screen.getByTestId("card-layout")).toHaveTextContent("left");
  });

  it("ignores style updates outside Normal", async () => {
    const user = userEvent.setup();

    renderWorkspace();

    await user.click(
      screen.getByRole("button", { name: "Attempt hover style" }),
    );

    expect(screen.getByTestId("hover-background")).toBeEmptyDOMElement();
    expect(screen.getByTestId("normal-background")).toBeEmptyDOMElement();

    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.card.styles.hover).toEqual({});
    expect(savedWorkspace.components.card.styles.normal).toEqual({});
  });

  it("ignores invalid component and style selections", async () => {
    const user = userEvent.setup();

    renderWorkspace();

    await user.click(
      screen.getByRole("button", { name: "Select invalid component" }),
    );

    await user.click(
      screen.getByRole("button", { name: "Select invalid style" }),
    );

    expect(screen.getByTestId("selected-component")).toHaveTextContent("card");

    expect(screen.getByTestId("active-style-state")).toHaveTextContent(
      "normal",
    );
  });

  it("updates the Card design effect and saves it to LocalStorage", async () => {
    const user = userEvent.setup();

    renderWorkspace();

    await user.click(
      screen.getByRole("button", { name: "Update card design effect" }),
    );

    expect(screen.getByTestId("card-design-effect")).toHaveTextContent(
      "glassmorphism",
    );

    const savedWorkspace = JSON.parse(
      localStorage.getItem(WORKSPACE_STORAGE_KEY),
    );

    expect(savedWorkspace.components.card.designEffect).toBe("glassmorphism");
  });

  it("reports storage errors and clears them after a successful save", async () => {
    const user = userEvent.setup();

    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

    renderWorkspace();

    expect(screen.getByTestId("storage-error")).toHaveTextContent("true");

    setItemSpy.mockRestore();

    await user.click(screen.getByRole("button", { name: "Update card title" }));

    expect(screen.getByTestId("storage-error")).toHaveTextContent("false");
  });
});
