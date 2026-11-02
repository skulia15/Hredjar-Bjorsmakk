/** Beer mug wearing a Santa hat — the app's mascot. */
export function SantaMug({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 132 140" className={className} role="img" aria-label="Bjórkrús með jólasveinahúfu">
      <rect x="20" y="52" width="72" height="80" rx="12" fill="#F2A93B" />
      <rect x="30" y="66" width="8" height="52" rx="4" fill="#FFD08A" />
      <path d="M92 68h12a14 14 0 0 1 14 14v20a14 14 0 0 1-14 14H92" fill="none" stroke="#F2A93B" strokeWidth="10" />
      <circle cx="28" cy="54" r="13" fill="#FBF6EA" />
      <circle cx="47" cy="48" r="15" fill="#FBF6EA" />
      <circle cx="68" cy="50" r="14" fill="#FBF6EA" />
      <circle cx="86" cy="55" r="11" fill="#FBF6EA" />
      <path d="M34 44 C 40 14, 78 4, 104 22 L 92 30 C 80 24, 62 26, 74 42 Z" fill="#C8323A" />
      <rect x="30" y="38" width="50" height="12" rx="6" fill="#FBF6EA" />
      <circle cx="106" cy="22" r="8" fill="#FBF6EA" />
    </svg>
  )
}
