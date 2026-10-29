import { Link } from "react-router-dom";
import React from "react";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link> |{" "}
      <Link to="/map">Map</Link> |{" "}
      <Link to="/dashboard">Dashboard</Link> |{" "}
      <Link to="/simulation">Simulation</Link> |{" "}
      <Link to="/about">About</Link> |{" "}
    </nav>
  );
}

export default Navbar;