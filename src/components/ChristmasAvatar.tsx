import type { ReactNode } from 'react'

// Palette shared by the sprites
const RED = '#C8323A'
const DEEP_RED = '#9A2329'
const GREEN = '#2F7D4F'
const DARK_GREEN = '#1F5A38'
const GOLD = '#F2A93B'
const CREAM = '#FBF6EA'
const INK = '#1E1B16'
const BROWN = '#8A5A2B'
const SKIN = '#F5C9A5'
const SKY = '#3B6EA8'

interface Sprite {
  name: string
  bg: string
  art: ReactNode
  /** Off the naughty list; picked more often than the classics */
  cheeky?: boolean
}

/** Festive faces and things, many of them off the naughty list, drawn on a 48×48 grid over a coloured disc */
const SPRITES: Sprite[] = [
  {
    name: 'Jólasveinn',
    bg: GREEN,
    art: (
      <>
        <circle cx="24" cy="27" r="9" fill={SKIN} />
        <path d="M13.5 21.5 C14 11, 31 8, 34.5 21.5 Z" fill={RED} />
        <path d="M29.5 12 C34 9.5, 38 12, 38.5 16.5 L34 18.5 Z" fill={RED} />
        <circle cx="38.5" cy="17" r="3.5" fill={CREAM} />
        <rect x="12" y="20" width="24" height="5" rx="2.5" fill={CREAM} />
        <path d="M13.5 28 C13.5 44, 34.5 44, 34.5 28 C31 33, 17 33, 13.5 28 Z" fill={CREAM} />
        <circle cx="20.5" cy="27" r="1.4" fill={INK} />
        <circle cx="27.5" cy="27" r="1.4" fill={INK} />
        <circle cx="24" cy="31" r="2" fill="#E8857A" />
      </>
    ),
  },
  {
    name: 'Snjókarl',
    bg: SKY,
    art: (
      <>
        <circle cx="24" cy="33" r="10" fill={CREAM} />
        <circle cx="24" cy="18" r="7.5" fill={CREAM} />
        <rect x="17" y="6" width="14" height="6" rx="1" fill={INK} />
        <rect x="14" y="11" width="20" height="2.5" rx="1" fill={INK} />
        <circle cx="21.5" cy="17" r="1.2" fill={INK} />
        <circle cx="26.5" cy="17" r="1.2" fill={INK} />
        <path d="M24 19.5 L31 21 L24 21.5 Z" fill={GOLD} />
        <path d="M17 24 h14 v3 h-4 v5 h-3 v-5 h-7 Z" fill={RED} />
        <circle cx="24" cy="31" r="1.2" fill={INK} />
        <circle cx="24" cy="36" r="1.2" fill={INK} />
      </>
    ),
  },
  {
    name: 'Hreindýr',
    bg: GOLD,
    art: (
      <>
        <path d="M17 16 L13 8 M13 12 L9 10 M31 16 L35 8 M35 12 L39 10" stroke={BROWN} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="24" cy="27" rx="10" ry="11" fill={BROWN} />
        <ellipse cx="13.5" cy="20" rx="4" ry="2.2" fill={BROWN} transform="rotate(-25 13.5 20)" />
        <ellipse cx="34.5" cy="20" rx="4" ry="2.2" fill={BROWN} transform="rotate(25 34.5 20)" />
        <ellipse cx="24" cy="33" rx="6" ry="4.5" fill="#C9935C" />
        <circle cx="20" cy="24" r="1.5" fill={INK} />
        <circle cx="28" cy="24" r="1.5" fill={INK} />
        <circle cx="24" cy="31" r="3.2" fill={RED} />
      </>
    ),
  },
  {
    name: 'Piparkökukarl',
    bg: CREAM,
    art: (
      <>
        <circle cx="24" cy="13" r="6.5" fill="#B5763A" />
        <path d="M16 20 h16 l7 6 -3 3 -5 -4 v9 l5 8 -4 2 -6 -8 -6 8 -4 -2 5 -8 v-9 l-5 4 -3 -3 Z" fill="#B5763A" />
        <circle cx="21.5" cy="12" r="1.1" fill={INK} />
        <circle cx="26.5" cy="12" r="1.1" fill={INK} />
        <path d="M21 15.5 Q24 17.5 27 15.5" stroke={CREAM} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="24" r="1.4" fill={RED} />
        <circle cx="24" cy="29" r="1.4" fill={GREEN} />
      </>
    ),
  },
  {
    name: 'Jólatré',
    bg: DEEP_RED,
    art: (
      <>
        <path d="M24 7 L35 22 H29 L37 33 H11 L19 22 H13 Z" fill={GREEN} />
        <rect x="21" y="33" width="6" height="6" fill={BROWN} />
        <path d="M24 3.5 l1.6 3.3 3.6.5 -2.6 2.5.6 3.6 -3.2-1.7 -3.2 1.7.6-3.6 -2.6-2.5 3.6-.5Z" fill={GOLD} />
        <circle cx="20" cy="20" r="1.6" fill={GOLD} />
        <circle cx="27" cy="25" r="1.6" fill={CREAM} />
        <circle cx="18" cy="30" r="1.6" fill={RED} />
        <circle cx="30" cy="30" r="1.6" fill={GOLD} />
      </>
    ),
  },
  {
    name: 'Fulli jólasveinninn',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* Hat slipping off, eyes at half mast, nose glowing, beer in hand */}
        <circle cx="22" cy="26" r="9" fill={SKIN} />
        <g transform="rotate(-14 22 14)">
          <path d="M11.5 20 C12 10, 29 7, 32.5 20 Z" fill={RED} />
          <path d="M27.5 10.5 C32 8, 36 10.5, 36.5 15 L32 17 Z" fill={RED} />
          <circle cx="36.5" cy="15.5" r="3.2" fill={CREAM} />
        </g>
        <rect x="10" y="17" width="23" height="5" rx="2.5" fill={CREAM} transform="rotate(-10 21 19)" />
        <path d="M12 28 C12 41, 32 41, 32 28 C28 32, 16 32, 12 28 Z" fill={CREAM} />
        <path d="M16.5 25 h4 M23.5 25 h4" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="22" cy="29" r="2.6" fill={RED} />
        <circle cx="15.5" cy="28" r="2" fill="#E8857A" opacity="0.7" />
        <circle cx="28.5" cy="28" r="2" fill="#E8857A" opacity="0.7" />
        <rect x="32" y="26" width="9" height="12" rx="2" fill={GOLD} />
        <path d="M41 29 h2 a2.5 2.5 0 0 1 0 5 h-2" stroke={GOLD} strokeWidth="1.8" fill="none" />
        <rect x="31.5" y="24" width="10" height="4" rx="2" fill={CREAM} />
      </>
    ),
  },
  {
    name: 'Bjalla',
    bg: GREEN,
    art: (
      <>
        <path d="M24 10 C15 10, 15 22, 14 28 L11 33 H37 L34 28 C33 22, 33 10, 24 10 Z" fill={GOLD} />
        <circle cx="24" cy="36" r="3.2" fill="#D98B1F" />
        <path d="M24 10 C19 4, 14 8, 19 11 Z M24 10 C29 4, 34 8, 29 11 Z" fill={RED} />
        <circle cx="24" cy="10" r="2" fill={DEEP_RED} />
        <path d="M18 18 Q19 14 22 13" stroke={CREAM} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
      </>
    ),
  },
  {
    name: 'Brjóstsykurstafur',
    bg: CREAM,
    art: (
      <>
        <path d="M20 40 V17 a7 7 0 0 1 14 0 v3" stroke={RED} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M18 25 L22 22 M18 32 L22 29 M18 38.5 L22 35.5 M20.8 10.8 L23.6 13.6 M29.5 13.2 L31.5 9.8 M31.5 19.5 L36 18" stroke={CREAM} strokeWidth="2.4" strokeLinecap="butt" />
      </>
    ),
  },
  {
    name: 'Pakki',
    bg: SKY,
    art: (
      <>
        <rect x="11" y="20" width="26" height="19" rx="2" fill={RED} />
        <rect x="9" y="15" width="30" height="7" rx="2" fill={DEEP_RED} />
        <rect x="21.5" y="15" width="5" height="24" fill={GOLD} />
        <path d="M24 15 C18 8, 13 12, 17 15 Z M24 15 C30 8, 35 12, 31 15 Z" fill={GOLD} />
      </>
    ),
  },
  {
    name: 'Sokkur',
    bg: GOLD,
    art: (
      <>
        <path d="M18 14 H31 V29 L35 33 C38 36, 35 41, 31 40 L19 36 C16 35, 17 31, 18 29 Z" fill={RED} />
        <rect x="16" y="9" width="17" height="7" rx="2" fill={CREAM} />
        <circle cx="24" cy="23" r="2" fill={CREAM} />
      </>
    ),
  },
  {
    name: 'Jólakúla',
    bg: GREEN,
    art: (
      <>
        <rect x="20.5" y="8" width="7" height="5" rx="1" fill={GOLD} />
        <circle cx="24" cy="27" r="13" fill={RED} />
        <path d="M11.5 25 Q24 30 36.5 25" stroke={GOLD} strokeWidth="2.5" fill="none" />
        <path d="M12.5 31 Q24 36 35.5 31" stroke={CREAM} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
        <circle cx="19" cy="21" r="2.5" fill={CREAM} opacity="0.6" />
      </>
    ),
  },
  {
    name: 'Bossasveinn',
    cheeky: true,
    bg: GREEN,
    art: (
      <>
        {/* Santa mooning the room: jacket up, trousers down */}
        <rect x="13" y="8" width="22" height="12" rx="3" fill={RED} />
        <rect x="13" y="17" width="22" height="3.5" fill={CREAM} />
        <rect x="13" y="13" width="22" height="2.5" fill={INK} />
        <circle cx="19" cy="26" r="7" fill={SKIN} />
        <circle cx="29" cy="26" r="7" fill={SKIN} />
        <path d="M24 21 V30" stroke="#D9A07E" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="17" cy="25" r="1.6" fill="#F0A79B" opacity="0.8" />
        <circle cx="31" cy="25" r="1.6" fill="#F0A79B" opacity="0.8" />
        <rect x="13" y="31" width="22" height="3.5" fill={CREAM} />
        <rect x="14" y="34" width="8.5" height="6" fill={RED} />
        <rect x="25.5" y="34" width="8.5" height="6" fill={RED} />
        <rect x="13" y="39" width="10" height="3.5" rx="1.5" fill={INK} />
        <rect x="25" y="39" width="10" height="3.5" rx="1.5" fill={INK} />
      </>
    ),
  },
  {
    name: 'Mistilteinn',
    cheeky: true,
    bg: CREAM,
    art: (
      <>
        {/* Someone got caught under the mistletoe */}
        <path d="M24 3 V12" stroke={RED} strokeWidth="1.5" />
        <path d="M24 12 C18 8, 13 11, 14 15 C18 16, 21 15, 24 12 Z" fill={GREEN} />
        <path d="M24 12 C30 8, 35 11, 34 15 C30 16, 27 15, 24 12 Z" fill={DARK_GREEN} />
        <circle cx="22" cy="14" r="1.8" fill="#E9E4D4" stroke="#C9C2AE" strokeWidth="0.6" />
        <circle cx="26" cy="14" r="1.8" fill="#E9E4D4" stroke="#C9C2AE" strokeWidth="0.6" />
        <circle cx="24" cy="16" r="1.8" fill="#E9E4D4" stroke="#C9C2AE" strokeWidth="0.6" />
        <path d="M13 29 C16 23, 21 23, 24 26 C27 23, 32 23, 35 29 C30 28, 27 29, 24 30 C21 29, 18 28, 13 29 Z" fill={RED} />
        <path d="M13 29 C18 37, 30 37, 35 29 C30 31, 18 31, 13 29 Z" fill={DEEP_RED} />
        <path d="M17 33 Q24 35 31 33" stroke={RED} strokeWidth="0.8" fill="none" opacity="0.6" />
      </>
    ),
  },
  {
    name: 'Þunna hreindýrið',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* The morning after: dizzy eyes, tongue out, ice pack on the antlers */}
        <path d="M17 15 L13 8 M13 11 L9 10 M31 15 L35 8 M35 11 L39 10" stroke={BROWN} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="24" cy="27" rx="10" ry="11" fill={BROWN} />
        <ellipse cx="13.5" cy="21" rx="4" ry="2.2" fill={BROWN} transform="rotate(-25 13.5 21)" />
        <ellipse cx="34.5" cy="21" rx="4" ry="2.2" fill={BROWN} transform="rotate(25 34.5 21)" />
        <rect x="16" y="11" width="16" height="6" rx="3" fill="#8EC5E8" />
        <rect x="16" y="11" width="16" height="2" rx="1" fill={CREAM} opacity="0.6" />
        <ellipse cx="24" cy="33" rx="6" ry="4.5" fill="#C9935C" />
        <path d="M18 22 l3 3 M21 22 l-3 3 M27 22 l3 3 M30 22 l-3 3" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="30.5" r="2.6" fill={RED} />
        <path d="M24 35 q1 4 3.5 3 q1.5 -1 0 -3 Z" fill="#E8857A" />
      </>
    ),
  },
  {
    name: 'Mörgæs',
    bg: SKY,
    art: (
      <>
        <ellipse cx="24" cy="28" rx="11" ry="13" fill={INK} />
        <ellipse cx="24" cy="31" rx="7" ry="9" fill={CREAM} />
        <circle cx="21" cy="21" r="1.4" fill={CREAM} />
        <circle cx="27" cy="21" r="1.4" fill={CREAM} />
        <path d="M22 24 L26 24 L24 27 Z" fill={GOLD} />
        <path d="M14 18 C16 6, 32 6, 34 18 Z" fill={RED} />
        <rect x="13" y="16" width="22" height="4" rx="2" fill={CREAM} />
        <circle cx="24" cy="6.5" r="3" fill={CREAM} />
      </>
    ),
  },
  {
    name: 'Álfur',
    bg: GOLD,
    art: (
      <>
        <path d="M13 21 L30 5 L36 21 Z" fill={GREEN} />
        <circle cx="30" cy="5" r="2.8" fill={RED} />
        <circle cx="24" cy="28" r="9" fill={SKIN} />
        <path d="M14 26 L10 21 L16 23 Z M34 26 L38 21 L32 23 Z" fill={SKIN} />
        <rect x="12" y="19" width="24" height="4.5" rx="2" fill={RED} />
        <circle cx="20.5" cy="28" r="1.4" fill={INK} />
        <circle cx="27.5" cy="28" r="1.4" fill={INK} />
        <path d="M20.5 32 Q24 35 27.5 32" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    name: 'Kakó',
    bg: RED,
    art: (
      <>
        <path d="M18 15 Q16 12 18 9 M24 15 Q22 12 24 9 M30 15 Q28 12 30 9" stroke={CREAM} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M33 22 h3 a5 5 0 0 1 0 10 h-3" stroke={CREAM} strokeWidth="3" fill="none" />
        <path d="M13 18 H35 V34 a6 6 0 0 1 -6 6 H19 a6 6 0 0 1 -6 -6 Z" fill={CREAM} />
        <ellipse cx="24" cy="19" rx="10" ry="2.5" fill={BROWN} />
        <path d="M17 27 h14" stroke={GREEN} strokeWidth="2.5" />
      </>
    ),
  },
  {
    name: 'Óþekktarlistinn',
    cheeky: true,
    bg: GOLD,
    art: (
      <>
        {/* Checked twice, and you're on it */}
        <path d="M13 9 H35 V37 C35 40, 32 41, 30 39 C28 41, 26 39, 24 41 C22 39, 20 41, 18 39 C16 41, 13 40, 13 37 Z" fill={CREAM} />
        <rect x="13" y="7" width="22" height="5" rx="2.5" fill="#E6DCC4" />
        <rect x="17" y="15" width="14" height="3" rx="1.5" fill={RED} />
        <path d="M17 23 h6 M17 28 h8 M17 33 h5" stroke="#B9AE95" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24 28 L28 33 L37 19" stroke={RED} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    name: 'Ósæmilegi snjókarlinn',
    cheeky: true,
    bg: DEEP_RED,
    art: (
      <>
        {/* His carrot has slipped, and he isn't sorry */}
        <circle cx="24" cy="33" r="10" fill={CREAM} />
        <circle cx="24" cy="17" r="7.5" fill={CREAM} />
        <path d="M19.5 13.5 l3 1 M28.5 13.5 l-3 1" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="21.5" cy="16.5" r="1.2" fill={INK} />
        <path d="M25.5 16.5 h2.2" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M21 20.5 Q24 22.5 27 20.2" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="19" cy="19.5" r="1.6" fill="#F0A79B" opacity="0.8" />
        <circle cx="29" cy="19.5" r="1.6" fill="#F0A79B" opacity="0.8" />
        <path d="M17 23.5 h14 v3 h-11 Z" fill={GREEN} />
        <path d="M26 33.5 L42 29 L26.5 38.5 Z" fill={GOLD} />
        <path d="M31 32 l0.8 2.6 M35.5 30.8 l0.8 2.2 M39 29.9 l0.6 1.6" stroke="#D98B1F" strokeWidth="1" />
      </>
    ),
  },
  {
    name: 'Ísbjörn',
    bg: GREEN,
    art: (
      <>
        <circle cx="14" cy="15" r="5" fill={CREAM} />
        <circle cx="34" cy="15" r="5" fill={CREAM} />
        <circle cx="14" cy="15" r="2.2" fill="#E6DCC4" />
        <circle cx="34" cy="15" r="2.2" fill="#E6DCC4" />
        <circle cx="24" cy="26" r="13" fill={CREAM} />
        <ellipse cx="24" cy="31" rx="6" ry="4.5" fill="#E6DCC4" />
        <circle cx="19" cy="23" r="1.5" fill={INK} />
        <circle cx="29" cy="23" r="1.5" fill={INK} />
        <ellipse cx="24" cy="29" rx="2.4" ry="1.7" fill={INK} />
        <path d="M14 37 Q24 42 34 37 L33 40 Q24 44 15 40 Z" fill={RED} />
      </>
    ),
  },
  {
    name: 'Bumbusveinn',
    cheeky: true,
    bg: GOLD,
    art: (
      <>
        {/* Jacket can't close over the beer belly any more */}
        <ellipse cx="24" cy="35" rx="15" ry="11" fill={RED} />
        <ellipse cx="24" cy="36" rx="9" ry="8.5" fill={SKIN} />
        <path d="M22.5 37 q1.5 1.5 3 0" stroke="#C98D6A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M10.5 41 Q24 46 37.5 41" stroke={INK} strokeWidth="3" fill="none" />
        <circle cx="24" cy="15" r="6.5" fill={SKIN} />
        <path d="M17 17 C17 26, 31 26, 31 17 C28 20, 20 20, 17 17 Z" fill={CREAM} />
        <path d="M16.5 11.5 C17 4, 30 3, 31.5 11.5 Z" fill={RED} />
        <path d="M28 5 C31 3, 34.5 4.5, 35 8 L31.5 9.5 Z" fill={RED} />
        <circle cx="35" cy="8.5" r="2.5" fill={CREAM} />
        <rect x="16" y="10.5" width="16" height="3.5" rx="1.75" fill={CREAM} />
        <circle cx="21.5" cy="16" r="1" fill={INK} />
        <circle cx="26.5" cy="16" r="1" fill={INK} />
      </>
    ),
  },
  {
    name: 'Guli snjórinn',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* Don't eat it */}
        <path d="M8 36 C10 28, 18 27, 22 30 C26 25, 36 26, 40 36 Z" fill={CREAM} />
        <ellipse cx="24" cy="36" rx="16" ry="4.5" fill={CREAM} />
        <ellipse cx="27" cy="33.5" rx="6" ry="2.6" fill="#F4D35E" />
        <ellipse cx="27" cy="33.5" rx="3" ry="1.2" fill="#E3B23C" />
        <path d="M9 10 Q22 8 26.5 31" stroke="#F4D35E" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeDasharray="3 2.5" />
        <path d="M33 22 q-1.5 -2.5 0 -5 M36.5 23 q-1.5 -2.5 0 -5" stroke={CREAM} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />
      </>
    ),
  },
  {
    name: 'Fulli álfurinn',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* Passed out after one too many */}
        <circle cx="21" cy="29" r="9" fill={SKIN} />
        <path d="M12 24 L36 15 L30 28 Z" fill={GREEN} />
        <circle cx="36" cy="15" r="2.6" fill={RED} />
        <rect x="11" y="22.5" width="21" height="4.5" rx="2.2" fill={RED} transform="rotate(-12 21 25)" />
        <path d="M15.5 30 q2 1.5 4 0 M22.5 30 q2 1.5 4 0" stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <ellipse cx="21" cy="34.5" rx="2" ry="1.5" fill="#B5574D" />
        <rect x="32" y="29" width="6" height="11" rx="2" fill="#5B3A1E" />
        <rect x="33.5" y="25.5" width="3" height="4.5" rx="1" fill="#5B3A1E" />
        <rect x="32" y="32" width="6" height="3.5" fill={CREAM} />
        <path d="M13 9 h4 l-4 4 h4 M19 5 h3 l-3 3 h3" stroke={CREAM} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    name: 'Bitni piparkökukarlinn',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* Someone already had a nibble */}
        <circle cx="24" cy="13" r="6.5" fill="#B5763A" />
        <path d="M16 20 h16 l7 6 -3 3 -5 -4 v9 l5 8 -4 2 -6 -8 -6 8 -4 -2 5 -8 v-9 l-5 4 -3 -3 Z" fill="#B5763A" />
        <circle cx="29.5" cy="8.5" r="2.6" fill={SKY} />
        <circle cx="31.2" cy="11.5" r="2.4" fill={SKY} />
        <circle cx="27.5" cy="6.6" r="2.2" fill={SKY} />
        <circle cx="21.5" cy="12" r="1.1" fill={INK} />
        <circle cx="25.5" cy="12" r="1.1" fill={INK} />
        <ellipse cx="23.5" cy="16" rx="1.4" ry="1.8" fill={INK} />
        <circle cx="24" cy="24" r="1.4" fill={RED} />
        <circle cx="24" cy="29" r="1.4" fill={GREEN} />
      </>
    ),
  },
  {
    name: 'Frú Kláus',
    cheeky: true,
    bg: GREEN,
    art: (
      <>
        {/* Winks at whoever is still standing */}
        <circle cx="24" cy="11" r="6" fill={CREAM} />
        <circle cx="24" cy="27" r="11" fill={CREAM} />
        <circle cx="24" cy="28" r="9" fill={SKIN} />
        <path d="M17.5 26.5 q2 -1.8 4 0" stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <circle cx="28" cy="26" r="1.4" fill={INK} />
        <path d="M27 23.5 l-0.6 -1.6 M28.5 23.3 l0 -1.7 M30 23.6 l0.6 -1.5" stroke={INK} strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="18.5" cy="30" r="1.8" fill="#E8857A" opacity="0.7" />
        <circle cx="29.5" cy="30" r="1.8" fill="#E8857A" opacity="0.7" />
        <path d="M20.5 32.5 C22 31, 23.5 31.8, 24 32.3 C24.5 31.8, 26 31, 27.5 32.5 C26 35.5, 22 35.5, 20.5 32.5 Z" fill={RED} />
        <circle cx="13.5" cy="31" r="1.5" fill={GOLD} />
        <circle cx="34.5" cy="31" r="1.5" fill={GOLD} />
        <path d="M26 8 C29 5, 32 7, 30 9 Z" fill={GREEN} />
        <circle cx="27" cy="9.5" r="1.3" fill={RED} />
      </>
    ),
  },
  {
    name: 'Nærbuxnatréð',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* Somebody's knickers ended up on the tree */}
        <path d="M24 7 L35 22 H29 L37 33 H11 L19 22 H13 Z" fill={GREEN} />
        <rect x="21" y="33" width="6" height="6" fill={BROWN} />
        <path d="M24 3.5 l1.6 3.3 3.6.5 -2.6 2.5.6 3.6 -3.2-1.7 -3.2 1.7.6-3.6 -2.6-2.5 3.6-.5Z" fill={GOLD} transform="rotate(18 24 8)" />
        <path d="M31.5 19.5 L33 22.5" stroke={INK} strokeWidth="0.9" />
        <path d="M25 23.5 H42 L40 30.5 C36.5 30.2, 34.8 32, 33.5 35.5 C32.2 32, 30.5 30.2, 27 30.5 Z" fill={RED} />
        <rect x="25" y="22" width="17" height="3" rx="1.5" fill="#F7C5D2" />
        <path d="M33.5 23.5 l-2.4 -1.6 v3.2 Z M33.5 23.5 l2.4 -1.6 v3.2 Z" fill="#E86A92" />
        <circle cx="17" cy="29" r="1.6" fill={GOLD} />
        <circle cx="20" cy="18" r="1.6" fill={CREAM} />
      </>
    ),
  },
  {
    name: 'Jólakúlurnar',
    cheeky: true,
    bg: DEEP_RED,
    art: (
      <>
        {/* A matching pair */}
        <path d="M24 6 L17 17 M24 6 L31 17" stroke={GOLD} strokeWidth="1.2" fill="none" />
        <rect x="14.5" y="16" width="5" height="3.5" rx="1" fill={GOLD} />
        <rect x="28.5" y="16" width="5" height="3.5" rx="1" fill={GOLD} />
        <circle cx="17" cy="28" r="9" fill={GOLD} />
        <circle cx="31" cy="28" r="9" fill={GOLD} />
        <path d="M8.3 27 Q17 31 25.7 27 M22.3 27 Q31 31 39.7 27" stroke={RED} strokeWidth="2" fill="none" />
        <circle cx="13.5" cy="24" r="2" fill={CREAM} opacity="0.6" />
        <circle cx="27.5" cy="24" r="2" fill={CREAM} opacity="0.6" />
        <path d="M21 5 C18 2, 16 5, 24 6 C32 5, 30 2, 27 5" fill={GREEN} />
      </>
    ),
  },
  {
    name: 'Fastur í strompinum',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* Went down bum first and that was a mistake */}
        <circle cx="10" cy="13" r="1" fill={CREAM} />
        <circle cx="38" cy="10" r="1.2" fill={CREAM} />
        <rect x="15" y="28" width="18" height="16" fill="#A0412D" />
        <path d="M15 33 h18 M15 38 h18 M21 28 v5 M27 33 v5 M21 38 v6" stroke="#7A2E20" strokeWidth="1" />
        <rect x="18" y="6.5" width="4.5" height="11" rx="1.5" fill={RED} />
        <rect x="25.5" y="6.5" width="4.5" height="11" rx="1.5" fill={RED} />
        <rect x="16.5" y="3.5" width="7" height="5" rx="1.5" fill={INK} />
        <rect x="24.5" y="3.5" width="7" height="5" rx="1.5" fill={INK} />
        <circle cx="19.5" cy="21.5" r="6" fill={RED} />
        <circle cx="28.5" cy="21.5" r="6" fill={RED} />
        <path d="M24 16.5 v9" stroke={DEEP_RED} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="18" cy="20" r="1.6" fill="#E25A60" />
        <circle cx="30" cy="20" r="1.6" fill="#E25A60" />
        <rect x="12" y="26" width="24" height="4.5" rx="1.5" fill="#B9533D" />
        <path d="M12 26.5 C15 24.5, 19 26, 21 25.5 M27 25.5 C29 26, 33 24.5, 36 26.5" stroke={CREAM} strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    name: 'Hreindýr í runnanum',
    cheeky: true,
    bg: GOLD,
    art: (
      <>
        {/* Two sets of antlers, one very busy bush */}
        <path d="M16 26 L13 15 M14 19 L10 16 M13.5 15 L11 11 M32 26 L35 15 M34 19 L38 16 M34.5 15 L37 11" stroke={BROWN} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle cx="15" cy="32" r="8" fill={GREEN} />
        <circle cx="33" cy="32" r="8" fill={GREEN} />
        <circle cx="24" cy="28" r="9" fill={GREEN} />
        <ellipse cx="24" cy="37" rx="15" ry="5" fill={DARK_GREEN} />
        <path d="M6 26 l-2 -1.5 M6 31 l-2.5 0 M42 26 l2 -1.5 M42 31 l2.5 0" stroke={DARK_GREEN} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24 13 C24 10, 20 10, 20.5 13 C21 15, 24 17, 24 17 C24 17, 27 15, 27.5 13 C28 10, 24 10, 24 13 Z" fill={RED} />
        <path d="M30 7 C30 5.5, 28 5.5, 28.2 7 C28.5 8, 30 9, 30 9 C30 9, 31.5 8, 31.8 7 C32 5.5, 30 5.5, 30 7 Z" fill={RED} />
        <circle cx="19" cy="27" r="1.2" fill={RED} />
        <circle cx="29" cy="31" r="1.2" fill={RED} />
      </>
    ),
  },
  {
    name: 'Gluggagægir',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* The yule lad who peeps in through your window */}
        <rect x="8" y="9" width="32" height="30" rx="2" fill={CREAM} />
        <rect x="11" y="12" width="26" height="24" fill="#1D2B44" />
        <circle cx="24" cy="33" r="10" fill={SKIN} />
        <path d="M14 31 C14 21, 34 21, 34 31 C31 27, 17 27, 14 31 Z" fill="#6B4A2E" />
        <circle cx="20" cy="31" r="2.4" fill={CREAM} />
        <circle cx="28" cy="31" r="2.4" fill={CREAM} />
        <circle cx="20.6" cy="31.4" r="1.2" fill={INK} />
        <circle cx="28.6" cy="31.4" r="1.2" fill={INK} />
        <path d="M17.5 27.5 l4 1 M30.5 27.5 l-4 1" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="24" cy="35.5" rx="2.6" ry="2" fill="#E3A07E" />
        <rect x="23" y="12" width="2" height="24" fill={CREAM} />
        <rect x="11" y="23" width="26" height="2" fill={CREAM} opacity="0.9" />
        <rect x="6" y="36" width="36" height="4" rx="1.5" fill={CREAM} />
        <circle cx="15" cy="36.5" r="2.4" fill={SKIN} />
        <circle cx="33" cy="36.5" r="2.4" fill={SKIN} />
      </>
    ),
  },
  {
    name: 'Bjúgnakrækir',
    cheeky: true,
    bg: GREEN,
    art: (
      <>
        {/* The sausage-swiping yule lad, very pleased with his find */}
        <path d="M10 22 C10 6, 30 6, 30 22 L28 30 H12 Z" fill="#6B4A2E" />
        <circle cx="20" cy="22" r="8" fill={SKIN} />
        <path d="M12.5 25 C13 35, 27 35, 27.5 25 C24 28, 16 28, 12.5 25 Z" fill="#D9D3C4" />
        <path d="M15.5 20 q2 -1.2 4 0 M21 20 q2 -1.2 4 0" stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M16 19 l3 -0.5 M21.5 18.5 l3 0.5" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M17 26.5 Q21 29 24 25.5" stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M24 38 L39 17" stroke="#9C3B2E" strokeWidth="7" strokeLinecap="round" />
        <path d="M27 33 L37 19" stroke="#C25A44" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        <path d="M22.5 40 l-1.5 2 M40.5 15 l1.5 -2" stroke={CREAM} strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="29" cy="31" r="3" fill={SKIN} />
      </>
    ),
  },
  {
    name: 'Snjókonan',
    cheeky: true,
    bg: DEEP_RED,
    art: (
      <>
        {/* Curves in all the right places, and she knows it */}
        <ellipse cx="24" cy="36" rx="13.5" ry="8" fill={CREAM} />
        <ellipse cx="24" cy="25.5" rx="6.5" ry="5.5" fill={CREAM} />
        <circle cx="24" cy="14" r="6.5" fill={CREAM} />
        <path d="M18.5 9.5 C20 6.5, 22 7, 24 9 C26 7, 28 6.5, 29.5 9.5 C27 11, 21 11, 18.5 9.5 Z" fill="#E86A92" />
        <path d="M20 14 q1.5 -1.3 3 0" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="27" cy="13.8" r="1.2" fill={INK} />
        <path d="M26 11.8 l-0.5 -1.3 M27.3 11.6 l0 -1.4 M28.6 11.9 l0.6 -1.2" stroke={INK} strokeWidth="0.7" strokeLinecap="round" />
        <path d="M21.5 17 C22.5 16, 23.5 16.6, 24 17 C24.5 16.6, 25.5 16, 26.5 17 C25.5 19, 22.5 19, 21.5 17 Z" fill={RED} />
        <circle cx="20" cy="16" r="1.3" fill="#F0A79B" opacity="0.8" />
        <circle cx="28.5" cy="16" r="1.3" fill="#F0A79B" opacity="0.8" />
        <path d="M17.5 20.5 Q24 24.5 30.5 20.5 Q32.5 26 30 31" stroke="#E86A92" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeDasharray="0.1 2.6" />
        <path d="M17.5 20.5 Q24 24.5 30.5 20.5 Q32.5 26 30 31" stroke="#E86A92" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="34" r="1" fill={INK} />
        <circle cx="24" cy="38.5" r="1" fill={INK} />
      </>
    ),
  },
  {
    name: 'Mistilteinn á beltinu',
    cheeky: true,
    bg: GOLD,
    art: (
      <>
        {/* Hung exactly where Santa wanted it */}
        <ellipse cx="24" cy="26" rx="18" ry="16" fill={RED} />
        <path d="M6.5 21 Q24 27 41.5 21 L41.8 27 Q24 33 6.2 27 Z" fill={INK} />
        <rect x="19.5" y="21" width="9" height="9" rx="1.5" fill={GOLD} />
        <rect x="22" y="23.5" width="4" height="4" rx="0.8" fill={INK} />
        <path d="M6 37 Q24 44 42 37" stroke={CREAM} strokeWidth="3" fill="none" />
        <path d="M24 30 V31" stroke={DARK_GREEN} strokeWidth="1.3" />
        <path d="M24 31 C19 28, 15 31, 16 34 C19 35, 22 34, 24 31 Z" fill={GREEN} />
        <path d="M24 31 C29 28, 33 31, 32 34 C29 35, 26 34, 24 31 Z" fill={DARK_GREEN} />
        <circle cx="22.5" cy="33" r="1.7" fill={CREAM} />
        <circle cx="25.5" cy="33" r="1.7" fill={CREAM} />
        <circle cx="24" cy="35" r="1.7" fill={CREAM} />
        <path d="M36 9 l0.8 2 2 0.8 -2 0.8 -0.8 2 -0.8 -2 -2 -0.8 2 -0.8 Z" fill={CREAM} />
      </>
    ),
  },
  {
    name: 'Sveinki á brókinni',
    cheeky: true,
    bg: SKY,
    art: (
      <>
        {/* Off duty: hat, beard, heart boxers, nothing else */}
        <rect x="17" y="36" width="5" height="7" rx="2" fill={SKIN} />
        <rect x="26" y="36" width="5" height="7" rx="2" fill={SKIN} />
        <ellipse cx="24" cy="28" rx="11" ry="9" fill={SKIN} />
        <path d="M13 31 H35 V37 C35 39, 31 39.5, 28 38 L24 36 L20 38 C17 39.5, 13 39, 13 37 Z" fill={RED} />
        <path d="M17 34 c0 -1 -1.5 -1 -1.5 0 c0 0.8 1.5 1.8 1.5 1.8 c0 0 1.5 -1 1.5 -1.8 c0 -1 -1.5 -1 -1.5 0 Z M24 33 c0 -1 -1.5 -1 -1.5 0 c0 0.8 1.5 1.8 1.5 1.8 c0 0 1.5 -1 1.5 -1.8 c0 -1 -1.5 -1 -1.5 0 Z M31 34 c0 -1 -1.5 -1 -1.5 0 c0 0.8 1.5 1.8 1.5 1.8 c0 0 1.5 -1 1.5 -1.8 c0 -1 -1.5 -1 -1.5 0 Z" fill={CREAM} />
        <path d="M22.5 27.5 q1.5 1.3 3 0" stroke="#C98D6A" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="12" r="6" fill={SKIN} />
        <path d="M17.5 14 C17.5 23, 30.5 23, 30.5 14 C27.5 17, 20.5 17, 17.5 14 Z" fill={CREAM} />
        <path d="M17 8.5 C17.5 2, 30 1, 31 8.5 Z" fill={RED} />
        <path d="M27.5 2.8 C30.5 1.2, 34 2.5, 34.5 5.8 L31 7 Z" fill={RED} />
        <circle cx="34.5" cy="6.2" r="2.3" fill={CREAM} />
        <rect x="16.5" y="7.5" width="15" height="3.2" rx="1.6" fill={CREAM} />
        <circle cx="21.8" cy="12.8" r="0.9" fill={INK} />
        <circle cx="26.2" cy="12.8" r="0.9" fill={INK} />
        <rect x="16" y="42" width="7" height="3" rx="1.5" fill={CREAM} />
        <rect x="25" y="42" width="7" height="3" rx="1.5" fill={CREAM} />
      </>
    ),
  },
]

