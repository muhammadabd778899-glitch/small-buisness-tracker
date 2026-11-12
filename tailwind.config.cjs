/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "0.5rem",
        sm: "1rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        border: "0.5rem solid #ECE9E6",
        input: "#ECE9E6",
        ring: "#F26A2C",
        background: "#FAF9F7",
        foreground: "#292929",
        primary: "#F26A2C",
        "primary-dark": "#D9531E",
        "soft-orange": "#FFF0E8",
        "pale-orange": "#FFF8F4",
        secondary: "#777777",
        success: "#299D68",
        warning: "#E5A12C",
        danger: "#D9534F",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}