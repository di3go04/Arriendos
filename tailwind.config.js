/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rn: {
          900: '#060e1a',
          800: '#0b1a2e',
          700: '#0f2440',
          600: '#132e54',
        },
        accent: {
          DEFAULT: '#f0b90b',
          hover: '#e5a800',
        },
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        'gold': '0 4px 14px rgba(240,185,11,0.35)',
        'gold-lg': '0 6px 20px rgba(240,185,11,0.45)',
        'card': '0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 25px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'elevated': '0 16px 48px rgba(0,0,0,0.1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'shake': 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
