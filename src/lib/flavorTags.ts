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

export function flavorTagLabel(tag: string): string {
  return FLAVOR_TAGS[tag as FlavorTag] ?? tag
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
