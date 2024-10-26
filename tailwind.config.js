/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          light: 'rgb(var(--primary) / 0.1)',
          dark: 'rgb(var(--primary) / 1.2)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          light: 'rgb(var(--secondary) / 0.1)',
          dark: 'rgb(var(--secondary) / 1.2)',
        },
        success: {
          DEFAULT: 'rgb(var(--success))',
          light: 'rgb(var(--success) / 0.1)',
          dark: 'rgb(var(--success) / 1.2)',
        },
        error: {
          DEFAULT: 'rgb(var(--error))',
          light: 'rgb(var(--error) / 0.1)',
          dark: 'rgb(var(--error) / 1.2)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning))',
          light: 'rgb(var(--warning) / 0.1)',
          dark: 'rgb(var(--warning) / 1.2)',
        },
        info: {
          DEFAULT: 'rgb(var(--info))',
          light: 'rgb(var(--info) / 0.1)',
          dark: 'rgb(var(--info) / 1.2)',
        },
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'full': 'var(--radius-full)',
      },
      keyframes: {
        slideDown: {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        slideUp: {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        slideDown: 'slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        slideUp: 'slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)',
      },
    },
  },
  plugins: [],
}