import React from "react";
import { createRoot } from "react-dom/client";
import Maintenance from "./components/Maintenance";
import PremiumDatingAdvicePage from "./components/PremiumDatingAdvicePage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PremiumDatingAdvicePage />
    <Maintenance />
  </React.StrictMode>
);
