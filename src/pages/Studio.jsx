import { Link } from "react-router";

import { useState } from "react";
import {
  Code2,
  Eye,
  FileText,
  Moon,
  PanelTop,
  Palette,
  Sun,
  WandSparkles,
} from "lucide-react";
import "./Studio.css";
import { useWorkspace } from "../hooks/useWorkspace";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import CodeGenerator from "../components/CodeGenerator";
import ImageGallery from "../components/ImageGallery";
import IMAGE_GALLERY from "../data/imageGallery";
import {
  COMPONENT_IDS,
  STYLE_STATES,
  DESIGN_EFFECTS,
} from "../reducers/workspaceReducer";

const COMPONENT_CONTENT_FIELDS = {
  card: [
    { field: "title", label: "Card title" },
    { field: "description", label: "Card description" },
  ],
  button: [{ field: "label", label: "Button label" }],
  input: [
    { field: "label", label: "Input label" },
    { field: "placeholder", label: "Placeholder" },
  ],
};

const STYLE_FIELDS = [
  {
    property: "backgroundColor",
    label: "Background color",
    type: "color",
  },
  {
    property: "color",
    label: "Text color",
    type: "color",
  },
  {
    property: "titleColor",
    label: "Title color",
    type: "color",
    components: ["card"],
  },
  {
    property: "borderRadius",
    label: "Border radius",
    type: "number",
    unit: "px",
    min: 0,
    max: 48,
    step: 1,
    defaultValue: 16,
  },
  {
    property: "padding",
    label: "Padding",
    type: "number",
    unit: "px",
    min: 0,
    max: 48,
    step: 1,
    defaultValue: 20,
  },
];

const CONTROL_SECTIONS = [
  { id: "content", label: "Content", Icon: FileText },
  { id: "layout", label: "Layout", Icon: PanelTop },
  { id: "style", label: "Style", Icon: Palette },
  { id: "effects", label: "Effects", Icon: WandSparkles },
];

function getDefaultColor(componentId, property) {
  const defaults = {
    card: {
      backgroundColor: {
        value: "#ffffff",
      },
      color: {
        value: "#6b6375",
      },
      titleColor: {
        value: "#302d43",
      },
    },
    button: {
      backgroundColor: {
        variable: "--accent",
        fallback: "#aa3bff",
      },
      color: {
        value: "#ffffff",
      },
    },
    input: {
      backgroundColor: {
        variable: "--bg",
        fallback: "#ffffff",
      },
      color: {
        variable: "--text-h",
        fallback: "#08060d",
      },
    },
  };

  const config = defaults[componentId]?.[property];

  if (!config) {
    return "#ffffff";
  }

  if (config.value) {
    return config.value;
  }

  const cssValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(config.variable)
    .trim();

  return /^#[0-9a-f]{6}$/i.test(cssValue) ? cssValue : config.fallback;
}

function getNumericStyleValue(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)px$/i);

  return match ? match[1] : "";
}

function ComponentPreview({
  componentId,
  content,
  styles,
  styleState,
  layout,
  designEffect,
}) {
  if (componentId === "card") {
    const selectedImage = IMAGE_GALLERY.find(
      (image) => image.id === content.imageId,
    );
    return (
      <Card
        imageId={selectedImage?.src}
        title={content.title}
        description={content.description}
        layout={layout}
        styles={styles}
        styleState={styleState}
        designEffect={designEffect}
        showImagePlaceholder
      />
    );
  }

  if (componentId === "button") {
    return (
      <Button
        label={content.label}
        styles={styles}
        styleState={styleState}
        designEffect={designEffect}
      />
    );
  }

  if (componentId === "input") {
    return (
      <Input
        label={content.label}
        placeholder={content.placeholder}
        styles={styles}
        styleState={styleState}
        designEffect={designEffect}
      />
    );
  }
}

