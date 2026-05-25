import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import SharedProject from "./components/SharedProject.tsx";

// const fullUrl = window.location.href;
// const path = window.location.pathname;

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <ThemeProvider>
//       {path.startsWith("/shared/") || fullUrl.includes("/shared/") ? (
//         <SharedProject />
//       ) : (
//         <App />
//       )}
//     </ThemeProvider>
//   </React.StrictMode>,
// );

// Check original URL before any rewriting
const isSharedRoute = window.location.href.includes("/shared/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>{isSharedRoute ? <SharedProject /> : <App />}</ThemeProvider>
  </React.StrictMode>,
);
