import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import ImageGallery from "./ImageGallery";
import IMAGE_GALLERY from "../data/imageGallery";

describe("ImageGallery component", () => {
  it("renders all six gallery images and their labels", () => {
    render(
      <ImageGallery
        images={IMAGE_GALLERY}
        selectedImageId={null}
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Image Gallery" }),
    ).toBeInTheDocument();

    IMAGE_GALLERY.forEach((image) => {
      expect(screen.getByRole("img", { name: image.alt })).toHaveAttribute(
        "src",
        image.src,
      );

      expect(screen.getByText(image.label)).toBeInTheDocument();
    });
  });

  it("calls onSelect with the selected image ID", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ImageGallery
        images={IMAGE_GALLERY}
        selectedImageId={null}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select Plant" }));

    expect(onSelect).toHaveBeenCalledWith("plant");
  });

  it("marks the selected image", () => {
    render(
      <ImageGallery
        images={IMAGE_GALLERY}
        selectedImageId="coffee-mug"
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Select Coffee Mug" }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(
      screen.getByRole("button", { name: "Select Plant" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("allows the user to change the selected image", async () => {
    const user = userEvent.setup();

    function GalleryWithState() {
      const [selectedImageId, setSelectedImageId] = useState("plant");

      return (
        <ImageGallery
          images={IMAGE_GALLERY}
          selectedImageId={selectedImageId}
          onSelect={setSelectedImageId}
        />
      );
    }

    render(<GalleryWithState />);

    await user.click(screen.getByRole("button", { name: "Select Sneakers" }));

    expect(
      screen.getByRole("button", { name: "Select Sneakers" }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(
      screen.getByRole("button", { name: "Select Plant" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
