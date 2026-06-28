import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installClientErrorReporting } from "./lib/clientErrorReporter.ts";
import "./index.css";
// NOTA: provider-dashboard-dark.css se importa dentro de ProviderDashboardShell
// (chunk lazy del dashboard) para no cargar CSS no usado en la home / LCP mobile.

installClientErrorReporting();

createRoot(document.getElementById("root")!).render(<App />);
