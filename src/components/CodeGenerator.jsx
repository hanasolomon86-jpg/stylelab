import { useMemo, useState } from "react";

import {
  generateCss,
  generateJsx,
  generateTailwind,
} from "../utils/codeGenerator";

import { copyCodeToClipboard, exportCode } from "../utils/codeExport";

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

function CodeGeneratorActions({ generatedCode, componentId, format }) {
  const [feedback, setFeedback] = useState(null);

  async function handleCopy() {
    setFeedback(null);

    try {
      await copyCodeToClipboard(generatedCode);

      setFeedback({
        type: "success",
        message: "Code copied successfully!",
      });
    } catch {
      setFeedback({
        type: "error",
        message:
          "Unable to copy code. Check clipboard permissions and try again.",
      });
    }
  }

  function handleExport() {
    setFeedback(null);

    try {
      const result = exportCode({
        code: generatedCode,
        componentId,
        format,
      });

      setFeedback({
        type: "success",
        message: `Code exported successfully as ${result.fileName}.`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Unable to export code. Please try again.",
      });
    }
  }

  return (
    <div className="code-generator__action-area">
      <div className="code-generator__actions">
        <button
          type="button"
          className="code-generator__action code-generator__action--copy"
          onClick={handleCopy}
        >
          Copy
        </button>

        <button
          type="button"
          className="code-generator__action code-generator__action--export"
          onClick={handleExport}
        >
          Export
        </button>
      </div>

      {feedback && (
        <p
          className={`code-generator__feedback code-generator__feedback--${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live={feedback.type === "error" ? "assertive" : "polite"}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}

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
        <div className="code-generator__format-controls">
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

        <CodeGeneratorActions
          key={`${componentId}:${format}:${generatedCode}`}
          generatedCode={generatedCode}
          componentId={componentId}
          format={format}
        />
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
