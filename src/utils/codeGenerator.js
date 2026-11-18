import {
    COMPONENT_IDS,
    DESIGN_EFFECTS,
    STYLE_STATES,
} from "../reducers/workspaceReducer";

import IMAGE_GALLERY from "../data/imageGallery";

export const CODE_FORMATS = ["jsx", "css", "tailwind"];

/**
 * Resolves the final styles for each state.
 * Every state inherits Normal styles unless it overrides them.
 */
/**
 * Keeps Normal as the only source of component styles.
 * Interaction states do not contain independent style values.
 */
export function resolveStylesByState(styles = {}) {
    const normalStyles = { ...(styles.normal ?? {}) };

    return Object.fromEntries(
        STYLE_STATES.map((styleState) => [
            styleState,
            styleState === "normal" ? { ...normalStyles } : {},
        ]),
    );
}

/**
 * Converts a value into a safe JavaScript string literal.
 * JSON.stringify handles quotes, new lines and special characters.
 */
export function escapeJsxString(value) {
    return JSON.stringify(String(value ?? ""));
}

/**
 * Finds the selected image source from the existing gallery.
 */
export function resolveImageSource(imageId) {
    if (!imageId) {
        return null;
    }

    const selectedImage = IMAGE_GALLERY.find((image) => image.id === imageId);

    return selectedImage?.src ?? null;
}

/**
 * Validates and normalizes the data received by the generator.
 */
export function normalizeGeneratorOptions(options = {}) {
    const {
        componentId,
        componentData,
        format = "jsx",
    } = options;

    if (!COMPONENT_IDS.includes(componentId)) {
        throw new Error(`Unsupported component: ${componentId}`);
    }

    if (!componentData || typeof componentData !== "object") {
        throw new Error("Component data is required.");
    }

    if (!CODE_FORMATS.includes(format)) {
        throw new Error(`Unsupported code format: ${format}`);
    }

    const styles = resolveStylesByState(componentData.styles);

    return {
        componentId,
        componentData,
        content: componentData.content ?? {},
        styles,
        designEffect: DESIGN_EFFECTS.includes(componentData.designEffect)
            ? componentData.designEffect
            : "none",
        layout:
            componentId === "card" && componentData.layout === "left"
                ? "left"
                : "top",
        imageSrc:
            componentId === "card"
                ? resolveImageSource(componentData.content?.imageId)
                : null,
        format,
    };
}

/**
 * Creates a generated CSS class name for the selected component.
 */
function getGeneratedClassName(options) {
    const { componentId, designEffect, layout } = options;

    const classes = [
        `stylelab-${componentId}`,
        `stylelab-${componentId}--effect-${designEffect}`,
    ];

    if (componentId === "card") {
        classes.push(`stylelab-card--layout-${layout}`);
    }

    return classes.join(" ");
}

/**
 * Generates standalone React JSX for the selected component.
 */
export function generateJsx(options) {
    const config = normalizeGeneratorOptions({
        ...options,
        format: "jsx",
    });

    const { componentId, content, imageSrc } = config;

    const className = getGeneratedClassName(config);
    const cssImport = `import "./${componentId}.css";`;

    if (componentId === "card") {
        const imageMarkup = imageSrc
            ? `
          <img
            className="stylelab-card__image"
            src=${escapeJsxString(imageSrc)}
            alt=${escapeJsxString(content.title || "Card image")}
          />`
            : "";

        return `${cssImport}

export default function GeneratedCard() {
  return (
    <article
      className=${escapeJsxString(className)}
      tabIndex={0}
    >
      ${imageMarkup}
      <div className="stylelab-card__content">
        <h3
            style={{ color: "var(--component-title-color, var(--component-color, #302d43))" }}
        >
            {${escapeJsxString(content.title)}}
        </h3>
        <p>{${escapeJsxString(content.description)}}</p>
      </div>
    </article>
  );
}`;
    }

    if (componentId === "button") {
        return `${cssImport}

export default function GeneratedButton() {
  return (
    <button
      type="button"
      className=${escapeJsxString(className)}
    >
      {${escapeJsxString(content.label)}}
    </button>
  );
}`;
    }

    return `${cssImport}

export default function GeneratedInput() {
  return (
    <div className="stylelab-input-wrapper">
      <label htmlFor="stylelab-generated-input">
        {${escapeJsxString(content.label)}}
      </label>
      <input
        id="stylelab-generated-input"
        type="text"
        className=${escapeJsxString(className)}
        placeholder=${escapeJsxString(content.placeholder)}
      />
    </div>
  );
}`;
}

