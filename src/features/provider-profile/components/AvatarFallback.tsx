// AvatarFallback.tsx — Iniciales + color determinístico por provider_id

interface Props {
  id: number;
  nombre: string;
  size?: number;
}

function hashHue(id: number): number {
  return (id * 137) % 360; // golden angle para distribución uniforme
}

function getInitials(nombre: string): string {
  // Eliminar emojis y caracteres no-letra del nombre antes de procesar
  const clean = nombre.replace(/[^a-zA-ZÀ-ÿ\s]/g, "").trim();
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AvatarFallback({ id, nombre, size = 96 }: Props) {
  const hue = hashHue(id);
  const initials = getInitials(nombre) || "?";

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 65% 42%)`,
        fontSize: Math.round(size * 0.38),
        flexShrink: 0,
      }}
      aria-label={`Avatar de ${nombre}`}
    >
      {initials}
    </div>
  );
}
