// Stored keys stay stable; labels are what people see
export const FLAVOR_TAGS = {
  hoppy: 'Humlað',
  malty: 'Maltað',
  bitter: 'Beiskt',
  sweet: 'Sætt',
  sour: 'Súrt',
  fruity: 'Ávaxtaríkt',
  citrus: 'Sítrus',
  roasty: 'Ristað',
  coffee: 'Kaffi',
  chocolate: 'Súkkulaði',
  caramel: 'Karamella',
  spicy: 'Kryddað',
  smoky: 'Reykt',
  crisp: 'Ferskt',
  light: 'Létt',
  heavy: 'Þungt',
  watery: 'Vatnskennt',
  boozy: 'Áfengt',
} as const

export type FlavorTag = keyof typeof FLAVOR_TAGS

export const FLAVOR_TAG_KEYS = Object.keys(FLAVOR_TAGS) as [FlavorTag, ...FlavorTag[]]

export const NOTE_MAX_LENGTH = 280

// Free-text "Annað" tags: stored as their label, alongside the fixed keys
export const CUSTOM_TAG_MAX_LENGTH = 24
export const CUSTOM_TAGS_PER_RATING = 3

export function flavorTagLabel(tag: string): string {
  return FLAVOR_TAGS[tag as FlavorTag] ?? tag
}

/**
 * One spelling per tag, so "negull", " Negull " and "NEGULL" count together in the cloud.
 * Typing a fixed tag's label ("kaffi") gives its key back, so it lands on the right icon.
 */
export function normalizeTag(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ')
  const lower = cleaned.toLocaleLowerCase('is')
  if (lower in FLAVOR_TAGS) return lower
  const known = FLAVOR_TAG_KEYS.find(key => FLAVOR_TAGS[key].toLocaleLowerCase('is') === lower)
  if (known) return known
  return lower.charAt(0).toLocaleUpperCase('is') + lower.slice(1)
}

export function isCustomTag(tag: string): boolean {
  return !(tag in FLAVOR_TAGS)
}

/** Tag counts across ratings, most common first */
export function countTags(ratings: Array<{ tags: string[] }>): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>()
  for (const rating of ratings) {
    for (const tag of rating.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