const CSS_PROPERTY_MAP = {
    backgroundColor: "--component-background",
    color: "--component-color",
    titleColor: "--component-title-color",
    borderRadius: "border-radius",
    padding: "padding",
};

/**
 * Prevents user-entered values from breaking CSS declarations.
 */
function sanitizeCssValue(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const normalizedValue = String(value).trim();

    if (!normalizedValue || /[;{}\r\n]/.test(normalizedValue)) {
        return null;
    }

    return normalizedValue;
}


/**
 * Converts resolved component styles into CSS declarations.
 */
function createCssDeclarations(componentId, styles = {}) {
    const declarations = [];
    const contentDeclarations = [];

    Object.entries(CSS_PROPERTY_MAP).forEach(([styleProperty, cssProperty]) => {
        const value = sanitizeCssValue(styles[styleProperty]);

        if (value === null) {
            return;
        }

        if (styleProperty === "padding" && componentId === "card") {
            contentDeclarations.push(`padding: ${value};`);
            return;
        }

        declarations.push(`${cssProperty}: ${value};`);
    });

    return {
        declarations,
        contentDeclarations,
    };
}

/**
 * Generates the component's base CSS declarations from Normal styles.
 */
function generateBaseStyleCss(componentId, styles = {}) {
    const { declarations, contentDeclarations } = createCssDeclarations(
        componentId,
        styles,
    );

    const selector = `.stylelab-${componentId}`;
    const rules = [];

    if (declarations.length > 0) {
        rules.push(
            `${selector} {\n  ${declarations.join("\n  ")}\n}`,
        );
    }

    if (componentId === "card" && contentDeclarations.length > 0) {
        rules.push(
            `${selector} .stylelab-card__content {\n  ${contentDeclarations.join("\n  ")}\n}`,
        );
    }

    return rules.join("\n\n");
}

/**
 * Generates the standalone base styles for one component.
 */
function generateBaseComponentCss(componentId) {
    if (componentId === "card") {
        return `
.stylelab-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--component-background, #ffffff);
  color: var(--component-color, #302d43);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  transition: all 0.25s ease;
}

.stylelab-card--layout-left {
  flex-direction: row;
  align-items: stretch;
}

.stylelab-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  flex-shrink: 0;
}

.stylelab-card--layout-left .stylelab-card__image {
  width: 40%;
  aspect-ratio: 1 / 1;
}

.stylelab-card__content {
  flex: 1;
  min-width: 0;
  padding: 20px;
}

.stylelab-card__content h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--component-title-color, var(--component-color, #302d43));
}

.stylelab-card__content p {
  margin: 0;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .stylelab-card--layout-left {
    flex-direction: column;
  }

  .stylelab-card--layout-left .stylelab-card__image {
    width: 100%;
    aspect-ratio: 16 / 9;
  }
}`;
    }

    if (componentId === "button") {
        return `
.stylelab-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: 1px solid transparent;
  border-radius: 8px;
  background-color: var(--component-background, #aa3bff);
  color: var(--component-color, #ffffff);
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}`;
    }

    return `
.stylelab-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 360px;
}

.stylelab-input-wrapper label {
  font-size: 14px;
  font-weight: 500;
}

.stylelab-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: var(--component-background, #ffffff);
  color: var(--component-color, #302d43);
  font-family: inherit;
  font-size: 15px;
  transition: all 0.25s ease;
}

.stylelab-input::placeholder {
  color: inherit;
  opacity: 1;
}`;
}

