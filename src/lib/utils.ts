import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un valor Decimal de Prisma (o cualquier tipo numérico) a number.
 * Necesario porque los campos Decimal de Prisma devuelven objetos Decimal,
 * no primitivos number, y la aritmética directa (+, -, *) falla silenciosamente.
 */
export function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return val
  if (typeof val === "object" && val !== null && "toNumber" in val) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return Number(val)
}
