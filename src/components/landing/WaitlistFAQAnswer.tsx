import { useState } from "react";
import { subscribeWaitlist, isApiError } from "@/lib/api";

type WState = "idle" | "sending" | "success" | "already" | "error";

export default function WaitlistFAQAnswer() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<WState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Ingresá un email válido");
      return;
    }
    setErrorMsg("");
    setState("sending");
    const result = await subscribeWaitlist({ email: trimmed, technology: "resina_sls" });
    if (isApiError(result)) {
      setState("error");
      setErrorMsg(result.error || "No se pudo procesar la suscripción");
      return;
    }
    setState(result.already_subscribed ? "already" : "success");
  };

  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <p>
        Todavía no. Actualmente trabajamos exclusivamente con tecnología <strong className="text-foreground">FDM (filamento)</strong>,
        que es la más versátil y accesible para la mayoría de los usos.
      </p>
      <p>
        Estamos evaluando sumar <strong className="text-foreground">resina (SLA/DLP)</strong> y{" "}
        <strong className="text-foreground">sinterizado (SLS)</strong> más adelante.
      </p>

      {/* Estados de éxito */}
      {state === "success" && (
        <p className="text-emerald-600 font-medium flex items-center gap-1.5 text-xs">
          ✓ Listo. Te avisaremos cuando esté disponible.
        </p>
      )}
      {state === "already" && (
        <p className="text-emerald-600 font-medium flex items-center gap-1.5 text-xs">
          ✓ Ya estás en la lista. Te avisaremos.
        </p>
      )}

      {/* Formulario */}
      {state !== "success" && state !== "already" && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-2 pt-1">
          <label className="text-xs text-muted-foreground w-full">
            ¿Querés que te avisemos cuando esté disponible?
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
            disabled={state === "sending"}
            placeholder="tu@email.com"
            className="flex-1 min-w-[180px] px-3 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
          >
            {state === "sending" ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              "Avisame"
            )}
          </button>
          {state === "error" && (
            <p className="w-full text-xs text-destructive">{errorMsg}</p>
          )}
          {errorMsg && state !== "error" && (
            <p className="w-full text-xs text-destructive">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}
