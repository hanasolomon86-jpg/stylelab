import { useMemo, useState } from "react";

import {
  generateCss,
  generateJsx,
  generateTailwind,
} from "../utils/codeGenerator";

import "./CodeGenerator.css";

const FORMAT_OPTIONS = [
  { value: "jsx", label: "JSX" },
  { value: "css", label: "CSS" },
  { value: "tailwind", label: "Tailwind CSS" },
];

const CODE_GENERATORS = {
  jsx: generateJsx,
  css: generateCss,
  tailwind: generateTailwind,
};

function CodeGenerator({ componentId, componentData, activeStyleState }) {
  const [format, setFormat] = useState("jsx");

  const generatedCode = useMemo(() => {
    return CODE_GENERATORS[format]({
      componentId,
      componentData,
      activeStyleState,
      format,
    });
  }, [componentId, componentData, activeStyleState, format]);

  return (
    <div className="code-generator">
      <div className="code-generator__toolbar">
        <label htmlFor="code-format-select">Code format</label>

        <select
          id="code-format-select"
          value={format}
          onChange={(event) => setFormat(event.target.value)}
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="code-generator__description">
        Generated code updates automatically when you change your component.
      </p>

      <pre className="code-generator__output" aria-label="Generated code">
        <code>{generatedCode}</code>
      </pre>
    </div>
  );
}

export default CodeGenerator;
