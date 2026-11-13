import { useId } from "react";

import "./Input.css";

function Input({ label, placeholder, styles = {}, styleState = "normal" }) {
  const inputId = useId();

  const isDisabled = styleState === "disabled";
  const isError = styleState === "error";

  const inputClassName = ["input-preview", `input-preview--${styleState}`].join(
    " ",
  );

  return (
    <div className="input-preview-wrapper">
      <label htmlFor={inputId}>{label}</label>

      <input
        id={inputId}
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        style={styles}
        disabled={isDisabled}
        readOnly
        aria-invalid={isError || undefined}
      />
    </div>
  );
}

export default Input;
