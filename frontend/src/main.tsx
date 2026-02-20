import React from "react";
import { createRoot } from "react-dom/client";
import PremiumDatingAdvicePage from "./components/PremiumDatingAdvicePage";
import MaintenanceOverlay from "./components/MaintenanceOverlay";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* If maintenance mode is enabled, render the maintenance page as the only UI */}
    {((import.meta.env.VITE_MAINTENANCE_MODE || "").toLowerCase() === "true") ? (
      <MaintenanceOverlay />
    ) : (
      <PremiumDatingAdvicePage />
    )}
  </React.StrictMode>
);
 
