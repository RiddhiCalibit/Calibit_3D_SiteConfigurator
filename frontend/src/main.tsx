import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import SharedProject from "./components/SharedProject.tsx";

// Check original URL before any rewriting
//const isSharedRoute = window.location.href.includes("/shared/");
const originalPath =
  sessionStorage.getItem("originalPath") || window.location.pathname;
const isSharedRoute =
  originalPath.includes("/shared/") ||
  window.location.href.includes("/shared/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>{isSharedRoute ? <SharedProject /> : <App />}</ThemeProvider>
  </React.StrictMode>,
);
