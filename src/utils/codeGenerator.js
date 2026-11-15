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
export function resolveStylesByState(styles = {}) {
    const normalStyles = { ...(styles.normal ?? {}) };

    return Object.fromEntries(
        STYLE_STATES.map((styleState) => {
            if (styleState === "normal") {
                return [styleState, { ...normalStyles }];
            }

            return [
                styleState,
                {
                    ...normalStyles,
                    ...(styles[styleState] ?? {}),
                },
            ];
        }),
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

    const selectedImage = IMAGE_GALLERY.find(
        (image) => image.id === imageId,
    );

    return selectedImage?.src ?? null;
}

/**
 * Validates and normalizes the data received by the generator.
 */
export function normalizeGeneratorOptions(options = {}) {
    const {
        componentId,
        componentData,
        activeStyleState = "normal",
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
        activeStyleState: STYLE_STATES.includes(activeStyleState)
            ? activeStyleState
            : "normal",
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
    const {
        componentId,
        designEffect,
        activeStyleState,
        layout,
    } = options;

    const classes = [
        `stylelab-${componentId}`,
        `stylelab-${componentId}--effect-${designEffect}`,
        `stylelab-preview-state--${activeStyleState}`,
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

    const {
        componentId,
        content,
        activeStyleState,
        imageSrc,
    } = config;

    const className = getGeneratedClassName(config);
    const cssImport = `import "./${componentId}.css";`;

    const isDisabled = activeStyleState === "disabled";
    const isError = activeStyleState === "error";

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
      ${isDisabled ? 'aria-disabled="true"' : ""}
      ${isError ? 'aria-invalid="true"' : ""}
    >
      ${imageMarkup}
      <div className="stylelab-card__content">
        <h3>{${escapeJsxString(content.title)}}</h3>
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
      ${isDisabled ? "disabled" : ""}
      ${isError ? 'aria-invalid="true"' : ""}
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
        ${isDisabled ? "disabled" : ""}
        ${isError ? 'aria-invalid="true"' : ""}
      />
    </div>
  );
}`;
}


const CSS_PROPERTY_MAP = {
    backgroundColor: "--component-background",
    color: "--component-color",
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

    if (
        !normalizedValue ||
        /[;{}\r\n]/.test(normalizedValue)
    ) {
        return null;
    }

    return normalizedValue;
}

/**
 * Returns real interaction selectors and preview selectors
 * for a specific style state.
 */
function getCssStateSelectors(componentId, styleState) {
    const selector = `.stylelab-${componentId}`;

    switch (styleState) {
        case "normal":
            return [selector];

        case "hover":
            return [
                `${selector}:hover`,
                `${selector}.stylelab-preview-state--hover`,
            ];

        case "focus":
            return [
                `${selector}:focus-visible`,
                `${selector}.stylelab-preview-state--focus`,
            ];

        case "disabled":
            return [
                `${selector}:disabled`,
                `${selector}[aria-disabled="true"]`,
                `${selector}.stylelab-preview-state--disabled`,
            ];

        case "error":
            return [
                `${selector}[aria-invalid="true"]`,
                `${selector}.stylelab-preview-state--error`,
            ];

        default:
            return [];
    }
}

/**
 * Converts resolved component styles into CSS declarations.
 */
function createCssDeclarations(componentId, styles = {}) {
    const declarations = [];
    const contentDeclarations = [];

    Object.entries(CSS_PROPERTY_MAP).forEach(
        ([styleProperty, cssProperty]) => {
            const value = sanitizeCssValue(styles[styleProperty]);

            if (value === null) {
                return;
            }

            if (styleProperty === "padding" && componentId === "card") {
                contentDeclarations.push(
                    `padding: ${value};`,
                );
                return;
            }

            declarations.push(`${cssProperty}: ${value};`);
        },
    );

    return {
        declarations,
        contentDeclarations,
    };
}

/**
 * Generates CSS rules for all five style states.
 * Resolved styles already include Normal inheritance.
 */
function generateStateCss(componentId, stylesByState) {
    return STYLE_STATES.map((styleState) => {
        const selectors = getCssStateSelectors(
            componentId,
            styleState,
        );

        const {
            declarations,
            contentDeclarations,
        } = createCssDeclarations(
            componentId,
            stylesByState[styleState],
        );

        const rules = [];

        if (declarations.length > 0) {
            rules.push(
                `${selectors.join(",\n")} {\n  ${declarations.join("\n  ")}\n}`,
            );
        }

        if (
            componentId === "card" &&
            contentDeclarations.length > 0
        ) {
            const contentSelectors = selectors.map(
                (selector) => `${selector} .stylelab-card__content`,
            );

            rules.push(
                `${contentSelectors.join(",\n")} {\n  ${contentDeclarations.join("\n  ")}\n}`,
            );
        }

        return rules.join("\n\n");
    }).filter(Boolean).join("\n\n");
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
 * Generates default visual styles for all five states.
 */
function generateDefaultStateCss(componentId) {
    const selector = `.stylelab-${componentId}`;

    const hoverStyles = {
        card: `
  transform: translateY(-3px);
  filter: drop-shadow(0 10px 12px rgba(31, 38, 135, 0.2));`,
        button: `
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);`,
        input: `
  border-color: #aa3bff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);`,
    };

    return `
${selector}:hover,
${selector}.stylelab-preview-state--hover {
  ${hoverStyles[componentId]}
}

${selector}:focus-visible,
${selector}.stylelab-preview-state--focus {
  outline: 3px solid #aa3bff;
  outline-offset: 3px;
}

${selector}:disabled,
${selector}[aria-disabled="true"],
${selector}.stylelab-preview-state--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.35);
  transform: none;
}

${selector}[aria-invalid="true"],
${selector}.stylelab-preview-state--error {
  border-color: #dc2626;
  outline: 1px solid rgba(220, 38, 38, 0.25);
  outline-offset: 1px;
}`;
}