export const CHRISTMAS_AVATAR_COUNT = SPRITES.length

const CHEEKY = SPRITES.map((sprite, i) => (sprite.cheeky ? i : -1)).filter(i => i >= 0)
const CLASSIC = SPRITES.map((sprite, i) => (sprite.cheeky ? -1 : i)).filter(i => i >= 0)
// Share of participants who land on a cheeky sprite
const CHEEKY_SHARE = 0.8

/**
 * Stable "random" pick: the same participant always gets the same sprite, on every screen.
 * One part of the hash picks the pool (mostly cheeky), the rest picks within it.
 */
export function avatarIndexFor(seed: string): number {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const h = hash >>> 0
  const pool = h % 100 < CHEEKY_SHARE * 100 ? CHEEKY : CLASSIC
  return pool[Math.floor(h / 100) % pool.length]
}

/** A participant's festive avatar; seed with their participant id so it never changes mid-tasting */
export function ChristmasAvatar({ seed, className }: { seed: string; className?: string }) {
  const sprite = SPRITES[avatarIndexFor(seed)]
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={sprite.name}>
      <circle cx="24" cy="24" r="24" fill={sprite.bg} />
      {sprite.art}
    </svg>
  )
}

/**
 * Whether a stored image is a real photo (e.g. from Google sign-in). Clerk's generated
 * placeholders encode {"type":"default",…} in the path; older rows stored those too.
 */
