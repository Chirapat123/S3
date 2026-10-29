import Map from "./components/Map.jsx"
import Home from "./components/Home.jsx"
import Dashboard from "./components/Dashboard.jsx"
import Navbar from "./components/Navbar.jsx"

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Simulations from "./components/Simulation.jsx";
import About from "./components/About.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/simulation" element={<Simulations />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;