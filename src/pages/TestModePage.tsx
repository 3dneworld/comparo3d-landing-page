import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TEST_MODE_STORAGE_KEY, isTestModeActive } from "@/lib/api";

/**
 * Pagina interna para activar/desactivar TEST MODE en este browser.
 *
 * Uso:
 *   /test-mode             -> ver estado + botones
 *   /test-mode?action=on   -> activa y muestra confirmacion
 *   /test-mode?action=off  -> desactiva y muestra confirmacion
 *
 * El backend redirige aca despues de /api/dev/test-mode/on|off para que el
 * setting se persista en el dominio del frontend (comparo3d.com.ar), no en
 * api.3dneworld.com donde no sirve para nada por cross-origin.
 *
 * Cuando esta activo, todos los fetch a /api/quotes/.../options incluyen el
 * header X-Test-Mode: 1 y el backend devuelve tambien los proveedores TEST.
 */
export default function TestModePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const action = params.get("action") || params.get("w3dn_set_test_mode");
    if (action === "on") {
      localStorage.setItem(TEST_MODE_STORAGE_KEY, "1");
    } else if (action === "off") {
      localStorage.removeItem(TEST_MODE_STORAGE_KEY);
    }
    setActive(isTestModeActive());
  }, [params]);

  const handleToggle = (next: "on" | "off") => {
    if (next === "on") localStorage.setItem(TEST_MODE_STORAGE_KEY, "1");
    else localStorage.removeItem(TEST_MODE_STORAGE_KEY);
    setActive(next === "on");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div
          className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${
            active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {active ? "🧪 ACTIVO" : "INACTIVO"}
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Test mode {active ? "activado" : "desactivado"}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          {active ? (
            <>
              Desde este browser vas a ver los proveedores <b>TEST / TEST2</b> en las
              cotizaciones. El header <code className="rounded bg-slate-100 px-1.5 py-0.5">X-Test-Mode: 1</code> se
              envia en cada request al backend.
            </>
          ) : (
            <>
              Estas en modo normal — no se ven los proveedores TEST. Activalo si necesitas
              probar checkout end-to-end sin que se exponga a clientes reales.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleToggle("on")}
            disabled={active}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Activar
          </button>
          <button
            type="button"
            onClick={() => handleToggle("off")}
            disabled={!active}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Desactivar
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Flag almacenado en localStorage key: <code>{TEST_MODE_STORAGE_KEY}</code>
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← Volver a COMPARO3D
        </button>
      </div>
    </div>
  );
}
