import { Link } from "react-router";

function Home() {
  return (
    <main className="page home-page">
      <header className="site-header">
        <Link to="/" className="brand">
          StyleLab
        </Link>

        <nav aria-label="Main navigation">
          <Link to="/studio" className="nav-link">
            Studio
          </Link>
        </nav>
      </header>

      <section className="home-hero">
        <p className="eyebrow">VISUAL UI COMPONENT DESIGNER</p>

        <h1>Design. Preview. Generate.</h1>

        <p className="hero-description">
          Create and customize reusable UI components, preview their appearance,
          and generate code for your project.
        </p>

        <Link to="/studio" className="primary-button">
          Start Creating
        </Link>
      </section>

      <section className="home-features" aria-labelledby="features-heading">
        <h2 id="features-heading">What you can create</h2>

        <div className="features-grid">
          <article>
            <h3>Design Components</h3>
            <p>Customize Card, Button and Input components.</p>
          </article>

          <article>
            <h3>Explore Effects</h3>
            <p>Experiment with Glassmorphism and Neumorphism.</p>
          </article>

          <article>
            <h3>Generate Code</h3>
            <p>Export your designs as JSX, CSS or Tailwind CSS.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Home;
