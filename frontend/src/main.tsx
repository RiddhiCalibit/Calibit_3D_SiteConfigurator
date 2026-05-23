import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import SharedProject from "./components/SharedProject.tsx";

const fullUrl = window.location.href;
const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      {path.startsWith("/shared/") || fullUrl.includes("/shared/") ? (
        <SharedProject />
      ) : (
        <App />
      )}
    </ThemeProvider>
  </React.StrictMode>,
);