/**
 * Generates the selected design effect.
 */
function generateDesignEffectCss(componentId, designEffect) {
    if (designEffect === "none") {
        return "";
    }

    const selector =
        `.stylelab-${componentId}--effect-${designEffect}`;

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

    const {
        componentId,
        styles,
        designEffect,
    } = config;

    const sections = [
        `/* Generated by StyleLab - ${componentId} */`,
        generateBaseComponentCss(componentId),
        generateDefaultStateCss(componentId),
        generateDesignEffectCss(componentId, designEffect),
        generateStateCss(componentId, styles),
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

    const hasUnsupportedCharacters = [
        "[",
        "]",
        '"',
        "'",
        "`",
        "\\",
    ].some((character) => sanitized.includes(character));

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
 * Returns the Tailwind variants for a style state.
 */
function getTailwindStateVariants(componentId, styleState, target) {
    const isCardContent = componentId === "card" && target === "content";
    const groupPrefix = isCardContent ? "group-" : "";

    const dataVariant =
        isCardContent
            ? `group-data-[style-state=${styleState}]:`
            : `data-[style-state=${styleState}]:`;

    if (styleState === "normal") {
        return [""];
    }

    let interactionVariant;

    switch (styleState) {
        case "hover":
            interactionVariant = `${groupPrefix}hover:`;
            break;

        case "focus":
            interactionVariant = `${groupPrefix}focus-visible:`;
            break;

        case "disabled":
            interactionVariant =
                componentId === "card"
                    ? `${groupPrefix}aria-disabled:`
                    : `${groupPrefix}disabled:`;
            break;

        case "error":
            interactionVariant = isCardContent
                ? "group-aria-[invalid=true]:"
                : "aria-[invalid=true]:";
            break;

        default:
            return [];
    }

    return [interactionVariant, dataVariant];
}

/**
 * Creates Tailwind classes for component style properties.
 */
function createTailwindStyles(componentId, styles = {}, variant = "", target = "root") {
    const propertyMap = {
        backgroundColor: "--component-background",
        color: "--component-color",
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
 * Generates Tailwind classes for all five style states.
 */
function generateTailwindStateStyles(componentId, stylesByState, target) {
    const classes = [];

    STYLE_STATES.forEach((styleState) => {
        const variants = getTailwindStateVariants(
            componentId,
            styleState,
            target,
        );

        variants.forEach((variant) => {
            classes.push(
                ...createTailwindStyles(
                    componentId,
                    stylesByState[styleState],
                    variant,
                    target,
                ),
            );
        });
    });

    return classes;
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

    const shadow = componentId === "input"
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
 * Generates the utility classes for the five visual states.
 */
function getTailwindBehaviorClasses(componentId) {
    const hoverClasses = {
        card: [
            "hover:-translate-y-[3px]",
            "hover:drop-shadow-[0_10px_12px_rgba(31,38,135,0.2)]",
            "data-[style-state=hover]:-translate-y-[3px]",
            "data-[style-state=hover]:drop-shadow-[0_10px_12px_rgba(31,38,135,0.2)]",
        ],
        button: [
            "hover:-translate-y-0.5",
            "hover:shadow-md",
            "data-[style-state=hover]:-translate-y-0.5",
            "data-[style-state=hover]:shadow-md",
        ],
        input: [
            "hover:border-[#aa3bff]",
            "hover:shadow-sm",
            "data-[style-state=hover]:border-[#aa3bff]",
            "data-[style-state=hover]:shadow-sm",
        ],
    };

    const disabledVariant =
        componentId === "card" ? "aria-disabled" : "disabled";

    return [
        ...hoverClasses[componentId],
        "focus-visible:[outline:3px_solid_#aa3bff]",
        "focus-visible:outline-offset-[3px]",
        "data-[style-state=focus]:[outline:3px_solid_#aa3bff]",
        "data-[style-state=focus]:outline-offset-[3px]",
        `${disabledVariant}:opacity-45`,
        `${disabledVariant}:cursor-not-allowed`,
        "data-[style-state=disabled]:opacity-45",
        "data-[style-state=disabled]:cursor-not-allowed",
        "aria-[invalid=true]:border-red-600",
        "aria-[invalid=true]:outline-1",
        "data-[style-state=error]:border-red-600",
        "data-[style-state=error]:outline-1",
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
        activeStyleState,
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
        ...createTailwindStyles(
            componentId,
            styles.normal,
            "",
            "root",
        ),
        ...getTailwindEffectClasses(componentId, designEffect),
        ...generateTailwindStateStyles(
            componentId,
            styles,
            "root",
        ),
        ...getTailwindBehaviorClasses(componentId),
    ].join(" ");

    const isDisabled = activeStyleState === "disabled";
    const isError = activeStyleState === "error";

    if (componentId === "card") {
        const contentClasses = [
            "flex-1",
            "min-w-0",
            ...(styles.normal.padding ? [] : ["p-5"]),
            ...createTailwindStyles(
                componentId,
                styles.normal,
                "",
                "content",
            ),
            ...generateTailwindStateStyles(
                componentId,
                styles,
                "content",
            ),
        ].join(" ");

        const imageMarkup = imageSrc
            ? `<img className="${layout === "left" ? "w-2/5 aspect-square" : "w-full aspect-video"} object-cover shrink-0" src=${escapeJsxString(imageSrc)} alt=${escapeJsxString(content.title || "Card image")} />`
            : `<div className="grid place-items-center ${layout === "left" ? "w-2/5 aspect-square" : "w-full aspect-video"} bg-gradient-to-br from-indigo-200 via-cyan-100 to-emerald-100">Image preview</div>`;

        return `export default function GeneratedCard() {
  return (
    <article
      className=${escapeJsxString(rootClasses)}
      data-style-state=${escapeJsxString(activeStyleState)}
      tabIndex={0}
      ${isDisabled ? 'aria-disabled="true"' : ""}
      ${isError ? 'aria-invalid="true"' : ""}
    >
      ${imageMarkup}
      <div className=${escapeJsxString(contentClasses)}>
        <h3 className="mb-2 text-xl">${`{${escapeJsxString(content.title)}}`}</h3>
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
      data-style-state=${escapeJsxString(activeStyleState)}
      ${isDisabled ? "disabled" : ""}
      ${isError ? 'aria-invalid="true"' : ""}
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
        data-style-state=${escapeJsxString(activeStyleState)}
        placeholder=${escapeJsxString(content.placeholder)}
        ${isDisabled ? "disabled" : ""}
        ${isError ? 'aria-invalid="true"' : ""}
      />
    </div>
  );
}`;
}
