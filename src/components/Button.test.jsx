import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import Button from "./Button";

describe("Button component", () => {
  it("renders the button label", () => {
    render(<Button label="Save Changes" />);

    expect(
      screen.getByRole("button", { name: "Save Changes" }),
    ).toBeInTheDocument();
  });

  it("uses Normal as the default style state", () => {
    render(<Button label="Click Me" />);

    expect(screen.getByRole("button")).toHaveClass("button-preview--normal");
  });

  it.each(["normal", "hover", "focus", "disabled", "error"])(
    "applies the correct class for the %s state",
    (styleState) => {
      render(<Button label="Click Me" styleState={styleState} />);

      expect(screen.getByRole("button")).toHaveClass(
        `button-preview--${styleState}`,
      );
    },
  );

  it("applies the provided inline styles", () => {
    render(
      <Button
        label="Save"
        styles={{
          backgroundColor: "#123456",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
        }}
      />,
    );

    expect(screen.getByRole("button")).toHaveStyle({
      backgroundColor: "#123456",
      color: "#ffffff",
      borderRadius: "12px",
      padding: "16px",
    });
  });

  it("disables the button when the Disabled state is selected", () => {
    render(<Button label="Unavailable" styleState="disabled" />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("keeps the button enabled in other style states", () => {
    render(<Button label="Available" styleState="normal" />);

    expect(screen.getByRole("button")).toBeEnabled();
  });
});
