import "./Card.css";

function Card({
  imageId,
  title,
  description,
  layout = "top",
  styles = {},
  styleState = "normal",
  showImagePlaceholder = false,
}) {
  const cardClassName = ["card", `card--${layout}`, `card--${styleState}`].join(
    " ",
  );

  const hasImage = Boolean(imageId);
  const shouldShowImage = hasImage || showImagePlaceholder;
  const { padding, ...cardStyles } = styles;

  return (
    <article className={cardClassName} style={cardStyles}>
      {shouldShowImage && (
        <div
          className={`card__image${!hasImage ? " card__image--placeholder" : ""}`}
          role={!hasImage ? "img" : undefined}
          aria-label={
            !hasImage ? `${title || "Card"} image placeholder` : undefined
          }
        >
          {hasImage ? (
            <img src={imageId} alt={title} />
          ) : (
            <span className="card__placeholder-label">Image preview</span>
          )}
        </div>
      )}

      <div className="card__content" style={padding ? { padding } : undefined}>
        <h3 className="card__title">{title}</h3>
        <p className="card__description">{description}</p>
      </div>
    </article>
  );
}

export default Card;
