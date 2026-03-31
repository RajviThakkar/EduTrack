/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        edu: {
          navy: '#215D87',
          teal: '#2FA4A9',
          blue: '#4E98A2',
          sage: '#98B196',
          sand: '#DBD8A0',
          mint: '#6BCF8E',
          bg: '#f6fbfc',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(33, 93, 135, 0.08)',
      },
      borderRadius: {
        soft: '1rem',
      },
    },
  },
  plugins: [],
}

