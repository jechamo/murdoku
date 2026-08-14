/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta noir: papel envejecido sobre tinta, con la sangre como único acento cálido.
        tinta: {
          950: '#0b0b0d',
          900: '#121216',
          800: '#1b1b21',
          700: '#26262e',
          600: '#33333d',
          500: '#4a4a57',
        },
        papel: {
          100: '#f4efe4',
          200: '#e6dfd0',
          300: '#d3c9b4',
          400: '#b3a68c',
        },
        sangre: {
          400: '#e0524a',
          500: '#c62f26',
          600: '#9d201a',
        },
        ambar: {
          400: '#f0b95c',
          500: '#d99a2b',
        },
      },
      fontFamily: {
        titular: ['"Playfair Display"', 'Georgia', 'serif'],
        maquina: ['"Courier Prime"', '"Courier New"', 'monospace'],
        cuerpo: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        ficha: '0 10px 30px -12px rgba(0,0,0,0.85)',
        foco: '0 0 0 2px rgba(240,185,92,0.9), 0 0 24px -4px rgba(240,185,92,0.55)',
      },
      keyframes: {
        tachar: {
          from: { transform: 'scaleX(0)', opacity: '0' },
          to: { transform: 'scaleX(1)', opacity: '1' },
        },
        aparecer: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        latido: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        girar: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        colgar: {
          '0%, 100%': { transform: 'rotate(var(--giro)) translateY(0)' },
          '50%': { transform: 'rotate(var(--giro)) translateY(-6px)' },
        },
      },
      animation: {
        tachar: 'tachar 320ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        aparecer: 'aparecer 260ms ease-out both',
        latido: 'latido 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
