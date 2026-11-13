import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "6.5%", with a decimal point like the scores; null when the beer has none */
export function formatAbv(abv: number | null | undefined): string | null {
  if (abv == null) return null
  return `${Number(abv.toFixed(1))}%`
}
