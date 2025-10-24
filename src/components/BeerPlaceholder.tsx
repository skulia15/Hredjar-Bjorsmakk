export function BeerPlaceholder({ className = "h-32 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Beer bottle shape */}
      <g opacity="0.3">
        {/* Bottle neck */}
        <rect x="40" y="10" width="20" height="15" rx="2" fill="currentColor" />

        {/* Bottle body */}
        <path
          d="M35 25 L35 80 C35 85 40 90 45 90 L55 90 C60 90 65 85 65 80 L65 25 Z"
          fill="currentColor"
        />

        {/* Bottle cap */}
        <rect x="38" y="5" width="24" height="6" rx="1" fill="currentColor" />

        {/* Label area */}
        <rect x="37" y="45" width="26" height="20" rx="2" fill="currentColor" opacity="0.5" />
      </g>

      {/* Beer glass icon for variety */}
      <g opacity="0.2" transform="translate(15, 15)">
        <path
          d="M25 15 L30 60 C30 65 26 70 20 70 L10 70 C4 70 0 65 0 60 L5 15 Z"
          fill="currentColor"
        />
        <ellipse cx="15" cy="15" rx="12" ry="4" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  )
}
