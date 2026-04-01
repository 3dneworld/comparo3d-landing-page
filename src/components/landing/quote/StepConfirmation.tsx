import { ShoppingCart } from "lucide-react";

interface StepConfirmationProps {
  isEmpresa: boolean;
  sessionId: string;
  orderId: string | null;
  isLoading: boolean;
  progressMessage: string;
  onReset: () => void;
}

export function StepConfirmation({
  isEmpresa,
  sessionId,
  orderId,
  isLoading,
  progressMessage,
  onReset,
}: StepConfirmationProps) {
  return (
    <div className="py-8 text-center">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-[15px] font-medium text-foreground">{progressMessage}</p>
        </div>
      ) : (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
            <ShoppingCart size={28} className="text-primary-foreground" />
          </div>
          <h3 className="mb-2 text-[24px] font-semibold text-foreground">¡Listo!</h3>
          <p className="mx-auto mb-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {isEmpresa
              ? "Tu solicitud fue registrada. Nos vamos a poner en contacto para coordinar la propuesta corporativa."
              : "Tu pedido fue registrado. Nos vamos a poner en contacto con vos para coordinar el pago y la entrega."}
          </p>

          {orderId ? (
            <p className="text-sm font-semibold text-foreground">
              Referencia:{" "}
              <span className="font-mono text-primary">{orderId}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Sesión: {sessionId}</p>
          )}

          <button
            onClick={onReset}
            className="mt-6 rounded-xl bg-gradient-primary px-8 py-3 font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
          >
            Nueva cotización
          </button>
        </>
      )}
    </div>
  );
}