function Studio() {
  const {
    workspace,
    selectedComponent,
    activeStyleState,
    selectComponent,
    selectStyleState,
    updateComponentContent,
    updateComponentLayout,
    updateComponentStyle,
    updateComponentDesignEffect,
  } = useWorkspace();

  const [activeControlSection, setActiveControlSection] = useState("style");
  const [previewTheme, setPreviewTheme] = useState("dark");

  const selectedComponentData = workspace.components[selectedComponent];

  const normalStyles = selectedComponentData.styles.normal ?? {};

  const visibleControlSections =
    selectedComponent === "card"
      ? CONTROL_SECTIONS
      : CONTROL_SECTIONS.filter((section) => section.id !== "layout");

  const activeSection = visibleControlSections.some(
    (section) => section.id === activeControlSection,
  )
    ? activeControlSection
    : "style";

  const currentStyles = normalStyles;

  const previewStyles =
    selectedComponent === "card"
      ? {
          color: getDefaultColor("card", "color"),
          titleColor: getDefaultColor("card", "titleColor"),
          ...currentStyles,
        }
      : currentStyles;

  const componentLabel =
    selectedComponent.charAt(0).toUpperCase() + selectedComponent.slice(1);

  const previewRadius =
    currentStyles.borderRadius ??
    (selectedComponent === "card" ? "16px" : "8px");

  const defaultPadding = {
    card: "20px",
    button: "12px 20px",
    input: "12px 14px",
  };

  const previewPadding =
    currentStyles.padding ?? defaultPadding[selectedComponent];

  const previewLayoutLabel =
    selectedComponent === "card"
      ? selectedComponentData.layout === "left"
        ? "Image on left"
        : "Image on top"
      : null;

  return (
    <main className="page studio-page">
      <header className="site-header studio-topbar">
        <div className="studio-topbar__identity">
          <Link to="/" className="brand">
            StyleLab
          </Link>

          <span className="studio-topbar__divider" aria-hidden="true" />

          <div className="studio-topbar__context">
            <p className="studio-topbar__eyebrow">YOUR WORKSPACE</p>
            <h1>Studio</h1>
            <p className="studio-topbar__description">
              Customize your components and preview your changes.
            </p>
          </div>
        </div>

        <nav aria-label="Studio navigation">
          <Link to="/" className="nav-link">
            Home
          </Link>
        </nav>
      </header>

      <section className="studio-panels" aria-label="Studio workspace">
        <article className="studio-panel controls-panel">
          <h2>Controls</h2>

          <div className="control-top-settings">
            <div>
              <label htmlFor="component-select">Component</label>

              <select
                id="component-select"
                value={selectedComponent}
                onChange={(event) => {
                  const nextComponent = event.target.value;
                  selectComponent(nextComponent);

                  if (
                    nextComponent !== "card" &&
                    activeControlSection === "layout"
                  ) {
                    setActiveControlSection("style");
                  }
                }}
              >
                {COMPONENT_IDS.map((componentId) => (
                  <option key={componentId} value={componentId}>
                    {componentId.charAt(0).toUpperCase() + componentId.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="style-state-select">Style state</label>

              <select
                id="style-state-select"
                value={activeStyleState}
                onChange={(event) => selectStyleState(event.target.value)}
              >
                {STYLE_STATES.map((styleState) => (
                  <option key={styleState} value={styleState}>
                    {styleState.charAt(0).toUpperCase() + styleState.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`control-category-toolbar control-category-toolbar--${visibleControlSections.length}`}
            role="group"
            aria-label="Control categories"
          >
            {visibleControlSections.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className="control-tool"
                aria-pressed={activeSection === id}
                onClick={() => setActiveControlSection(id)}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="control-category-content">
            {activeSection === "content" && (
              <section aria-labelledby="content-controls-heading">
                <h3 id="content-controls-heading">Content</h3>

                {COMPONENT_CONTENT_FIELDS[selectedComponent].map(
                  ({ field, label }) => (
                    <label key={field} htmlFor={`content-${field}`}>
                      {label}

                      <input
                        id={`content-${field}`}
                        type="text"
                        value={selectedComponentData.content[field]}
                        onChange={(event) =>
                          updateComponentContent(
                            selectedComponent,
                            field,
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  ),
                )}

                {selectedComponent === "card" && (
                  <ImageGallery
                    images={IMAGE_GALLERY}
                    selectedImageId={selectedComponentData.content.imageId}
                    onSelect={(imageId) =>
                      updateComponentContent("card", "imageId", imageId)
                    }
                  />
                )}
              </section>
            )}

            {activeSection === "layout" && selectedComponent === "card" && (
              <section aria-labelledby="layout-controls-heading">
                <h3 id="layout-controls-heading">Layout</h3>

                <label htmlFor="card-layout-select">Image layout</label>

                <select
                  id="card-layout-select"
                  value={selectedComponentData.layout ?? "top"}
                  onChange={(event) =>
                    updateComponentLayout("card", event.target.value)
                  }
                >
                  <option value="top">Image on top</option>
                  <option value="left">Image on left</option>
                </select>
              </section>
            )}

            {activeSection === "style" && (
              <section aria-labelledby="style-controls-heading">
                <h3 id="style-controls-heading">Style</h3>

                {STYLE_FIELDS.filter(
                  ({ components }) =>
                    !components || components.includes(selectedComponent),
                ).map(
                  ({
                    property,
                    label,
                    placeholder,
                    type,
                    unit,
                    min,
                    max,
                    step,
                    defaultValue,
                  }) => {
                    const defaultColor =
                      type === "color"
                        ? getDefaultColor(selectedComponent, property)
                        : "";

                    const controlValue =
                      type === "color"
                        ? (currentStyles[property] ?? defaultColor)
                        : type === "number"
                          ? getNumericStyleValue(currentStyles[property]) ||
                            String(defaultValue)
                          : (currentStyles[property] ?? "");

                    const numericValue = Number(controlValue);

                    return (
                      <div className="style-control" key={property}>
                        {type === "number" ? (
                          <div className="style-range-control">
                            <div className="style-range-header">
                              <label htmlFor={`style-${property}`}>
                                {label}
                              </label>

                              <output
                                className="style-range-value"
                                htmlFor={`style-${property}`}
                              >
                                {numericValue}
                                {unit}
                              </output>
                            </div>

                            <input
                              id={`style-${property}`}
                              type="range"
                              min={min}
                              max={max}
                              step={step}
                              value={numericValue}
                              aria-valuetext={`${numericValue} pixels`}
                              onChange={(event) =>
                                updateComponentStyle(
                                  selectedComponent,
                                  "normal",
                                  property,
                                  `${Number(event.target.value)}px`,
                                )
                              }
                            />
                          </div>
                        ) : type === "color" ? (
                          <>
                            <label htmlFor={`style-${property}`}>{label}</label>

                            <div className="style-color-field">
                              <output
                                className="style-color-value"
                                aria-live="polite"
                              >
                                {controlValue.toUpperCase()}
                              </output>

                              <input
                                id={`style-${property}`}
                                type="color"
                                value={controlValue}
                                aria-label={label}
                                onChange={(event) =>
                                  updateComponentStyle(
                                    selectedComponent,
                                    "normal",
                                    property,
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <label htmlFor={`style-${property}`}>{label}</label>

                            <input
                              id={`style-${property}`}
                              type={type ?? "text"}
                              placeholder={placeholder}
                              value={controlValue}
                              onChange={(event) =>
                                updateComponentStyle(
                                  selectedComponent,
                                  "normal",
                                  property,
                                  event.target.value,
                                )
                              }
                            />
                          </>
                        )}
                      </div>
                    );
                  },
                )}
              </section>
            )}

            {activeSection === "effects" && (
              <section aria-labelledby="effects-controls-heading">
                <h3 id="effects-controls-heading">Design Effects</h3>

                <label htmlFor="design-effect-select">
                  Select design effect
                </label>

                <select
                  id="design-effect-select"
                  value={selectedComponentData.designEffect ?? "none"}
                  onChange={(event) =>
                    updateComponentDesignEffect(
                      selectedComponent,
                      event.target.value,
                    )
                  }
                >
                  {DESIGN_EFFECTS.map((designEffect) => (
                    <option key={designEffect} value={designEffect}>
                      {designEffect.charAt(0).toUpperCase() +
                        designEffect.slice(1)}
                    </option>
                  ))}
                </select>
              </section>
            )}
          </div>
        </article>

        <article className="studio-panel preview-panel">
          <div className="preview-panel__header">
            <div className="preview-panel__title">
              <Eye size={17} strokeWidth={1.8} aria-hidden="true" />

              <h2>Live Preview</h2>

              <span className="preview-state-badge">
                {activeStyleState.charAt(0).toUpperCase() +
                  activeStyleState.slice(1)}
              </span>
            </div>

            <div
              className="preview-theme-switch"
              role="group"
              aria-label="Preview background"
            >
              <button
                type="button"
                aria-pressed={previewTheme === "dark"}
                className={previewTheme === "dark" ? "active" : ""}
                onClick={() => setPreviewTheme("dark")}
              >
                <Moon size={14} aria-hidden="true" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                aria-pressed={previewTheme === "light"}
                className={previewTheme === "light" ? "active" : ""}
                onClick={() => setPreviewTheme("light")}
              >
                <Sun size={14} aria-hidden="true" />
                <span>Light</span>
              </button>
            </div>
          </div>

          <div className={`preview-canvas preview-canvas--${previewTheme}`}>
            <div
              className={`preview-stage preview-stage--${selectedComponentData.designEffect ?? "none"} preview-stage--canvas-${previewTheme}`}
            >
              <div className="preview-stage__ambient-glow" aria-hidden="true" />

              <ComponentPreview
                componentId={selectedComponent}
                content={selectedComponentData.content}
                styles={previewStyles}
                styleState={activeStyleState}
                layout={selectedComponentData.layout ?? "top"}
                designEffect={selectedComponentData.designEffect ?? "none"}
              />

              <div className="preview-stage__statusbar">
                <span>
                  {componentLabel}
                  {previewLayoutLabel && ` • ${previewLayoutLabel}`}
                </span>

                <span>
                  {previewRadius} radius • {previewPadding} padding
                </span>
              </div>
            </div>
          </div>
        </article>

        <article className="studio-panel code-panel">
          <h2 className="code-panel__title">
            <Code2 size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Code Generator</span>
          </h2>

          <CodeGenerator
            componentId={selectedComponent}
            componentData={selectedComponentData}
          />
        </article>
      </section>
    </main>
  );
}

export default Studio;
