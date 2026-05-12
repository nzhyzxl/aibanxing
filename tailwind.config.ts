import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 爱伴行品牌色
        cream: '#FDFAF5',
        amber: {
          brand: '#F5A623',
          light: '#FEF6E9',
          dark: '#854F0B',
        },
        warm: {
          charcoal: '#2C2420',
          gray: '#9E9189',
          border: '#E8DDD4',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Source Sans Pro', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        pill: '99px',
      },
    },
  },
  plugins: [],
}

export default config
