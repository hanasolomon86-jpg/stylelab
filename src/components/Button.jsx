import "./Button.css";

function Button({
  label,
  styles = {},
  styleState = "normal",
  designEffect = "none",
}) {
  const isDisabled = styleState === "disabled";

  const { backgroundColor, color, ...buttonStyles } = styles;

  const buttonStyle =
    designEffect === "none"
      ? styles
      : {
          ...buttonStyles,
          "--component-background": backgroundColor ?? "var(--accent)",
          "--component-color": color ?? "#ffffff",
        };

  const buttonClassName = [
    "button-preview",
    `button-preview--${styleState}`,
    `design-effect--${designEffect}`,
  ].join(" ");

  return (
    <button
      type="button"
      className={buttonClassName}
      style={buttonStyle}
      disabled={isDisabled}
    >
      {label}
    </button>
  );
}

export default Button;
