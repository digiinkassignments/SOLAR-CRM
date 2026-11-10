import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./App.css";

// Auto-reload on new Vite deployment chunk cache miss
window.addEventListener("vite:preloadError", (event) => {
  console.warn("New build detected, reloading to fetch latest assets...", event);
  window.location.reload();
});

window.addEventListener("error", (e) => {
  if (
    e?.message &&
    (e.message.includes("Failed to load module script") ||
      e.message.includes("dynamically imported module"))
  ) {
    const hasReloaded = sessionStorage.getItem("chunk_reload_attempt");
    if (!hasReloaded) {
      sessionStorage.setItem("chunk_reload_attempt", "true");
      window.location.reload();
    }
  }
});

// Reset reload guard on clean execution
sessionStorage.removeItem("chunk_reload_attempt");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