export function isRealPhoto(imageUrl: string | null | undefined): imageUrl is string {
  if (!imageUrl) return false
  try {
    const url = new URL(imageUrl)
    if (url.hostname !== 'img.clerk.com') return true
    const encoded = url.pathname.split('/').pop() ?? ''
    const decoded = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded?.type !== 'default'
  } catch {
    return true
  }
}

/** The person's own photo when they signed in with one, otherwise their Christmas sprite */
export function ParticipantAvatar({ seed, imageUrl, className }: { seed: string; imageUrl?: string | null; className?: string }) {
  if (isRealPhoto(imageUrl)) {
    // eslint-disable-next-line @next/next/no-img-element -- Clerk/Google avatar hosts aren't in images.remotePatterns
    return <img src={imageUrl} alt="" referrerPolicy="no-referrer" className={`rounded-full object-cover ${className ?? ''}`} />
  }
  return <ChristmasAvatar seed={seed} className={className} />
}

/** Every sprite, for previewing the set */
export function ChristmasAvatarSheet({ className }: { className?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {SPRITES.map(sprite => (
        <svg key={sprite.name} viewBox="0 0 48 48" className={className} role="img" aria-label={sprite.name}>
          <circle cx="24" cy="24" r="24" fill={sprite.bg} />
          {sprite.art}
        </svg>
      ))}
    </div>
  )
}
