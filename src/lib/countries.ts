/**
 * Vínbúðin names Iceland "Ísland"; older catalog rows (and the dev seed) still say "Iceland",
 * which the sync only replaces on rows it touches
 */
export function isIcelandic(country: string | null | undefined): boolean {
  return country === 'Ísland' || country === 'Iceland'
}
