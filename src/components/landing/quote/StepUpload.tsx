import { useRef, useState } from "react";
import { CheckCircle2, Lock, Upload } from "lucide-react";

interface StepUploadProps {
  fileName: string;
  isLoading: boolean;
  progressMessage: string;
  error: string | null;
  onFileSelect: (file: File) => void;
  onContinue: () => void;
}

export function StepUpload({
  fileName,
  isLoading,
  progressMessage,
  error,
  onFileSelect,
  onContinue,
}: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-[24px] font-semibold leading-tight text-foreground">
          Subí tu archivo 3D
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Un solo archivo por cotización. Si necesitás cotizar piezas distintas, generá
          una cotización por cada una.
        </p>
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors md:px-8 md:py-9 ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {fileName ? <CheckCircle2 size={28} className="text-accent" /> : <Upload size={28} />}
          </div>

          {fileName ? (
            <>
              <p className="text-[16px] font-semibold text-foreground">{fileName}</p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Archivo cargado. Hacé clic para cambiar.
              </p>
            </>
          ) : (
            <>
              <p className="text-[18px] font-semibold leading-snug text-foreground">
                Arrastrá tu STL acá o hacé clic para seleccionarlo
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Formato aceptado hoy: STL.
              </p>
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
              1 archivo por cotización
            </span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".stl"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelect(f);
          }}
        />
      </div>

      {/* Error manifold */}
      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-[13px] font-semibold text-destructive">Error en el archivo</p>
          <p className="mt-1 text-[13px] text-destructive/80">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-[14px] font-medium text-primary">{progressMessage}</p>
        </div>
      )}

      {/* Confidencialidad */}
      <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3">
        <div className="flex items-start gap-3">
          <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
              Archivo confidencial
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Tu archivo se mantiene confidencial y no se comparte fuera del proceso de
              cotización.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={isLoading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-[15px] font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? progressMessage : "Continuar"}
      </button>
    </div>
  );
}
