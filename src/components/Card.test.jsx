import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Card from "./Card";

describe("Card component", () => {
  it("renders the card title and description", () => {
    render(<Card title="Product Title" description="Product description" />);

    expect(
      screen.getByRole("heading", { name: "Product Title" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Product description")).toBeInTheDocument();
  });

  it("renders an image when imageId is provided", () => {
    render(
      <Card
        imageId="/images/product.jpg"
        title="Product Title"
        description="Product description"
      />,
    );

    const image = screen.getByRole("img", { name: "Product Title" });

    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/product.jpg");
  });

  it("does not render an image when imageId is not provided", () => {
    render(<Card title="Product Title" description="Product description" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("uses the top layout by default", () => {
    const { container } = render(
      <Card title="Product Title" description="Product description" />,
    );

    expect(container.querySelector(".card")).toHaveClass("card--top");
  });

  it("supports the left layout", () => {
    const { container } = render(
      <Card
        title="Product Title"
        description="Product description"
        layout="left"
      />,
    );

    expect(container.querySelector(".card")).toHaveClass("card--left");
  });

  it("applies the selected styles and style state", () => {
    const styles = {
      backgroundColor: "#ffffff",
      color: "#111111",
      borderRadius: "12px",
    };

    const { container } = render(
      <Card
        title="Product Title"
        description="Product description"
        styles={styles}
        styleState="hover"
      />,
    );

    const card = container.querySelector(".card");

    expect(card).toHaveStyle({
      backgroundColor: "#ffffff",
      color: "#111111",
      borderRadius: "12px",
    });

    expect(card).toHaveClass("card--hover");
  });
  it("renders an image placeholder when showImagePlaceholder is enabled", () => {
    render(
      <Card
        title="Product Title"
        description="Product description"
        showImagePlaceholder
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Product Title image placeholder",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Image preview")).toBeInTheDocument();
  });
  it("renders the actual image instead of the placeholder when an image is provided", () => {
    render(
      <Card
        imageId="/images/product.jpg"
        title="Product Title"
        description="Product description"
        showImagePlaceholder
      />,
    );

    expect(screen.getByRole("img", { name: "Product Title" })).toHaveAttribute(
      "src",
      "/images/product.jpg",
    );

    expect(screen.queryByText("Image preview")).not.toBeInTheDocument();
  });
});
