// The /ssr entry has no React context, so it renders in server and client components alike
import {
  Barbell, Campfire, Cherries, CloudFog, CoffeeBean, Cookie, Feather, Grains, IceCream,
  Jar, Leaf, Lightning, Martini, OrangeSlice, Pepper, SmileyXEyes, Snowflake, Tag, Waves,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import type { FlavorTag } from '@/lib/flavorTags'

// Phosphor over lucide here: it has the food icons (hops aside), and its filled weight holds
// its own next to extra-bold labels where thin outlines looked faint.
// Kept out of lib/flavorTags so the API routes that count tags don't pull in icons
const FLAVOR_TAG_ICONS: Record<FlavorTag, Icon> = {
  hoppy: Leaf,
  malty: Grains,
  bitter: Lightning,
  sweet: IceCream,
  sour: SmileyXEyes,
  fruity: Cherries,
  citrus: OrangeSlice,
  roasty: Campfire,
  coffee: CoffeeBean,
  chocolate: Cookie,
  caramel: Jar,
  spicy: Pepper,
  smoky: CloudFog,
  crisp: Snowflake,
  light: Feather,
  heavy: Barbell,
  watery: Waves,
  boozy: Martini,
}

/** The icon for a stored flavor tag key; unknown keys (old data) get a plain tag */
export function FlavorTagIcon({ tag, className }: { tag: string; className?: string }) {
  const Icon = FLAVOR_TAG_ICONS[tag as FlavorTag] ?? Tag
  return <Icon aria-hidden weight="fill" className={className} />
}
