import "./ImageGallery.css";

function ImageGallery({ images, selectedImageId, onSelect }) {
  return (
    <section className="image-gallery" aria-labelledby="image-gallery-title">
      <h3 id="image-gallery-title">Image Gallery</h3>

      <div className="image-gallery__grid">
        {images.map((image) => {
          const isSelected = selectedImageId === image.id;

          return (
            <button
              key={image.id}
              type="button"
              className={`image-gallery__item ${
                isSelected ? "image-gallery__item--selected" : ""
              }`}
              onClick={() => onSelect(image.id)}
              aria-pressed={isSelected}
              aria-label={`Select ${image.label}`}
            >
              <img src={image.src} alt={image.alt} />
              <span>{image.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ImageGallery;