/**
 * Generates component-specific CSS for real interaction states.
 */
function generateDefaultStateCss(componentId, designEffect = "none") {
    const selector = `.stylelab-${componentId}`;
    const effectSelector = `${selector}--effect-${designEffect}`;
    const hasSpecialEffect = ["glassmorphism", "neumorphism"].includes(
        designEffect,
    );

    const hoverStyles = {
        card: `
  transform: translateY(-3px);
  filter: drop-shadow(0 10px 12px rgba(31, 38, 135, 0.2));`,
        button: `
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);`,
        input: `
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
  transform: translateY(-1px);`,
    };

    const disabledStyles = {
        card: `
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.35);
  transform: none;`,
        button: `
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;`,
        input: `
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--code-bg);`,
    };

    const errorStyles = {
        card: `
  border-color: #dc2626;
  outline: 1px solid rgba(220, 38, 38, 0.25);
  outline-offset: 1px;`,
        button: `
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.12);`,
        input: `
  border: 2px solid #ef4444;
  outline: 2px solid rgba(239, 68, 68, 0.24);
  outline-offset: 2px;
  box-shadow:
    0 0 0 4px rgba(239, 68, 68, 0.14),
    0 0 16px rgba(239, 68, 68, 0.22);`,
    };

    const effectHoverStyles = {
        button: "filter: brightness(1.06);",
        input: "filter: brightness(1.04);",
    };

    const specialEffectRules = [];

    if (hasSpecialEffect && effectHoverStyles[componentId]) {
        specialEffectRules.push(`
${effectSelector}:hover {
  ${effectHoverStyles[componentId]}
}`);
    }

    if (hasSpecialEffect && ["button", "input"].includes(componentId)) {
        specialEffectRules.push(`
${effectSelector}:disabled {
  opacity: 0.45;
  filter: grayscale(0.35);
  transform: none;
}`);
    }

    if (hasSpecialEffect && componentId === "input") {
        specialEffectRules.push(`
${effectSelector}[aria-invalid="true"] {
  outline: 2px solid rgba(239, 68, 68, 0.32);
  outline-offset: 2px;
  box-shadow:
    0 0 0 4px rgba(239, 68, 68, 0.18),
    0 0 18px rgba(239, 68, 68, 0.26);
}`);
    }

    return `
${selector}:hover {
  ${hoverStyles[componentId]}
}

${selector}:focus-visible {
  outline: 3px solid #aa3bff;
  outline-offset: 3px;
}

${selector}:disabled,
${selector}[aria-disabled="true"] {
  ${disabledStyles[componentId]}
}

${selector}[aria-invalid="true"] {
  ${errorStyles[componentId]}
}

${specialEffectRules.join("\n\n")}`;
}

/**
 * Generates the selected design effect.
 */
function generateDesignEffectCss(componentId, designEffect) {
    if (designEffect === "none") {
        return "";
    }

    const selector = `.stylelab-${componentId}--effect-${designEffect}`;

    if (designEffect === "glassmorphism") {
        return `
${selector} {
  background-color: color-mix(
    in srgb,
    var(--component-background, #ffffff) 42%,
    transparent
  );
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.65),
    rgba(255, 255, 255, 0.12) 45%,
    rgba(255, 255, 255, 0.3)
  );
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 12px 30px rgba(31, 38, 135, 0.2),
    inset 0 2px 3px rgba(255, 255, 255, 0.75),
    inset 0 -2px 5px rgba(255, 255, 255, 0.15);
}`;
    }

    const shadow =
        componentId === "input"
            ? `
  box-shadow:
    inset 5px 5px 10px rgba(91, 96, 125, 0.18),
    inset -5px -5px 10px rgba(255, 255, 255, 0.95),
    0 2px 5px rgba(91, 96, 125, 0.08);`
            : `
  box-shadow:
    10px 10px 22px rgba(91, 96, 125, 0.22),
    -10px -10px 22px rgba(255, 255, 255, 0.9),
    inset 2px 2px 4px rgba(255, 255, 255, 0.65),
    inset -2px -2px 4px rgba(70, 65, 100, 0.12);`;

    return `
${selector} {
  background-color: color-mix(
    in srgb,
    var(--component-background, #ffffff) 18%,
    #eef0f7 82%
  );
  background-image: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.8),
    rgba(205, 210, 228, 0.22)
  );
  color: color-mix(
    in srgb,
    var(--component-color, #302d43) 25%,
    #302d43 75%
  );
  border: 1px solid rgba(255, 255, 255, 0.8);
  ${shadow}
}`;
}

