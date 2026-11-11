import { Link } from "react-router";

function Studio() {
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

        <p>
          Your creative workspace is taking shape. Start designing and
          customizing your UI components here.
        </p>
      </section>

      <section className="studio-panels" aria-label="Studio workspace">
        <article className="studio-panel">
          <h2>Controls</h2>
          <p>Component customization tools will appear here.</p>
        </article>

        <article className="studio-panel">
          <h2>Live Preview</h2>
          <p>Your component preview will appear here.</p>
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
