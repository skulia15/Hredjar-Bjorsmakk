// "Lite", "Light" or "Létt" starting a word: "Gull Lite", "Víking Lite Jól", "Léttöl", but not "Delight"
const LIGHT_NAME = /(^|[^\p{L}])(lite|light|létt)/iu

/** A light beer, going by its name: what the scores page ranks on its own */
export function isLightBeer(name: string): boolean {
  return LIGHT_NAME.test(name)
}