/**
 * Generates a complete standalone CSS file.
 */
export function generateCss(options) {
    const config = normalizeGeneratorOptions({
        ...options,
        format: "css",
    });

    const { componentId, styles, designEffect } = config;

    const sections = [
        `/* Generated by StyleLab - ${componentId} */`,
        generateBaseComponentCss(componentId),
        generateDefaultStateCss(componentId, designEffect),
        generateDesignEffectCss(componentId, designEffect),
        generateBaseStyleCss(componentId, styles.normal),
    ];

    return sections.filter(Boolean).join("\n\n").trim() + "\n";
}

/**
 * Converts a safe CSS value into a Tailwind arbitrary value.
 */
function toTailwindValue(value) {
    const sanitized = sanitizeCssValue(value);

    if (sanitized === null) {
        return null;
    }

    const hasUnsupportedCharacters = ["[", "]", '"', "'", "`", "\\"].some(
        (character) => sanitized.includes(character),
    );

    if (hasUnsupportedCharacters) {
        return null;
    }

    return sanitized.replace(/\s+/g, "_");
}

/**
 * Creates a Tailwind arbitrary property class.
 */
function createTailwindPropertyClass(property, value, prefix = "") {
    const normalizedValue = toTailwindValue(value);

    if (normalizedValue === null) {
        return null;
    }

    return `${prefix}[${property}:${normalizedValue}]`;
}

/**
 * Creates Tailwind classes for component style properties.
 */
function createTailwindStyles(
    componentId,
    styles = {},
    variant = "",
    target = "root",
) {
    const propertyMap = {
        backgroundColor: "--component-background",
        color: "--component-color",
        titleColor: "--component-title-color",
        borderRadius: "border-radius",
        padding: "padding",
    };

    return Object.entries(propertyMap)
        .filter(([property]) => {
            return (
                componentId !== "card" ||
                (property === "padding" ? target === "content" : target === "root")
            );
        })
        .map(([styleProperty, cssProperty]) => {
            return createTailwindPropertyClass(
                cssProperty,
                styles[styleProperty],
                variant,
            );
        })
        .filter(Boolean);
}


/**
 * Returns design effect utility classes.
 */
function getTailwindEffectClasses(componentId, designEffect) {
    if (designEffect === "none") {
        return [];
    }

    if (designEffect === "glassmorphism") {
        return [
            "backdrop-blur-xl",
            "backdrop-saturate-150",
            "[background-color:color-mix(in_srgb,var(--component-background,#ffffff)_42%,transparent)]",
            "[background-image:linear-gradient(135deg,rgba(255,255,255,0.65),rgba(255,255,255,0.12)_45%,rgba(255,255,255,0.3))]",
            "border",
            "border-white/80",
            "[box-shadow:0_12px_30px_rgba(31,38,135,0.2),inset_0_2px_3px_rgba(255,255,255,0.75)]",
        ];
    }

    const shadow =
        componentId === "input"
            ? "[box-shadow:inset_5px_5px_10px_rgba(91,96,125,0.18),inset_-5px_-5px_10px_rgba(255,255,255,0.95),0_2px_5px_rgba(91,96,125,0.08)]"
            : "[box-shadow:10px_10px_22px_rgba(91,96,125,0.22),-10px_-10px_22px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.65),inset_-2px_-2px_4px_rgba(70,65,100,0.12)]";

    return [
        "[background-color:color-mix(in_srgb,var(--component-background,#ffffff)_18%,#eef0f7_82%)]",
        "[background-image:linear-gradient(145deg,rgba(255,255,255,0.8),rgba(205,210,228,0.22))]",
        "[color:color-mix(in_srgb,var(--component-color,#302d43)_25%,#302d43_75%)]",
        "border",
        "border-white/80",
        shadow,
    ];
}

