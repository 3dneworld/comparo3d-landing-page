import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, CheckCircle, AlertCircle } from "lucide-react";
import { sendContactMessage, isApiError } from "@/lib/api";

const SESSION_KEY = "comparo3d_chat_sent";

type ChatState = "idle" | "sending" | "success" | "error";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState>(() =>
    sessionStorage.getItem(SESSION_KEY) === "true" ? "success" : "idle"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alreadySent = state === "success" && sessionStorage.getItem(SESSION_KEY) === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones locales
    if (!name.trim()) { setError("El nombre es requerido"); return; }
    if (!validateEmail(email)) { setError("Email inválido"); return; }
    if (!message.trim()) { setError("El mensaje es requerido"); return; }

    setState("sending");
    const result = await sendContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() });

    if (isApiError(result)) {
      setState("error");
      setError(result.error || "No se pudo enviar el mensaje");
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    setState("success");
  };

  const handleRetry = () => {
    setState("idle");
    setError(null);
  };

  return (
    <>
      {/* Panel flotante */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-[88px] right-6 z-50 w-full max-w-sm shadow-xl rounded-2xl bg-card border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} />
                <span className="font-semibold text-sm">Chateá con nosotros</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="hover:opacity-70 transition-opacity"
                aria-label="Cerrar chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Estado: ya enviado en esta sesión */}
              {alreadySent && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle size={40} className="text-emerald-500" />
                  <p className="font-medium text-foreground text-sm">Ya recibimos tu mensaje</p>
                  <p className="text-xs text-muted-foreground">Te contactaremos pronto por email.</p>
                </div>
              )}

              {/* Estado: enviado en este submit */}
              {!alreadySent && state === "success" && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle size={40} className="text-emerald-500" />
                  <p className="font-medium text-foreground text-sm">¡Mensaje enviado!</p>
                  <p className="text-xs text-muted-foreground">Te contactaremos pronto a {email}.</p>
                </div>
              )}

              {/* Estado: error */}
              {state === "error" && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <AlertCircle size={36} className="text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="text-xs text-primary underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}

              {/* Formulario */}
              {(state === "idle" || state === "sending") && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-4">
                    Dejanos tu nombre, email y mensaje. Te respondemos a la brevedad.
                  </p>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={state === "sending"}
                      placeholder="Tu nombre"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={state === "sending"}
                      placeholder="tu@email.com"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Mensaje *</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={state === "sending"}
                      placeholder="¿En qué te podemos ayudar?"
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 resize-none"
                    />
                    <p className="text-right text-[10px] text-muted-foreground/60 mt-0.5">{message.length}/500</p>
                  </div>

                  {error && state !== "error" && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {state === "sending" ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Enviar mensaje
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={!open ? { boxShadow: ["0 0 0 0 hsl(220 70% 45% / 0.4)", "0 0 0 10px hsl(220 70% 45% / 0)", "0 0 0 0 hsl(220 70% 45% / 0)"] } : {}}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
