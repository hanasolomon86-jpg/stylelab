import "./Button.css";

function Button({ label, styles = {}, styleState = "normal" }) {
  const isDisabled = styleState === "disabled";

  const buttonClassName = [
    "button-preview",
    `button-preview--${styleState}`,
  ].join(" ");

  return (
    <button
      type="button"
      className={buttonClassName}
      style={styles}
      disabled={isDisabled}
    >
      {label}
    </button>
  );
}

export default Button;