/**
 * Generates Tailwind classes for component-specific interactions.
 */
function getTailwindBehaviorClasses(componentId, designEffect) {
    const hasSpecialEffect = ["glassmorphism", "neumorphism"].includes(
        designEffect,
    );

    const hoverClasses = {
        card: [
            "hover:-translate-y-[3px]",
            "hover:drop-shadow-[0_10px_12px_rgba(31,38,135,0.2)]",
        ],
        button: [
            "hover:-translate-y-0.5",
            "hover:[box-shadow:0_4px_12px_rgba(0,0,0,0.18)]",
        ],
        input: [
            "hover:[box-shadow:0_4px_12px_rgba(0,0,0,0.16)]",
            "hover:-translate-y-px",
        ],
    };

    const disabledStyles = {
        card: [
            "aria-disabled:opacity-45",
            "aria-disabled:cursor-not-allowed",
            "aria-disabled:grayscale-[0.35]",
            "aria-disabled:transform-none",
        ],
        button: [
            hasSpecialEffect ? "disabled:opacity-45" : "disabled:opacity-50",
            "disabled:cursor-not-allowed",
            "disabled:shadow-none",
            "disabled:transform-none",
            ...(hasSpecialEffect
                ? ["disabled:grayscale-[0.35]"]
                : []),
        ],
        input: [
            hasSpecialEffect ? "disabled:opacity-45" : "disabled:opacity-50",
            "disabled:cursor-not-allowed",
            "disabled:bg-[var(--code-bg)]",
            ...(hasSpecialEffect
                ? ["disabled:grayscale-[0.35]", "disabled:transform-none"]
                : []),
        ],
    };

    const errorStyles = {
        card: [
            "aria-[invalid=true]:border-[#dc2626]",
            "aria-[invalid=true]:[outline:1px_solid_rgba(220,38,38,0.25)]",
            "aria-[invalid=true]:[outline-offset:1px]",
        ],
        button: [
            "aria-[invalid=true]:border-[#dc2626]",
            "aria-[invalid=true]:[box-shadow:0_0_0_2px_rgba(220,38,38,0.12)]",
        ],
        input: [
            "aria-[invalid=true]:[border:2px_solid_#ef4444]",
            "aria-[invalid=true]:[outline:2px_solid_rgba(239,68,68,0.24)]",
            "aria-[invalid=true]:[outline-offset:2px]",
            "aria-[invalid=true]:[box-shadow:0_0_0_4px_rgba(239,68,68,0.14),0_0_16px_rgba(239,68,68,0.22)]",
        ],
    };

    const effectHoverClasses = {
        button: ["hover:brightness-[1.06]"],
        input: ["hover:brightness-[1.04]"],
    };

    const effectErrorClasses = {
        input: [
            "aria-[invalid=true]:[outline:2px_solid_rgba(239,68,68,0.32)]",
            "aria-[invalid=true]:[box-shadow:0_0_0_4px_rgba(239,68,68,0.18),0_0_18px_rgba(239,68,68,0.26)]",
        ],
    };

    return [
        ...hoverClasses[componentId],
        "focus-visible:[outline:3px_solid_#aa3bff]",
        "focus-visible:outline-offset-[3px]",
        ...disabledStyles[componentId],
        ...errorStyles[componentId],
        ...(hasSpecialEffect
            ? effectHoverClasses[componentId] ?? []
            : []),
        ...(hasSpecialEffect
            ? effectErrorClasses[componentId] ?? []
            : []),
    ];
}

/**
 * Generates a complete React component using Tailwind CSS.
 */
