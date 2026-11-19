import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import Input from "./Input";

describe("Input component", () => {
  it("renders the label and placeholder", () => {
    render(<Input label="Email" placeholder="Enter your email" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
  });

  it("connects the label to the input using a unique ID", () => {
    render(
      <>
        <Input label="Email" placeholder="Enter email" />
        <Input label="Username" placeholder="Enter username" />
      </>,
    );

    const emailInput = screen.getByLabelText("Email");
    const usernameInput = screen.getByLabelText("Username");

    expect(emailInput.id).not.toBe("");
    expect(usernameInput.id).not.toBe(emailInput.id);
  });

  it("uses Normal as the default style state", () => {
    render(<Input label="Email" placeholder="Enter email" />);

    expect(screen.getByLabelText("Email")).toHaveClass("input-preview--normal");
  });

  it.each(["normal", "hover", "focus", "disabled", "error"])(
    "applies the correct class for the %s state",
    (styleState) => {
      render(
        <Input
          label="Email"
          placeholder="Enter email"
          styleState={styleState}
        />,
      );

      expect(screen.getByLabelText("Email")).toHaveClass(
        `input-preview--${styleState}`,
      );
    },
  );

  it("applies the provided inline styles", () => {
    render(
      <Input
        label="Email"
        placeholder="Enter email"
        styles={{
          backgroundColor: "#123456",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
        }}
      />,
    );

    expect(screen.getByLabelText("Email")).toHaveStyle({
      backgroundColor: "#123456",
      color: "#ffffff",
      borderRadius: "12px",
      padding: "16px",
    });
  });

  it("disables the input when the Disabled state is selected", () => {
    render(
      <Input label="Email" placeholder="Enter email" styleState="disabled" />,
    );

    expect(screen.getByLabelText("Email")).toBeDisabled();
  });

  it("marks the input as invalid when the Error state is selected", () => {
    render(
      <Input label="Email" placeholder="Enter email" styleState="error" />,
    );

    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("keeps the preview input read-only", () => {
    render(<Input label="Email" placeholder="Enter email" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
  });

  it("uses CSS variables for colors when a design effect is active", () => {
    render(
      <Input
        label="Email"
        placeholder="Enter email"
        designEffect="glassmorphism"
        styles={{
          backgroundColor: "#123456",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
        }}
      />,
    );

    const input = screen.getByLabelText("Email");

    expect(input).toHaveClass("design-effect--glassmorphism");
    expect(input.style.getPropertyValue("--component-background")).toBe(
      "#123456",
    );
    expect(input.style.getPropertyValue("--component-color")).toBe("#ffffff");
    expect(input).toHaveStyle({
      borderRadius: "12px",
      padding: "16px",
    });
  });

  it("uses default CSS variable values when colors are missing with an active design effect", () => {
    render(
      <Input
        label="Email"
        placeholder="Enter email"
        designEffect="glassmorphism"
        styles={{
          borderRadius: "12px",
          padding: "16px",
        }}
      />,
    );

    const input = screen.getByLabelText("Email");

    expect(input.style.getPropertyValue("--component-background")).toBe(
      "var(--bg)",
    );
    expect(input.style.getPropertyValue("--component-color")).toBe(
      "var(--text-h)",
    );
  });
});
