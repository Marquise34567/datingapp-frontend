import React from "react";
import { createRoot } from "react-dom/client";
import Maintenance from "./components/Maintenance";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Maintenance />
  </React.StrictMode>
);
