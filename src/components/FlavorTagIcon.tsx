import {
  Candy, Cherry, Citrus, CloudFog, Coffee, Cookie, Feather, Flame, FlameKindling, FlaskConical,
  GlassWater, Hop, Lollipop, Martini, Snowflake, Tag, Weight, Wheat, Zap, type LucideIcon,
} from 'lucide-react'
import type { FlavorTag } from '@/lib/flavorTags'

// Kept out of lib/flavorTags so the API routes that count tags don't pull in icons
const FLAVOR_TAG_ICONS: Record<FlavorTag, LucideIcon> = {
  hoppy: Hop,
  malty: Wheat,
  bitter: Zap,
  sweet: Lollipop,
  sour: FlaskConical,
  fruity: Cherry,
  citrus: Citrus,
  roasty: FlameKindling,
  coffee: Coffee,
  chocolate: Cookie,
  caramel: Candy,
  spicy: Flame,
  smoky: CloudFog,
  crisp: Snowflake,
  light: Feather,
  heavy: Weight,
  watery: GlassWater,
  boozy: Martini,
}

/** The icon for a stored flavor tag key; unknown keys (old data) get a plain tag */
export function FlavorTagIcon({ tag, className }: { tag: string; className?: string }) {
  const Icon = FLAVOR_TAG_ICONS[tag as FlavorTag] ?? Tag
  return <Icon aria-hidden className={className} />
}
