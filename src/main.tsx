import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installClientErrorReporting } from "./lib/clientErrorReporter.ts";
import "./index.css";

installClientErrorReporting();

createRoot(document.getElementById("root")!).render(<App />);
