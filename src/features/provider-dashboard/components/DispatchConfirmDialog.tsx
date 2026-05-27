import { useEffect, useState } from "react";
import { AlertTriangle, Bike, Building2, CalendarDays, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DispatchConfirmParams {
  estimatedDeliveryDate: string;
  useMotorcycle: boolean;
  useLaboratoryPickup: boolean;
  pickupTimeFrom: string;
  pickupTimeTo: string;
}

interface DispatchConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number | null;
  isPickup: boolean;
  hasTracking: boolean;
  paymentPayerEmail?: string | null;
  shippingRefundAmount?: number | null;
  isSubmitting: boolean;
  onBypassTrackingChange?: (bypassesTracking: boolean) => void;
  onConfirm: (params: DispatchConfirmParams) => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateAr(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatMoneyAr(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "No disponible";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export function DispatchConfirmDialog({
  open,
  onOpenChange,
  orderId,
  isPickup,
  hasTracking,
  paymentPayerEmail,
  shippingRefundAmount,
  isSubmitting,
  onBypassTrackingChange,
  onConfirm,
}: DispatchConfirmDialogProps) {
  const [estimatedDate, setEstimatedDate] = useState(todayIso);
  const [pickupTimeFrom, setPickupTimeFrom] = useState("10:00");
  const [pickupTimeTo, setPickupTimeTo] = useState("18:00");
  const [dispatchMode, setDispatchMode] = useState<"standard" | "motorcycle" | "laboratoryPickup">("standard");

  useEffect(() => {
    if (open) {
      setEstimatedDate(todayIso());
      setPickupTimeFrom("10:00");
      setPickupTimeTo("18:00");
      setDispatchMode("standard");
      onBypassTrackingChange?.(false);
    }
  }, [onBypassTrackingChange, open]);

  function handleModeChange(mode: "motorcycle" | "laboratoryPickup", checked: boolean) {
    const nextMode = checked ? mode : "standard";
    setDispatchMode(nextMode);
    onBypassTrackingChange?.(nextMode !== "standard");
  }

  function handleConfirm() {
    onConfirm({
      estimatedDeliveryDate: estimatedDate,
      useMotorcycle: dispatchMode === "motorcycle",
      useLaboratoryPickup: dispatchMode === "laboratoryPickup",
      pickupTimeFrom,
      pickupTimeTo,
    });
  }

  const useMoto = dispatchMode === "motorcycle";
  const useLaboratoryPickup = dispatchMode === "laboratoryPickup";
  const canConfirmDispatch = isPickup || hasTracking || useMoto || useLaboratoryPickup;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-background p-0">
        <DialogHeader className="space-y-3 px-6 pt-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-600/10">
            <Truck className="h-7 w-7 text-emerald-600" />
          </div>
          <DialogTitle className="text-center font-[Montserrat] text-lg font-bold tracking-tight">
            {isPickup ? "Confirmar retiro listo" : "Confirmar despacho"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {isPickup
              ? `Al confirmar, el pedido${orderId ? ` #${orderId}` : ""} se marcará como listo para retirar y se le enviará un email al cliente con la fecha y el horario para pasar a buscar su pieza.`
              : `Al confirmar, el pedido${orderId ? ` #${orderId}` : ""} se marcará como despachado y se le enviará un email al cliente con la información de entrega.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {isPickup ? (
            <>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Fecha en que puede pasar a retirar
                </label>
                <Input
                  type="date"
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  className="h-11 rounded-xl border-border/80 bg-white"
                  min={todayIso()}
                />
                {estimatedDate && (
                  <p className="text-xs text-muted-foreground">
                    El cliente verá: <strong>{formatDateAr(estimatedDate)}</strong>
                  </p>
                )}
              </div>

              <PickupTimeFields
                pickupTimeFrom={pickupTimeFrom}
                pickupTimeTo={pickupTimeTo}
                onPickupTimeFromChange={setPickupTimeFrom}
                onPickupTimeToChange={setPickupTimeTo}
              />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Fecha estimada de llegada al cliente
                </label>
                <Input
                  type="date"
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  className="h-11 rounded-xl border-border/80 bg-white"
                  min={todayIso()}
                />
                {estimatedDate && (
                  <p className="text-xs text-muted-foreground">
                    Se le informará al cliente que su pedido llegará el <strong>{formatDateAr(estimatedDate)}</strong>
                  </p>
                )}
              </div>

              {!hasTracking && (
                <div className="flex items-start gap-2 rounded-[0.85rem] border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-800">
                    Antes de poder despachar el pedido debes ingresar el número de tracking. En caso que el envío lo hagas en moto u otro medio, deberás tildar que el envío se hace por moto
                  </p>
                </div>
              )}

              <div className="rounded-[1rem] border border-border/70 bg-background/70 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={useMoto}
                    onChange={(e) => handleModeChange("motorcycle", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-emerald-600"
                    aria-label="El envío se hace con moto"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Bike className="h-4 w-4 text-emerald-600" />
                      El envío se hace con moto
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Indicá esta opción si vos mismo realizás el envío por moto. El cliente recibirá un email informándole que el proveedor eligió realizar el envío de forma personal.
                    </p>
                  </div>
                </label>
              </div>

              <div className="rounded-[1rem] border border-border/70 bg-background/70 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={useLaboratoryPickup}
                    onChange={(e) => handleModeChange("laboratoryPickup", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-emerald-600"
                    aria-label="Retiro por Laboratorio"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      Retiro por Laboratorio
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      El cliente se arrepintió y quiere retirar por el Laboratorio. Esto significa que deberás realizarle al cliente una devolución a su cuenta de Mercado Pago{" "}
                      <strong className="font-semibold text-foreground">{paymentPayerEmail || "No disponible"}</strong>{" "}
                      el monto de <strong className="font-semibold text-foreground">{formatMoneyAr(shippingRefundAmount)}</strong>.
                    </p>
                  </div>
                </label>
              </div>

              {useLaboratoryPickup && (
                <PickupTimeFields
                  pickupTimeFrom={pickupTimeFrom}
                  pickupTimeTo={pickupTimeTo}
                  onPickupTimeFromChange={setPickupTimeFrom}
                  onPickupTimeToChange={setPickupTimeTo}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex gap-3 px-6 pb-6 pt-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-10 flex-1 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            onClick={handleConfirm}
            disabled={isSubmitting || !estimatedDate || !canConfirmDispatch || ((isPickup || useLaboratoryPickup) && (!pickupTimeFrom || !pickupTimeTo))}
          >
            <Truck className="mr-1.5 h-4 w-4" />
            {isPickup ? "Confirmar retiro listo" : "Confirmar despacho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PickupTimeFields({
  pickupTimeFrom,
  pickupTimeTo,
  onPickupTimeFromChange,
  onPickupTimeToChange,
}: {
  pickupTimeFrom: string;
  pickupTimeTo: string;
  onPickupTimeFromChange: (value: string) => void;
  onPickupTimeToChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Horario de atención para retiro
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="mb-1 text-[11px] text-muted-foreground">Desde</p>
          <Input
            type="time"
            value={pickupTimeFrom}
            onChange={(e) => onPickupTimeFromChange(e.target.value)}
            className="h-11 rounded-xl border-border/80 bg-white"
          />
        </div>
        <span className="mt-5 text-sm text-muted-foreground">-</span>
        <div className="flex-1">
          <p className="mb-1 text-[11px] text-muted-foreground">Hasta</p>
          <Input
            type="time"
            value={pickupTimeTo}
            onChange={(e) => onPickupTimeToChange(e.target.value)}
            className="h-11 rounded-xl border-border/80 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
