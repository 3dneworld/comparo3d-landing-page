/**
 * Cloudflare Worker — comparo3d.com.ar
 * Proxies /onboarding*, /proveedores*, and /api/* to the Flask backend
 * via api.3dneworld.com. Everything else falls through to static assets (SPA).
 */

const BACKEND = "https://api.3dneworld.com";

const PROXY_PREFIXES = ["/onboarding", "/proveedores", "/client-dashboard", "/admin", "/api/"];

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    const shouldProxy = PROXY_PREFIXES.some((p) => url.pathname.startsWith(p));

    if (shouldProxy) {
      const backendUrl = new URL(url.pathname + url.search, BACKEND);

      // Build new headers, override Host for the backend
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set("Host", "api.3dneworld.com");

      const proxyRequest = new Request(backendUrl.toString(), {
        method: request.method,
        headers: proxyHeaders,
        body: request.body,
        redirect: "manual",
      });
      const backendResponse = await fetch(proxyRequest);

      // Debug: log callback responses to see Set-Cookie
      const isCallback = url.pathname === "/api/auth/callback";

      // Rebuild response with all headers explicitly copied
      const responseHeaders = new Headers();
      for (const [key, value] of backendResponse.headers.entries()) {
        responseHeaders.append(key, value);
      }

      // For auth callback, log what we got from backend
      if (isCallback) {
        const debugHeaders: Record<string, string> = {};
        for (const [key, value] of backendResponse.headers.entries()) {
          debugHeaders[key] = value;
        }
        console.log("CALLBACK DEBUG status=" + backendResponse.status);
        console.log("CALLBACK DEBUG headers=" + JSON.stringify(debugHeaders));
      }

      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders,
      });
    }

    // Fall through to static assets (handled by wrangler assets binding)
    return env.ASSETS.fetch(request);
  },
};
