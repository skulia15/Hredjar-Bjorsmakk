// Christmas avatars, one picture per participant within a tasting.
// Participant.avatar stores the key, so reordering or adding pictures never moves anyone's

export type AvatarColor =
  | 'rautt'
  | 'graent'
  | 'blatt'
  | 'gult'
  | 'appelsinugult'

export const AVATAR_COLOR_ORDER: AvatarColor[] = [
  'rautt',
  'graent',
  'blatt',
  'gult',
  'appelsinugult',
]

export interface Avatar {
  key: string
  name: string
  /** Extra-raunchy tier; picked for 85% of participants */
  cheeky?: boolean
  color: AvatarColor
}

/** Festive faces and things — every single one well off the naughty list, ordered by color */
export const AVATARS: Avatar[] = [
  // Rauður
  { key: 'bossabraedur', name: 'Bossabræðurnir', cheeky: true, color: 'rautt' },
  { key: 'jolakulurnar', name: 'Jólakúlurnar', cheeky: true, color: 'rautt' },
  { key: 'snjokonan', name: 'Snjókonan', cheeky: true, color: 'rautt' },
  { key: 'osaemilegi-snjokarlinn', name: 'Ósæmilegi snjókarlinn', cheeky: true, color: 'rautt' },
  { key: 'eldflaugasnjokarl', name: 'Eldflaugasnjókarlinn', cheeky: true, color: 'rautt' },
  { key: 'alfastelpa', name: 'Bjórálfastelpan', cheeky: true, color: 'rautt' },
  { key: 'tungusnjokarl', name: 'Tungusnjókarlinn', cheeky: true, color: 'rautt' },
  { key: 'stufur-litli', name: 'Litli Stúfur', cheeky: true, color: 'rautt' },
  { key: 'ljota-peysan', name: 'Ljóta peysan', cheeky: true, color: 'rautt' },
  { key: 'kertastjakinn', name: 'Kertastjakinn', cheeky: true, color: 'rautt' },

  // Grænn
  { key: 'bossasveinn', name: 'Bossasveinn', cheeky: true, color: 'graent' },
  { key: 'snjokarlabossi', name: 'Snjókarlabossinn', cheeky: true, color: 'graent' },
  { key: 'bjugnakraekir', name: 'Bjúgnakrækir', cheeky: true, color: 'graent' },
  { key: 'bjugnakraekir-v2', name: 'Bjúgnakrækir á bóner', cheeky: true, color: 'graent' },
  { key: 'kertasnikir', name: 'Kertasníkir', cheeky: true, color: 'graent' },
  { key: 'isbjorn', name: 'Leðurbjörninn', cheeky: true, color: 'graent' },
  { key: 'jolasveinn', name: 'Sveinki í pottinum', cheeky: true, color: 'graent' },
  { key: 'kutaalfurinn', name: 'Kútaálfurinn', cheeky: true, color: 'graent' },
  { key: 'kulanef', name: 'Kúlanef', cheeky: true, color: 'graent' },
  { key: 'gryla', name: 'Grýla á djamminu', color: 'graent' },
  { key: 'gryla-v2', name: 'Grýla í kjólnum', cheeky: true, color: 'graent' },
  { key: 'leppaludi', name: 'Leppalúði', cheeky: true, color: 'graent' },
  { key: 'giljagaur', name: 'Giljagaur', cheeky: true, color: 'graent' },
  { key: 'ljosaseria', name: 'Ljósaserían', cheeky: true, color: 'graent' },

  // Blár
  { key: 'hreindyrabossi', name: 'Rúdolf sýnir bossann', cheeky: true, color: 'blatt' },
  { key: 'klausubossi', name: 'Frú Klaus beygir sig', cheeky: true, color: 'blatt' },
  { key: 'jolatresbossi', name: 'Jólatrésbossinn', cheeky: true, color: 'blatt' },
  { key: 'fastur-i-strompinum', name: 'Fastur í strompinum', cheeky: true, color: 'blatt' },
  { key: 'sveinki-a-brokinni', name: 'Sveinki á brókinni', cheeky: true, color: 'blatt' },
  { key: 'pakki', name: 'Pakkinn', cheeky: true, color: 'blatt' },
  { key: 'bitni-piparkokukarlinn', name: 'Bitni piparkökubossinn', cheeky: true, color: 'blatt' },
  { key: 'skyrgamur', name: 'Skyrgámur', cheeky: true, color: 'blatt' },
  { key: 'gluggagaegir', name: 'Gluggagægir', cheeky: true, color: 'blatt' },
  { key: 'morgaes', name: 'Partýmörgæsin', cheeky: true, color: 'blatt' },
  { key: 'peysualfur', name: 'Peysuálfurinn', cheeky: true, color: 'blatt' },
  { key: 'fulli-jolasveinninn', name: 'Fulli jólasveinninn', color: 'blatt' },
  { key: 'thunna-hreindyrid', name: 'Þunna hreindýrið', color: 'blatt' },
  { key: 'stekkjarstaur-v2', name: 'Stekkjarstaur á hækjum', cheeky: true, color: 'blatt' },
  { key: 'askasleikir', name: 'Askasleikir', cheeky: true, color: 'blatt' },
  { key: 'sledafylleri', name: 'Sleðafylleríið', cheeky: true, color: 'blatt' },
  { key: 'jolahermann', name: 'Jólahermanninn', cheeky: true, color: 'blatt' },

  // Gulur
  { key: 'thvorusleikir', name: 'Þvörusleikir', cheeky: true, color: 'gult' },
  { key: 'mistilteinn-a-beltinu', name: 'Mistilteinn á beltinu', cheeky: true, color: 'gult' },
  { key: 'jolakotturinn', name: 'Jólakötturinn', cheeky: true, color: 'gult' },
  { key: 'hreindyr', name: 'Rúdolf á djamminu', cheeky: true, color: 'gult' },
  { key: 'hnotubrjoturinn', name: 'Hnotubrjóturinn', cheeky: true, color: 'gult' },
  { key: 'fastur-i-mursteinum', name: 'Fastur í múrsteinum', cheeky: true, color: 'gult' },
  { key: 'bumbusveinn', name: 'Bumbusveinn', color: 'gult' },
  { key: 'bumbusveinn-v2', name: 'Bumbusveinn í nærbuxum', cheeky: true, color: 'gult' },
  { key: 'stekkjarstaur', name: 'Stekkjarstaur', cheeky: true, color: 'gult' },
  { key: 'leppaludi-v2', name: 'Leppalúði í hægindastólnum', cheeky: true, color: 'gult' },
  { key: 'hurdaskellir', name: 'Hurðaskellir', color: 'gult' },

  // Appelsínugulur / Fjólublár
  { key: 'alfabossi', name: 'Álfabossinn', cheeky: true, color: 'appelsinugult' },
  { key: 'nagdakaka', name: 'Nagða kakan', cheeky: true, color: 'appelsinugult' },
  { key: 'jolatred', name: 'Fulla jólatréð', cheeky: true, color: 'appelsinugult' },
  { key: 'jolakentarinn', name: 'Jólakentárinn', cheeky: true, color: 'appelsinugult' },
  { key: 'dj-hangikjot', name: 'DJ Hangikjöt', cheeky: true, color: 'appelsinugult' },
]

