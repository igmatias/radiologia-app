interface RadiationIconProps {
  size?: number
  className?: string
}

// Símbolo de radiación (trefoil) — 3 hojas de 60° centradas en 90°, 210°, 330°
// ViewBox 24×24, centro (12,12), r_inner=4, r_outer=10.5
export default function RadiationIcon({ size = 24, className = "" }: RadiationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Círculo central */}
      <circle cx="12" cy="12" r="2" />

      {/* Hoja superior (centrada en 90°, de 60° a 120°) */}
      <path d="M 14 8.54 A 4 4 0 0 0 10 8.54 L 6.75 2.91 A 10.5 10.5 0 0 1 17.25 2.91 Z" />

      {/* Hoja inferior-izquierda (centrada en 210°, de 180° a 240°) */}
      <path d="M 8 12 A 4 4 0 0 0 10 15.46 L 6.75 21.09 A 10.5 10.5 0 0 1 1.5 12 Z" />

      {/* Hoja inferior-derecha (centrada en 330°, de 300° a 360°) */}
      <path d="M 14 15.46 A 4 4 0 0 0 16 12 L 22.5 12 A 10.5 10.5 0 0 1 17.25 21.09 Z" />
    </svg>
  )
}
