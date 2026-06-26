/**
 * Cloudflare Worker — comparo3d.com.ar
 * Proxies provider surfaces to the Flask backend via api.3dneworld.com.
 * Everything else falls through to the frontend SPA assets.
 */

const BACKEND = "https://api.3dneworld.com";

const PROXY_PREFIXES = ["/onboarding", "/proveedores", "/client-dashboard", "/admin", "/login", "/static/", "/api/"];
const PROVIDER_DASHBOARD_PREFIX = "/dashboard/proveedores";
const PROVIDER_DASHBOARD_LEGACY_PREFIX = "/proveedores-v2";

interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  SHORTLINKS_KV?: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
  };
  SHORTLINK_ADMIN_TOKEN?: string;
}

interface ShortLinkConfig {
  destination_path?: string;
  fragment?: string;
  active?: boolean;
  utm_source: string;
  utm_medium?: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
}

const SHORTLINK_SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const DEFAULT_SHORT_LINK_CAMPAIGN = "mundial2026";
const DEFAULT_SHORT_LINKS: Record<string, ShortLinkConfig> = {
  ig: { utm_source: "instagram", utm_medium: "organic", utm_campaign: DEFAULT_SHORT_LINK_CAMPAIGN },
  fb: { utm_source: "facebook", utm_medium: "organic", utm_campaign: DEFAULT_SHORT_LINK_CAMPAIGN },
  fbg: { utm_source: "facebook_grupo", utm_medium: "organic", utm_campaign: DEFAULT_SHORT_LINK_CAMPAIGN },
  tt: { utm_source: "tiktok", utm_medium: "organic", utm_campaign: DEFAULT_SHORT_LINK_CAMPAIGN },
  tw: { utm_source: "twitter", utm_medium: "organic", utm_campaign: DEFAULT_SHORT_LINK_CAMPAIGN },
  // Campaña email "Adorni" (particulares): cae directo en el paso 1 de cotización (#cotizar).
  adorni: { utm_source: "email", utm_medium: "email", utm_campaign: "adorni", destination_path: "/", fragment: "cotizar" },
};

