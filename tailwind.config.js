/** @type {import('tailwindcss').Config} */
module.exports = {
  // This is the crucial line:
  // It tells Tailwind to activate dark mode based on a class name.
  darkMode: 'class',
  
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans your source files for Tailwind classes
  ],
  theme: {
    extend: {
        // You can add custom animations here if you like
        animation: {
            'fade-in': 'fadeIn 0.5s ease-in-out',
        },
        keyframes: {
            fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
            },
        },
    },
  },
  plugins: [],
}
