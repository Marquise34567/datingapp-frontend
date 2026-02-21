import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import PremiumDatingAdvicePage from "./components/PremiumDatingAdvicePage";
import Landing from "./components/Landing";
import "./index.css";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  return showLanding ? <Landing onStart={() => setShowLanding(false)} /> : <PremiumDatingAdvicePage />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
 
