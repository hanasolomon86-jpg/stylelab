import { Routes, Route } from "react-router";
import Home from "./pages/Home.jsx";
import Studio from "./pages/Studio.jsx";
import NotFound from "./pages/NotFound.jsx";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/studio" element={<Studio />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
