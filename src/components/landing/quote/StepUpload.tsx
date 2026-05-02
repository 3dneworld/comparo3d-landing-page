import { useRef, useState } from "react";
import { CheckCircle2, Lock, Trash2, Upload } from "lucide-react";

interface StepUploadProps {
  fileName: string;
  isLoading: boolean;
  progressMessage: string;
  error: string | null;
  onFileSelect: (file: File) => void;
  onAutoUpload: (file: File) => void | Promise<void>;
  onRemoveFile?: () => void;
}

export function StepUpload({
  fileName,
  isLoading,
  progressMessage,
  error,
  onFileSelect,
  onAutoUpload,
  onRemoveFile,
}: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectedFile = (file: File | undefined) => {
    if (!file || isLoading) return;
    onFileSelect(file);
    void onAutoUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleSelectedFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-[24px] font-semibold leading-tight text-foreground">
          Subi tu archivo 3D
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Un solo archivo por cotizacion. Si necesitas cotizar piezas distintas, genera
          una cotizacion por cada una.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isLoading) fileInputRef.current?.click();
        }}
        className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors md:px-8 md:py-9 ${
          isLoading
            ? "cursor-wait opacity-85"
            : isDragging
            ? "cursor-pointer border-primary bg-primary/5"
            : "cursor-pointer border-border hover:border-primary/50"
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
                Archivo detectado. Estamos procesandolo automaticamente.
              </p>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onRemoveFile();
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                >
                  <Trash2 size={14} />
                  Quitar archivo
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-[18px] font-semibold leading-snug text-foreground">
                Arrastra tu STL aca o hace clic para seleccionarlo
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Formato aceptado: STL.
              </p>
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
              1 archivo por cotizacion
            </span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".stl"
          disabled={isLoading}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleSelectedFile(file);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-[13px] font-semibold text-destructive">Error en el archivo</p>
          <p className="mt-1 text-[13px] text-destructive/80">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-[14px] font-medium text-primary">{progressMessage}</p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3">
        <div className="flex items-start gap-3">
          <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
              Archivo confidencial
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Tu archivo se mantiene confidencial y no se comparte fuera del proceso de
              cotizacion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
