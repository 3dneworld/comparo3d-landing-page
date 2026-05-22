import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installClientErrorReporting } from "./lib/clientErrorReporter.ts";
import "./index.css";
import "@/features/provider-dashboard/styles/provider-dashboard-dark.css";

installClientErrorReporting();

createRoot(document.getElementById("root")!).render(<App />);
