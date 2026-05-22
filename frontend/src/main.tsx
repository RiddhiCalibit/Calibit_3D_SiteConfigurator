// import React from "react";
// import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";
// import { ThemeProvider } from "./contexts/ThemeContext";
// import SharedProject from "./components/SharedProject";

// const path = window.location.pathname;

// createRoot(document.getElementById("root")!).render(
//   <ThemeProvider>
//     <App />
//   </ThemeProvider>,
// );

// // createRoot(document.getElementById("root")!).render(
// //   <ThemeProvider>
// //     <React.StrictMode>
// //       {path.startsWith("/shared/") ? <SharedProject /> : <App />}
// //     </React.StrictMode>
// //     ,
// //     <App />
// //   </ThemeProvider>,
// // );

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import SharedProject from "./components/SharedProject.tsx";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      {path.startsWith("/shared/") ? <SharedProject /> : <App />}
    </ThemeProvider>
  </React.StrictMode>,
);
