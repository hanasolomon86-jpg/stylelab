import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download } from "lucide-react";

import "prismjs/plugins/line-numbers/prism-line-numbers.css";

import {
  generateCss,
  generateJsx,
  generateTailwind,
} from "../utils/codeGenerator";

import { copyCodeToClipboard, exportCode } from "../utils/codeExport";
import { formatGeneratedCode } from "../utils/formatGeneratedCode";
import { logger } from "../utils/logger";

import "./CodeGenerator.css";

let prismPromise;

function loadPrism() {
  if (!prismPromise) {
    prismPromise = (async () => {
      const prismModule = await import("prismjs");
      const Prism = prismModule.default;

      // Load language definitions in dependency order.
      await import("prismjs/components/prism-markup");
      await import("prismjs/components/prism-javascript");
      await import("prismjs/components/prism-jsx");
      await import("prismjs/components/prism-css");

      await import("prismjs/plugins/line-numbers/prism-line-numbers");

      return Prism;
    })().catch((error) => {
      prismPromise = null;
      throw error;
    });
  }

  return prismPromise;
}

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

function CodeGeneratorActions({
  generatedCode,
  componentId,
  format,
  disabled,
}) {
  const [feedback, setFeedback] = useState(null);

  async function handleCopy() {
    setFeedback(null);

    try {
      await copyCodeToClipboard(generatedCode);

      logger.info("Code copied successfully.");

      setFeedback({
        type: "success",
        message: "Code copied successfully!",
      });
    } catch {
      logger.error("Failed to copy generated code.");

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

      logger.info("Code exported successfully.");

      setFeedback({
        type: "success",
        message: `Code exported successfully as ${result.fileName}.`,
      });
    } catch {
      logger.error("Failed to export generated code.");

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
          disabled={disabled}
        >
          <Copy size={14} aria-hidden="true" />
          Copy
        </button>

        <button
          type="button"
          className="code-generator__action code-generator__action--export"
          onClick={handleExport}
          disabled={disabled}
        >
          <Download size={14} aria-hidden="true" />
          Export
        </button>
      </div>

      {feedback && (
        <p
          className={`code-generator__feedback code-generator__feedback--${feedback.type}`}
        >
          {feedback.message}
        </p>
      )}

      <span
        className="code-generator__sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback?.type === "success" ? feedback.message : ""}
      </span>

      <span
        className="code-generator__sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {feedback?.type === "error" ? feedback.message : ""}
      </span>
    </div>
  );
}

function CodeGenerator({ componentId, componentData }) {
  const [format, setFormat] = useState("jsx");

  const [formattedResult, setFormattedResult] = useState({
    source: null,
    code: "",
  });

  const codeRef = useRef(null);

  const generatedCode = useMemo(() => {
    return CODE_GENERATORS[format]({
      componentId,
      componentData,
      format,
    });
  }, [componentId, componentData, format]);

  const isFormatting = formattedResult.source !== generatedCode;

  const displayedCode = isFormatting ? generatedCode : formattedResult.code;

  const language = format === "css" ? "css" : "jsx";

  const fileName =
    format === "css"
      ? `${componentId}.css`
      : format === "tailwind"
        ? `${componentId}-tailwind.jsx`
        : `${componentId}.jsx`;

  useEffect(() => {
    let isCurrent = true;

    formatGeneratedCode(generatedCode, format)
      .then((formattedCode) => {
        if (isCurrent) {
          setFormattedResult({
            source: generatedCode,
            code: formattedCode,
          });
        }
      })
      .catch(() => {
        if (isCurrent) {
          logger.warn("Unable to format generated code.");

          setFormattedResult({
            source: generatedCode,
            code: generatedCode,
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [generatedCode, format]);

  useEffect(() => {
    let isCurrent = true;

    async function highlightCode() {
      try {
        const Prism = await loadPrism();

        if (isCurrent && codeRef.current) {
          Prism.highlightElement(codeRef.current);
        }
      } catch {
        if (isCurrent) {
          logger.error("Unable to highlight generated code.");
        }
      }
    }

    highlightCode();

    return () => {
      isCurrent = false;
    };
  }, [displayedCode, language]);

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
          generatedCode={displayedCode}
          componentId={componentId}
          format={format}
          disabled={isFormatting}
        />
      </div>

      <p className="code-generator__description">
        Generated code updates automatically when you change your component.
        {isFormatting ? " Formatting..." : ""}
      </p>

      <div className="code-generator__editor">
        <div className="code-generator__file-header">
          <div className="code-generator__file-name">
            <span className="code-generator__file-indicator" />
            <span>{fileName}</span>
          </div>

          <span className="code-generator__language">{format}</span>
        </div>

        <pre
          className={`code-generator__output line-numbers language-${language}`}
          aria-label="Generated code"
          aria-busy={isFormatting}
        >
          <code ref={codeRef} className={`language-${language}`}>
            {displayedCode}
          </code>
        </pre>
      </div>
    </div>
  );
}

export default CodeGenerator;
