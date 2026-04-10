/**
 * Cloudflare Worker — comparo3d.com.ar
 * Proxies /onboarding*, /proveedores*, /login*, /static/*, and /api/* to the Flask backend
 * via api.3dneworld.com. Everything else falls through to static assets (SPA).
 */

const BACKEND = "https://api.3dneworld.com";

const PROXY_PREFIXES = ["/onboarding", "/proveedores", "/client-dashboard", "/admin", "/login", "/static/", "/api/"];

const BRAND_WORDMARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="96" viewBox="0 0 360 96" fill="none">
  <rect width="96" height="96" rx="24" fill="url(#g)"/>
  <path d="M28 30h26c10.2 0 18 7.2 18 18s-7.8 18-18 18H28v-8h25c5.4 0 9-4.2 9-10s-3.6-10-9-10H28v-8z" fill="#fff"/>
  <path d="M77 28l-8.5 7.2v25.6L77 68V28z" fill="#fff" opacity=".95"/>
  <text x="122" y="58" fill="#155dfc" font-family="Montserrat,Arial,sans-serif" font-size="34" font-weight="800" letter-spacing="2">COMPARO3D</text>
  <defs>
    <linearGradient id="g" x1="8" y1="10" x2="89" y2="88" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1d4ed8"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
</svg>
`.trim();

const BRAND_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
  <rect width="96" height="96" rx="24" fill="url(#g)"/>
  <path d="M28 30h26c10.2 0 18 7.2 18 18s-7.8 18-18 18H28v-8h25c5.4 0 9-4.2 9-10s-3.6-10-9-10H28v-8z" fill="#fff"/>
  <path d="M77 28l-8.5 7.2v25.6L77 68V28z" fill="#fff" opacity=".95"/>
  <defs>
    <linearGradient id="g" x1="8" y1="10" x2="89" y2="88" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1d4ed8"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
</svg>
`.trim();

function svgResponse(svg: string, cacheControl = "public, max-age=3600") {
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

async function hasProviderSession(request: Request) {
  const authProbeUrl = new URL("/api/auth/me", BACKEND);
  const headers = new Headers(request.headers);
  headers.set("Host", "api.3dneworld.com");

  const response = await fetch(authProbeUrl.toString(), {
    method: "GET",
    headers,
    redirect: "manual",
  });

  return response.ok;
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const cookieHeader = request.headers.get("cookie") || "";
    const hasAuthCookie = /(?:^|;\s*)auth_token=/.test(cookieHeader);

    const isProviderLoginRoute =
      url.pathname === "/proveedores/login" || url.pathname === "/proveedores/login/";

    if (isProviderLoginRoute) {
      const appShellUrl = new URL("/index.html", url.origin);
      const assetRequest = new Request(appShellUrl.toString(), request);
      return env.ASSETS.fetch(assetRequest);
    }

    if (url.pathname === "/proveedores" || url.pathname === "/proveedores/") {
      if (!hasAuthCookie) {
        return Response.redirect(new URL("/proveedores/login", url.origin).toString(), 302);
      }

      const hasSession = await hasProviderSession(request);
      if (!hasSession) {
        return Response.redirect(new URL("/proveedores/login", url.origin).toString(), 302);
      }
    }

    if (url.pathname === "/login") {
      const authUrl = new URL("/api/auth/login", url.origin);
      authUrl.search = url.search;
      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === "/static/img/logo_transp.png" || url.pathname === "/static/img/logo_onboarding.png") {
      return svgResponse(BRAND_WORDMARK_SVG);
    }

    if (url.pathname === "/static/img/iso_transp.png" || url.pathname === "/static/img/isotipo.svg") {
      return svgResponse(BRAND_ICON_SVG);
    }

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
