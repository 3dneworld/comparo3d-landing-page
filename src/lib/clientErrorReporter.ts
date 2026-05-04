const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.3dneworld.com";

const REPORT_COOLDOWN_MS = 5 * 60 * 1000;
const reportedAt = new Map<string, number>();
let installed = false;

export interface ClientErrorReport {
  event_type: string;
  message: string;
  severity?: "warning" | "critical";
  source_url?: string;
  line?: number;
  column?: number;
  stack?: string;
  status?: number;
  error_type?: string;
  context?: Record<string, unknown>;
}

export function shouldIgnoreClientErrorSource(source?: string): boolean {
  if (!source) return false;
  return (
    source.startsWith("chrome-extension://") ||
    source.startsWith("moz-extension://") ||
    source.startsWith("safari-extension://") ||
    source.startsWith("edge-extension://")
  );
}

function signature(report: ClientErrorReport): string {
  return [
    report.event_type,
    report.message.slice(0, 180),
    report.source_url || "",
    report.status || "",
  ].join("|");
}

function shouldSend(report: ClientErrorReport): boolean {
  if (shouldIgnoreClientErrorSource(report.source_url)) return false;
  const key = signature(report);
  const now = Date.now();
  const last = reportedAt.get(key) || 0;
  if (last && now - last < REPORT_COOLDOWN_MS) return false;
  reportedAt.set(key, now);
  return true;
}

export async function reportClientError(report: ClientErrorReport): Promise<void> {
  if (!shouldSend(report)) return;
  try {
    await fetch(`${API_BASE_URL}/api/client-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        severity: "critical",
        page_url: window.location.href,
        user_agent: window.navigator.userAgent,
        ...report,
      }),
    });
  } catch {
    // Reporting must never break the customer flow.
  }
}

function errorMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return "Unhandled client error";
  }
}

export function installClientErrorReporting(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const source = event.filename || "";
    if (shouldIgnoreClientErrorSource(source)) return;
    void reportClientError({
      event_type: "window_error",
      message: event.message || "Window error",
      source_url: source,
      line: event.lineno,
      column: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined,
      error_type: event.error?.name || "Error",
      context: { flow: "global" },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const source = reason instanceof Error ? reason.stack || "" : "";
    if (shouldIgnoreClientErrorSource(source)) return;
    void reportClientError({
      event_type: "unhandled_rejection",
      message: errorMessage(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      error_type: reason instanceof Error ? reason.name : "UnhandledRejection",
      context: { flow: "global" },
    });
  });
}
