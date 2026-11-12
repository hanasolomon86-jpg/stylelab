import { Link } from "react-router";

import { useWorkspace } from "../hooks/useWorkspace";
import Card from "../components/Card";
import ImageGallery from "../components/ImageGallery";
import IMAGE_GALLERY from "../data/imageGallery";
import { COMPONENT_IDS, STYLE_STATES } from "../reducers/workspaceReducer";

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
    placeholder: "#ffffff",
  },
  {
    property: "color",
    label: "Text color",
    placeholder: "#111111",
  },
  {
    property: "borderRadius",
    label: "Border radius",
    placeholder: "12px",
  },
  {
    property: "padding",
    label: "Padding",
    placeholder: "16px",
  },
];

function ComponentPreview({
  componentId,
  content,
  styles,
  styleState,
  layout,
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
        showImagePlaceholder
      />
    );
  }

  if (componentId === "button") {
    return (
      <button
        type="button"
        className="component-preview"
        aria-label="Button preview"
        style={styles}
      >
        {content.label}
      </button>
    );
  }

  return (
    <label className="component-preview">
      {content.label}
      <input
        aria-label="Input preview"
        placeholder={content.placeholder}
        style={styles}
        readOnly
      />
    </label>
  );
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
  } = useWorkspace();

  const selectedComponentData = workspace.components[selectedComponent];

  const currentStyles = selectedComponentData.styles[activeStyleState];

  return (
    <main className="page studio-page">
      <header className="site-header">
        <Link to="/" className="brand">
          StyleLab
        </Link>

        <nav aria-label="Studio navigation">
          <Link to="/" className="nav-link">
            Home
          </Link>
        </nav>
      </header>

      <section className="studio-heading">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Studio</h1>
        <p>Customize your components and preview your changes.</p>
      </section>

      <section className="studio-panels" aria-label="Studio workspace">
        <article className="studio-panel">
          <h2>Controls</h2>

          <label htmlFor="component-select">Select component</label>

          <select
            id="component-select"
            value={selectedComponent}
            onChange={(event) => selectComponent(event.target.value)}
          >
            {COMPONENT_IDS.map((componentId) => (
              <option key={componentId} value={componentId}>
                {componentId.charAt(0).toUpperCase() + componentId.slice(1)}
              </option>
            ))}
          </select>

          <label htmlFor="style-state-select">Select style state</label>

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

          <h3>Content</h3>

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
          {selectedComponent === "card" && (
            <>
              <h3>Layout</h3>

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
            </>
          )}

          <h3>Styles</h3>

          {STYLE_FIELDS.map(({ property, label, placeholder }) => (
            <label key={property} htmlFor={`style-${property}`}>
              {label}

              <input
                id={`style-${property}`}
                type="text"
                placeholder={placeholder}
                value={currentStyles[property] ?? ""}
                onChange={(event) =>
                  updateComponentStyle(
                    selectedComponent,
                    activeStyleState,
                    property,
                    event.target.value,
                  )
                }
              />
            </label>
          ))}
        </article>

        <article className="studio-panel">
          <h2>Live Preview</h2>

          <ComponentPreview
            componentId={selectedComponent}
            content={selectedComponentData.content}
            styles={currentStyles}
            styleState={activeStyleState}
            layout={selectedComponentData.layout ?? "top"}
          />
        </article>

        <article className="studio-panel">
          <h2>Code Generator</h2>
          <p>Generated JSX, CSS and Tailwind code will appear here.</p>
        </article>
      </section>
    </main>
  );
}

export default Studio;