export function generateTailwind(options) {
    const config = normalizeGeneratorOptions({
        ...options,
        format: "tailwind",
    });

    const {
        componentId,
        content,
        imageSrc,
        styles,
        designEffect,
        layout,
    } = config;

    const baseClasses = {
        card: [
            "group",
            "flex",
            layout === "left"
                ? "flex-row items-stretch max-[600px]:flex-col"
                : "flex-col",
            "w-full",
            "max-w-[420px]",
            "box-border",
            "overflow-hidden",
            ...(styles.normal.borderRadius ? [] : ["rounded-2xl"]),
            "border",
            "border-[#e2e8f0]",
            "bg-[var(--component-background,#ffffff)]",
            "text-[var(--component-color,#302d43)]",
            "shadow-[0_4px_14px_rgba(15,23,42,0.08)]",
            "transition-all",
        ],
        button: [
            "inline-flex",
            "items-center",
            "justify-center",
            ...(styles.normal.padding ? [] : ["px-5", "py-3"]),
            "border",
            "border-transparent",
            ...(styles.normal.borderRadius ? [] : ["rounded-lg"]),
            "bg-[var(--component-background,#aa3bff)]",
            "text-[var(--component-color,#ffffff)]",
            "font-semibold",
            "text-base",
            "cursor-pointer",
            "transition-all",
        ],
        input: [
            "w-full",
            "box-border",
            ...(styles.normal.padding ? [] : ["px-3.5", "py-3"]),
            "border",
            "border-[#e2e8f0]",
            ...(styles.normal.borderRadius ? [] : ["rounded-lg"]),
            "bg-[var(--component-background,#ffffff)]",
            "text-[var(--component-color,#08060d)]",
            "text-[15px]",
            "transition-all",
        ],
    };

    const rootClasses = [
        ...baseClasses[componentId],
        ...createTailwindStyles(componentId, styles.normal, "", "root"),
        ...getTailwindEffectClasses(componentId, designEffect),
        ...getTailwindBehaviorClasses(componentId, designEffect),
    ].join(" ");

    if (componentId === "card") {
        const contentClasses = [
            "flex-1",
            "min-w-0",
            ...(styles.normal.padding ? [] : ["p-5"]),
            ...createTailwindStyles(componentId, styles.normal, "", "content"),
        ].join(" ");

        const imageMarkup = imageSrc
            ? `<img className="${layout === "left" ? "w-2/5 aspect-square" : "w-full aspect-video"} object-cover shrink-0" src=${escapeJsxString(imageSrc)} alt=${escapeJsxString(content.title || "Card image")} />`
            : `<div className="grid place-items-center ${layout === "left" ? "w-2/5 aspect-square" : "w-full aspect-video"} bg-gradient-to-br from-indigo-200 via-cyan-100 to-emerald-100">Image preview</div>`;

        return `export default function GeneratedCard() {
  return (
    <article
      className=${escapeJsxString(rootClasses)}
      tabIndex={0}
      >
      ${imageMarkup}
      <div className=${escapeJsxString(contentClasses)}>
        <h3
            className="mb-2 text-xl"
            style={{ color: "var(--component-title-color, var(--component-color, #302d43))" }}
        >
            ${`{${escapeJsxString(content.title)}}`}
        </h3>
        <p className="leading-relaxed">${`{${escapeJsxString(content.description)}}`}</p>
      </div>
    </article>
  );
}`;
    }

    if (componentId === "button") {
        return `export default function GeneratedButton() {
  return (
    <button
      type="button"
      className=${escapeJsxString(rootClasses)}
    >
      {${escapeJsxString(content.label)}}
    </button>
  );
}`;
    }

    return `export default function GeneratedInput() {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[360px]">
      <label className="text-sm font-medium" htmlFor="stylelab-generated-input">
        {${escapeJsxString(content.label)}}
      </label>
      <input
        id="stylelab-generated-input"
        type="text"
        className=${escapeJsxString(rootClasses)}
        placeholder=${escapeJsxString(content.placeholder)}
      />
    </div>
  );
}`;
}
