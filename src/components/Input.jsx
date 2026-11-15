import { useId } from "react";

import "./Input.css";

function Input({
  label,
  placeholder,
  styles = {},
  styleState = "normal",
  designEffect = "none",
}) {
  const inputId = useId();

  const isDisabled = styleState === "disabled";
  const isError = styleState === "error";

  const { backgroundColor, color, ...inputStyles } = styles;

  const inputStyle =
    designEffect === "none"
      ? styles
      : {
          ...inputStyles,
          "--component-background": backgroundColor ?? "var(--bg)",
          "--component-color": color ?? "var(--text-h)",
        };

  const inputClassName = [
    "input-preview",
    `input-preview--${styleState}`,
    `design-effect--${designEffect}`,
  ].join(" ");

  return (
    <div className="input-preview-wrapper">
      <label htmlFor={inputId}>{label}</label>

      <input
        id={inputId}
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        style={inputStyle}
        disabled={isDisabled}
        readOnly
        aria-invalid={isError || undefined}
      />
    </div>
  );
}

export default Input;
