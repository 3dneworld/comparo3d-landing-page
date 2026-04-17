import React from "react";

export function TrayectoriaVerificada5Icon({
  className,
  size = 20,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Shield — outline variant (5+ tier: versión contorno) */}
      <path d="M12 3 L5.5 6.5 L5.5 13 C5.5 17.5 8.5 21 12 22.5 C15.5 21 18.5 17.5 18.5 13 L18.5 6.5 Z" />
      {/* V marker — trayectoria 5+ años */}
      <path
        d="M9.5 10.5 L12 15 L14.5 10.5"
        stroke="hsl(var(--accent))"
        strokeWidth={1.75}
        fill="none"
        strokeOpacity={0.85}
      />
    </svg>
  );
}
