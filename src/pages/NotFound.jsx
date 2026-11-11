import { Link } from "react-router";

function NotFound() {
  return (
    <main className="page not-found-page">
      <p className="eyebrow">404</p>

      <h1>Page Not Found</h1>

      <p>Sorry, the page you are looking for does not exist.</p>

      <Link to="/" className="primary-button">
        Back to Home
      </Link>
    </main>
  );
}

export default NotFound;
