import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installClientErrorReporting } from "./lib/clientErrorReporter.ts";
import { initWebVitals } from "./lib/webVitals.ts";
import "./index.css";
// NOTA: provider-dashboard-dark.css se importa dentro de ProviderDashboardShell
// (chunk lazy del dashboard) para no cargar CSS no usado en la home / LCP mobile.

installClientErrorReporting();

createRoot(document.getElementById("root")!).render(<App />);

// RUM de Core Web Vitals (field data real, la métrica que Google usa para ranking).
// Se registra después del render; los observers usan entradas bufferizadas, así que
// igual capturan LCP/FCP/TTFB previos. No bloquea nada.
initWebVitals();
