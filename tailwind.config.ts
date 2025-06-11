/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}', // Even if not using src, good to keep for flexibility
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
        'primary-light': '#85c1e9',
        'primary-dark': '#2980b9',
        success: '#2ecc71',
        warning: '#e67e22',
        error: '#e74c3c',
        background: '#ffffff', // Added from your description
        text: '#333333',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require('tailwindcss-animate')],
}
