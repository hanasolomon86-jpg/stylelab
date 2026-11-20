import { Routes, Route } from "react-router";

import { useWorkspace } from "./hooks/useWorkspace";

import Home from "./pages/Home.jsx";
import Studio from "./pages/Studio.jsx";
import NotFound from "./pages/NotFound.jsx";

import "./App.css";

function App() {
  const { hasStorageError } = useWorkspace();

  return (
    <>
      {hasStorageError && (
        <div className="app-storage-error" role="alert">
          Unable to save your changes. Your browser storage may be unavailable.
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
