import type { Config } from "tailwindcss"
import colors from "tailwindcss/colors"
import tailwindcssAnimate from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      textColor: {
        primary: {
          DEFAULT: "hsl(var(--primary-ink))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
      // Heading sizes follow the reader's font setting but are capped by screen width, so a long
      // Icelandic word can't outgrow a phone. Body sizes (xl and below) are never capped.
      fontSize: {
        "2xl": ["min(1.5rem, 9vw)", { lineHeight: "1.2" }],
        "3xl": ["min(1.875rem, 10vw)", { lineHeight: "1.15" }],
        "4xl": ["min(2.25rem, 11vw)", { lineHeight: "1.1" }],
        "5xl": ["min(3rem, 12vw)", { lineHeight: "1" }],
        "6xl": ["min(3.75rem, 14vw)", { lineHeight: "1" }],
        "7xl": ["min(4.5rem, 16vw)", { lineHeight: "1" }],
        "8xl": ["min(6rem, 18vw)", { lineHeight: "1" }],
        "9xl": ["min(8rem, 20vw)", { lineHeight: "1" }],
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        pine: { DEFAULT: "#123A2C", light: "#1A4A39", deep: "#0C2B20", line: "#2F6150" },
        cream: { DEFAULT: "#FBF6EA", dim: "#F1E8D3", line: "#EADFC6" },
        ink: { DEFAULT: "#1E1B16", soft: "#5E574A" },
        mint: "#CFE0D3",
        cranberry: "#C8323A",
        gold: { DEFAULT: "#F2A93B", soft: "#F6E3BC" },
        holly: { DEFAULT: "#1E6B4F", soft: "#DDEFE3" },
        // Status shades used as text on cream cards, darkened to pass 4.5:1 there
        green: { ...colors.green, 600: "#1E6B4F", 700: "#17543E" },
        red: { ...colors.red, 600: "#B42A31", 700: "#9A2329" },
        orange: { ...colors.orange, 600: "#A84A0C" },
        blue: { ...colors.blue, 600: "#1D4ED8" },
        yellow: { ...colors.yellow, 600: "#7A5A00" },
        purple: { ...colors.purple, 600: "#7E22CE" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config

export default config