// Slugs de campaña accesibles como ruta corta SIN prefijo /r/ (ej: comparo3d.com.ar/adorni).
const BARE_CAMPAIGN_SLUGS = new Set<string>(["adorni"]);

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

  try {
    const response = await fetch(authProbeUrl.toString(), {
      method: "GET",
      headers,
      redirect: "manual",
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function serveSpaShell(request: Request, env: WorkerEnv, url: URL) {
  const shellUrl = new URL("/", url.origin);
  const shellRequest = new Request(shellUrl.toString(), {
    method: "GET",
    headers: request.headers,
  });
  return env.ASSETS.fetch(shellRequest);
}

function buildLoginFallbackRedirect(url: URL, code = "auth_unavailable") {
  const loginUrl = new URL("/proveedores/login", url.origin);
  loginUrl.searchParams.set("error", code);
  return Response.redirect(loginUrl.toString(), 302);
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizeShortLinkSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function buildShortLinkTarget(url: URL, config: ShortLinkConfig) {
  const destinationPath = config.destination_path || "/";
  const target = new URL(destinationPath.startsWith("/") ? destinationPath : `/${destinationPath}`, url.origin);
  target.searchParams.set("utm_source", config.utm_source);
  target.searchParams.set("utm_medium", config.utm_medium || "organic");
  target.searchParams.set("utm_campaign", config.utm_campaign);
  if (config.utm_content) target.searchParams.set("utm_content", config.utm_content);
  if (config.utm_term) target.searchParams.set("utm_term", config.utm_term);

  const fragment = config.fragment === undefined ? "trending" : config.fragment;
  if (fragment) target.hash = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  return target.toString();
}

async function resolveShortLink(slug: string, env: WorkerEnv): Promise<ShortLinkConfig | null> {
  const kvValue = await env.SHORTLINKS_KV?.get(`link:${slug}`);
  if (kvValue) {
    try {
      const config = JSON.parse(kvValue) as ShortLinkConfig;
      if (config.active === false) return null;
      if (config.utm_source && config.utm_campaign) return config;
    } catch (error) {
      console.log(`SHORTLINK malformed config slug=${slug} error=${String(error)}`);
    }
  }

  return DEFAULT_SHORT_LINKS[slug] || null;
}

async function incrementKvCounter(env: WorkerEnv, key: string) {
  const kv = env.SHORTLINKS_KV;
  if (!kv) return;
  try {
    const current = Number.parseInt((await kv.get(key)) || "0", 10);
    await kv.put(key, String(Number.isFinite(current) ? current + 1 : 1));
  } catch (error) {
    console.log(`SHORTLINK counter failed key=${key} error=${String(error)}`);
  }
}

async function trackShortLinkClick(slug: string, request: Request, env: WorkerEnv) {
  const day = new Date().toISOString().slice(0, 10);
  await Promise.all([
    incrementKvCounter(env, `clicks:${slug}:total`),
    incrementKvCounter(env, `clicks:${slug}:daily:${day}`),
  ]);

  const cf = request.cf || {};
  console.log(
    JSON.stringify({
      event: "shortlink_click",
      slug,
      day,
      referer: request.headers.get("referer") || "",
      country: typeof cf === "object" && cf && "country" in cf ? cf.country : "",
      user_agent: request.headers.get("user-agent") || "",
    }),
  );
}

function readAdminToken(request: Request) {
  const bearer = request.headers.get("authorization") || "";
  if (bearer.toLowerCase().startsWith("bearer ")) return bearer.slice(7).trim();
  return request.headers.get("x-shortlink-admin-token") || "";
}

function authorizeShortLinkAdmin(request: Request, env: WorkerEnv) {
  if (!env.SHORTLINK_ADMIN_TOKEN) {
    return jsonResponse({ ok: false, error: "shortlink_admin_token_not_configured" }, 503);
  }
  if (readAdminToken(request) !== env.SHORTLINK_ADMIN_TOKEN) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

function parseShortLinkPayload(payload: Record<string, unknown>): { slug: string; config: ShortLinkConfig } | Response {
  const slug = normalizeShortLinkSlug(String(payload.slug || ""));
  if (!SHORTLINK_SLUG_RE.test(slug)) {
    return jsonResponse({ ok: false, error: "invalid_slug" }, 400);
  }

  const utmSource = String(payload.utm_source || "").trim();
  const utmCampaign = String(payload.utm_campaign || "").trim();
  if (!utmSource || !utmCampaign) {
    return jsonResponse({ ok: false, error: "utm_source_and_utm_campaign_required" }, 400);
  }

  const destinationPath = String(payload.destination_path || "/").trim() || "/";
  if (/^https?:\/\//i.test(destinationPath) || !destinationPath.startsWith("/")) {
    return jsonResponse({ ok: false, error: "destination_path_must_be_same_origin_path" }, 400);
  }

  const config: ShortLinkConfig = {
    destination_path: destinationPath,
    fragment: payload.fragment === undefined ? "trending" : String(payload.fragment || ""),
    active: payload.active === undefined ? true : Boolean(payload.active),
    utm_source: utmSource,
    utm_medium: String(payload.utm_medium || "organic").trim() || "organic",
    utm_campaign: utmCampaign,
  };

  const utmContent = String(payload.utm_content || "").trim();
  const utmTerm = String(payload.utm_term || "").trim();
  if (utmContent) config.utm_content = utmContent;
  if (utmTerm) config.utm_term = utmTerm;

  return { slug, config };
}

async function handleShortLinkRedirect(request: Request, env: WorkerEnv, url: URL, forcedSlug?: string) {
  const slug = forcedSlug ?? normalizeShortLinkSlug(url.pathname.slice("/r/".length).replace(/\/$/, ""));
  if (!SHORTLINK_SLUG_RE.test(slug)) {
    return Response.redirect(new URL("/#trending", url.origin).toString(), 302);
  }

  const config = await resolveShortLink(slug, env);
  if (!config) {
    return Response.redirect(new URL("/#trending", url.origin).toString(), 302);
  }

  const target = buildShortLinkTarget(url, config);
  await trackShortLinkClick(slug, request, env);
  return Response.redirect(target, 302);
}

async function proxyBackendShortLink(request: Request, url: URL) {
  const backendUrl = new URL(url.pathname + url.search, BACKEND);
  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set("Host", "api.3dneworld.com");
  proxyHeaders.set("X-Forwarded-Host", url.host);

  const proxyRequest = new Request(backendUrl.toString(), {
    method: request.method,
    headers: proxyHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
    redirect: "manual",
  });

  const backendResponse = await fetch(proxyRequest);
  const responseHeaders = new Headers();
  for (const [key, value] of backendResponse.headers.entries()) {
    responseHeaders.append(key, value);
  }
  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

async function handleShortLinksApi(request: Request, env: WorkerEnv, url: URL) {
  const authError = authorizeShortLinkAdmin(request, env);
  if (authError) return authError;

  const kv = env.SHORTLINKS_KV;
  if (!kv) return jsonResponse({ ok: false, error: "shortlinks_kv_not_configured" }, 503);

  if (url.pathname === "/api/shortlinks" && request.method === "POST") {
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ ok: false, error: "invalid_json" }, 400);
    }

    const parsed = parseShortLinkPayload(payload);
    if (parsed instanceof Response) return parsed;

    await kv.put(`link:${parsed.slug}`, JSON.stringify(parsed.config));
    return jsonResponse(
      {
        ok: true,
        slug: parsed.slug,
        short_url: new URL(`/r/${parsed.slug}`, url.origin).toString(),
        target_url: buildShortLinkTarget(url, parsed.config),
      },
      201,
    );
  }

  if (url.pathname.startsWith("/api/shortlinks/") && request.method === "GET") {
    const slug = normalizeShortLinkSlug(url.pathname.slice("/api/shortlinks/".length).replace(/\/$/, ""));
    if (!SHORTLINK_SLUG_RE.test(slug)) return jsonResponse({ ok: false, error: "invalid_slug" }, 400);

    const config = await resolveShortLink(slug, env);
    if (!config) return jsonResponse({ ok: false, error: "not_found" }, 404);

    return jsonResponse({
      ok: true,
      slug,
      short_url: new URL(`/r/${slug}`, url.origin).toString(),
      target_url: buildShortLinkTarget(url, config),
      clicks_total: Number.parseInt((await kv.get(`clicks:${slug}:total`)) || "0", 10) || 0,
      config,
    });
  }

  return jsonResponse({ ok: false, error: "not_found" }, 404);
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const cookieHeader = request.headers.get("cookie") || "";
    const hasAuthCookie = /(?:^|;\s*)auth_token=/.test(cookieHeader);
    const isProviderDashboardRoute =
      url.pathname === PROVIDER_DASHBOARD_PREFIX ||
      url.pathname === `${PROVIDER_DASHBOARD_PREFIX}/` ||
      url.pathname.startsWith(`${PROVIDER_DASHBOARD_PREFIX}/`);
    const isLegacyProviderDashboardRoute =
      url.pathname === PROVIDER_DASHBOARD_LEGACY_PREFIX ||
      url.pathname === `${PROVIDER_DASHBOARD_LEGACY_PREFIX}/` ||
      url.pathname.startsWith(`${PROVIDER_DASHBOARD_LEGACY_PREFIX}/`);
    const providerDashboardShortRoutes: Record<string, string> = {
      "/materiales": `${PROVIDER_DASHBOARD_PREFIX}/materiales`,
      "/materiales/": `${PROVIDER_DASHBOARD_PREFIX}/materiales`,
      "/cotizaciones": `${PROVIDER_DASHBOARD_PREFIX}/cotizaciones`,
      "/cotizaciones/": `${PROVIDER_DASHBOARD_PREFIX}/cotizaciones`,
      "/pedidos": `${PROVIDER_DASHBOARD_PREFIX}/pedidos`,
      "/pedidos/": `${PROVIDER_DASHBOARD_PREFIX}/pedidos`,
      "/envios": `${PROVIDER_DASHBOARD_PREFIX}/envios`,
      "/envios/": `${PROVIDER_DASHBOARD_PREFIX}/envios`,
      "/portfolio": `${PROVIDER_DASHBOARD_PREFIX}/portfolio`,
      "/portfolio/": `${PROVIDER_DASHBOARD_PREFIX}/portfolio`,
      "/certificacion": `${PROVIDER_DASHBOARD_PREFIX}/certificacion`,
      "/certificacion/": `${PROVIDER_DASHBOARD_PREFIX}/certificacion`,
      "/competitividad": `${PROVIDER_DASHBOARD_PREFIX}/competitividad`,
      "/competitividad/": `${PROVIDER_DASHBOARD_PREFIX}/competitividad`,
    };

    const isProviderLoginRoute =
      url.pathname === "/proveedores/login" || url.pathname === "/proveedores/login/";

    if (url.pathname === "/api/shortlinks" || url.pathname.startsWith("/api/shortlinks/")) {
      return handleShortLinksApi(request, env, url);
    }

    if (url.pathname === "/r" || url.pathname === "/r/" || url.pathname.startsWith("/r/")) {
      return handleShortLinkRedirect(request, env, url);
    }

    // Short links de campaña sin prefijo /r/ (ej: /adorni). Mismo tracking + redirect.
    if (url.pathname === "/ditella" || url.pathname === "/ditella/") {
      return proxyBackendShortLink(request, url);
    }

    if (url.pathname === "/cotizar" || url.pathname === "/cotizar/") {
      const target = new URL("/", url.origin);
      target.search = url.search;
      target.hash = "cotizar";
      return Response.redirect(target.toString(), 302);
    }

    {
      const bareSlug = normalizeShortLinkSlug(url.pathname.replace(/^\//, "").replace(/\/$/, ""));
      if (BARE_CAMPAIGN_SLUGS.has(bareSlug)) {
        return handleShortLinkRedirect(request, env, url, bareSlug);
      }
    }

    if (isProviderLoginRoute) {
      if (hasAuthCookie) {
        const hasSession = await hasProviderSession(request);
        if (hasSession) {
          return Response.redirect(new URL(PROVIDER_DASHBOARD_PREFIX, url.origin).toString(), 302);
        }
      }
      return serveSpaShell(request, env, url);
    }

    // Onboarding login — React SPA (no proxy al Flask)
    if (
      url.pathname === "/proveedores/onboarding/login" ||
      url.pathname === "/proveedores/onboarding/login/"
    ) {
      return serveSpaShell(request, env, url);
    }

    const dashboardShortTarget = providerDashboardShortRoutes[url.pathname];
    if (dashboardShortTarget) {
      return Response.redirect(new URL(dashboardShortTarget + url.search, url.origin).toString(), 302);
    }

    if (isLegacyProviderDashboardRoute) {
      const legacySuffix = url.pathname.slice(PROVIDER_DASHBOARD_LEGACY_PREFIX.length);
      return Response.redirect(new URL(`${PROVIDER_DASHBOARD_PREFIX}${legacySuffix}${url.search}`, url.origin).toString(), 302);
    }

    if (isProviderDashboardRoute) {
      return serveSpaShell(request, env, url);
    }

    if (url.pathname === "/client-review" || url.pathname === "/client-review/" || url.pathname.startsWith("/client-review/")) {
      return serveSpaShell(request, env, url);
    }

    // Listado público de proveedores — SPA, sin auth
    if (url.pathname === "/proveedores" || url.pathname === "/proveedores/") {
      return serveSpaShell(request, env, url);
    }

    // Perfil público de proveedor — SPA, sin auth.
    // Acepta dos formatos:
    //   /proveedores/123-nombre  (canónico con prefijo id)
    //   /proveedores/printalot   (slug puro, el SPA lo resuelve vía /api/proveedores/by-slug)
    if (/^\/proveedores\/[a-z0-9][a-z0-9-]*\/?$/i.test(url.pathname)) {
      return serveSpaShell(request, env, url);
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

    const shouldProxy = PROXY_PREFIXES.some((prefix) => {
      if (prefix === "/proveedores") {
        return url.pathname === "/proveedores" || url.pathname === "/proveedores/" || url.pathname.startsWith("/proveedores/");
      }
      return url.pathname.startsWith(prefix);
    });

    if (shouldProxy) {
      const backendUrl = new URL(url.pathname + url.search, BACKEND);

      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set("Host", "api.3dneworld.com");

      const proxyRequest = new Request(backendUrl.toString(), {
        method: request.method,
        headers: proxyHeaders,
        body: request.body,
        redirect: "manual",
      });
      let backendResponse: Response;
      try {
        backendResponse = await fetch(proxyRequest);
      } catch {
        if (url.pathname === "/api/auth/login" || url.pathname === "/api/auth/callback") {
          return buildLoginFallbackRedirect(url);
        }
        throw new Error(`Backend proxy failed for ${url.pathname}`);
      }

      if (
        backendResponse.status >= 530 &&
        (url.pathname === "/api/auth/login" || url.pathname === "/api/auth/callback")
      ) {
        return buildLoginFallbackRedirect(url);
      }

      const isCallback = url.pathname === "/api/auth/callback";
      const responseHeaders = new Headers();
      for (const [key, value] of backendResponse.headers.entries()) {
        responseHeaders.append(key, value);
      }

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

    return env.ASSETS.fetch(request);
  },
};