const CHEEKY_SHARE = 0.85

export function avatarSrc(avatar: Avatar): string {
  return `/avatars/${avatar.key}.jpg`
}

/**
 * A picture nobody in the tasting has yet, mostly from the cheeky pool. Once all are taken
 * (more people than pictures), the least used one gets doubled up
 */
export function pickAvatar(taken: Array<string | null>, random: () => number = Math.random): string {
  const uses = new Map(AVATARS.map(a => [a.key, 0]))
  for (const key of taken) if (key && uses.has(key)) uses.set(key, uses.get(key)! + 1)

  const fewest = Math.min(...uses.values())
  const free = AVATARS.filter(a => uses.get(a.key) === fewest)
  const cheeky = free.filter(a => a.cheeky)
  const classic = free.filter(a => !a.cheeky)
  const pool = cheeky.length && (!classic.length || random() < CHEEKY_SHARE) ? cheeky : classic
  return pool[Math.floor(random() * pool.length)].key
}

/** Stable pick from a seed, for participants who joined before avatars were handed out */
function avatarFromSeed(seed: string): Avatar {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const h = hash >>> 0
  const cheeky = AVATARS.filter(a => a.cheeky)
  const classic = AVATARS.filter(a => !a.cheeky)
  const pool = h % 100 < CHEEKY_SHARE * 100 ? cheeky : classic
  return pool[Math.floor(h / 100) % pool.length]
}

export function resolveAvatar(key: string | null | undefined, seed: string): Avatar {
  return AVATARS.find(a => a.key === key) ?? avatarFromSeed(seed)
}
