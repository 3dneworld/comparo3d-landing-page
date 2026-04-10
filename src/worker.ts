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

function htmlResponse(html: string, cacheControl = "no-store") {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

function renderProviderLoginHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>COMPARO3D | Acceso proveedores</title>
  <style>
    :root {
      --bg: #0f172a;
      --bg-soft: #172033;
      --line: rgba(148, 163, 184, 0.12);
      --border: rgba(148, 163, 184, 0.14);
      --text: #f8fafc;
      --muted: #94a3b8;
      --primary: #2563eb;
      --primary-2: #0ea5e9;
      --card: rgba(15, 23, 42, 0.74);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, system-ui, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 28%),
        radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 24%),
        linear-gradient(180deg, #0b1220, #111827);
      min-height: 100vh;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(var(--line) 1px, transparent 1px),
        linear-gradient(90deg, var(--line) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
      opacity: 0.65;
    }
    .page {
      position: relative;
      z-index: 1;
      max-width: 1240px;
      margin: 0 auto;
      padding: 28px 24px 40px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      color: var(--text);
      text-decoration: none;
      font-weight: 800;
      letter-spacing: 0.06em;
    }
    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      box-shadow: 0 14px 34px rgba(37, 99, 235, 0.28);
      font-size: 0.8rem;
    }
    .back-link {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.95rem;
    }
    .hero {
      flex: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
      align-items: center;
      gap: 52px;
      padding: 36px 0 12px;
    }
    .visual-panel {
      display: flex;
      flex-direction: column;
      gap: 26px;
    }
    .visual-card {
      border-radius: 30px;
      border: 1px solid var(--border);
      background: rgba(2, 6, 23, 0.42);
      padding: 18px;
      box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
      backdrop-filter: blur(10px);
    }
    .visual-art {
      position: relative;
      aspect-ratio: 1 / 1;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.1);
      background:
        radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.16), rgba(2, 6, 23, 0.94) 60%);
    }
    .visual-art::before,
    .visual-art::after {
      content: "";
      position: absolute;
      inset: 0;
      background-repeat: no-repeat;
      opacity: 0.9;
    }
    .visual-art::before {
      background-image:
        radial-gradient(circle at 20% 28%, rgba(96, 165, 250, 0.95) 0 3px, transparent 4px),
        radial-gradient(circle at 38% 55%, rgba(96, 165, 250, 0.95) 0 4px, transparent 5px),
        radial-gradient(circle at 56% 34%, rgba(125, 211, 252, 0.95) 0 3px, transparent 4px),
        radial-gradient(circle at 70% 58%, rgba(59, 130, 246, 0.95) 0 5px, transparent 6px),
        radial-gradient(circle at 77% 28%, rgba(59, 130, 246, 0.95) 0 3px, transparent 4px),
        radial-gradient(circle at 61% 79%, rgba(37, 99, 235, 0.95) 0 3px, transparent 4px);
    }
    .visual-art::after {
      background-image:
        linear-gradient(120deg, transparent 20%, rgba(59, 130, 246, 0.38) 20.6%, rgba(59, 130, 246, 0.38) 21.2%, transparent 21.8%),
        linear-gradient(168deg, transparent 35%, rgba(14, 165, 233, 0.28) 35.5%, rgba(14, 165, 233, 0.28) 36.1%, transparent 36.7%),
        linear-gradient(94deg, transparent 51%, rgba(96, 165, 250, 0.3) 51.5%, rgba(96, 165, 250, 0.3) 52.1%, transparent 52.7%),
        linear-gradient(36deg, transparent 63%, rgba(59, 130, 246, 0.28) 63.5%, rgba(59, 130, 246, 0.28) 64.1%, transparent 64.7%);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      text-align: center;
    }
    .stat {
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      background: rgba(255, 255, 255, 0.03);
      padding: 18px 12px;
    }
    .stat strong {
      display: block;
      font-family: Montserrat, Inter, system-ui, sans-serif;
      font-size: 1.9rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .stat span {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 0.92rem;
    }
    .content {
      max-width: 520px;
      justify-self: center;
      width: 100%;
    }
    .eyebrow {
      color: #60a5fa;
      text-transform: uppercase;
      letter-spacing: 0.24em;
      font-size: 0.8rem;
      font-weight: 700;
      margin: 0 0 16px;
    }
    h1 {
      margin: 0;
      font-family: Montserrat, Inter, system-ui, sans-serif;
      font-size: clamp(2.4rem, 5vw, 4rem);
      line-height: 1.02;
      letter-spacing: -0.05em;
    }
    .lede {
      margin: 18px 0 0;
      color: #cbd5e1;
      font-size: 1.24rem;
      line-height: 1.55;
      max-width: 36rem;
    }
    .card {
      margin-top: 34px;
      border-radius: 28px;
      border: 1px solid var(--border);
      background: var(--card);
      padding: 28px;
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.38);
      backdrop-filter: blur(14px);
    }
    .btn {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      border: 0;
      border-radius: 18px;
      padding: 16px 22px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: transform .18s ease, opacity .18s ease, box-shadow .18s ease;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn-google {
      background: white;
      color: #0f172a;
    }
    .btn-primary {
      margin-top: 14px;
      color: white;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      box-shadow: 0 18px 40px rgba(37, 99, 235, 0.28);
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      color: rgba(148, 163, 184, 0.6);
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      margin: 18px 0;
    }
    .divider::before,
    .divider::after {
      content: "";
      flex: 1;
      height: 1px;
      background: rgba(148, 163, 184, 0.15);
    }
    .field {
      width: 100%;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: rgba(255, 255, 255, 0.97);
      color: #0f172a;
      padding: 16px 18px;
      font-size: 1rem;
      outline: none;
      margin-bottom: 14px;
    }
    .field::placeholder { color: #94a3b8; }
    .microcopy,
    .support {
      color: rgba(203, 213, 225, 0.76);
      font-size: 0.92rem;
      line-height: 1.6;
      margin: 18px 2px 0;
    }
    .support a { color: #60a5fa; text-decoration: none; }
    .support a:hover { text-decoration: underline; }
    @media (max-width: 980px) {
      .hero { grid-template-columns: 1fr; gap: 28px; }
      .visual-panel { order: 2; }
      .content { max-width: 100%; }
    }
    @media (max-width: 640px) {
      .page { padding: 20px 16px 28px; }
      .topbar { align-items: flex-start; flex-direction: column; }
      .card { padding: 22px 18px; }
      .stats { gap: 10px; }
      .stat strong { font-size: 1.55rem; }
      .stat span { font-size: 0.82rem; }
      .lede { font-size: 1.06rem; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark">C3D</span>
        <span>COMPARO3D</span>
      </a>
      <a class="back-link" href="/">← Volver al sitio principal</a>
    </header>

    <main class="hero">
      <section class="visual-panel">
        <div class="visual-card">
          <div class="visual-art"></div>
        </div>
        <div class="stats">
          <div class="stat"><strong>50+</strong><span>Proveedores activos</span></div>
          <div class="stat"><strong>24hs</strong><span>Tiempo de respuesta</span></div>
          <div class="stat"><strong>100%</strong><span>Operación trazable</span></div>
        </div>
      </section>

      <section class="content">
        <p class="eyebrow">Red de proveedores COMPARO3D</p>
        <h1>Acceso al panel de proveedores</h1>
        <p class="lede">Iniciá sesión con tu cuenta autorizada para gestionar cotizaciones, pedidos y seguimiento operativo.</p>

        <div class="card">
          <a class="btn btn-google" href="/api/auth/login?redirect=proveedores">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Continuar con Google
          </a>

          <div class="divider">o</div>

          <input class="field" type="email" placeholder="Email corporativo" />
          <input class="field" type="password" placeholder="Contraseña" />
          <a class="btn btn-primary" href="/api/auth/login?redirect=proveedores">Iniciar sesión</a>

          <p class="microcopy">Acceso exclusivo para proveedores validados dentro de la red COMPARO3D.</p>
          <p class="support">¿Problemas para acceder? <a href="mailto:soporte@comparo3d.com">Contactá al equipo de COMPARO3D</a></p>
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
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
      if (hasAuthCookie) {
        const hasSession = await hasProviderSession(request);
        if (hasSession) {
          return Response.redirect(new URL("/proveedores", url.origin).toString(), 302);
        }
      }
      return htmlResponse(renderProviderLoginHtml());
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
