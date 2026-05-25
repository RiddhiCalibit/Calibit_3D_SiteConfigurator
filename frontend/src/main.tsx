import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import SharedProject from "./components/SharedProject.tsx";

const urlParams = new URLSearchParams(window.location.search);

const isSharedRoute =
  window.location.pathname.includes("/shared/") || urlParams.has("shared");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>{isSharedRoute ? <SharedProject /> : <App />}</ThemeProvider>
  </React.StrictMode>,
);
