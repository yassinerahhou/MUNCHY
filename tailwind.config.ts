import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { cream: '#FAF7F2', espresso: '#141210', paprika: '#E63926', saffron: '#F4A226', ivory: '#F2ECE1' },
      fontFamily: { display: ['var(--font-display)'], body: ['var(--font-body)'] },
      boxShadow: { food: '0 20px 50px rgba(20,18,16,.12)' },
      transitionTimingFunction: { snap: 'cubic-bezier(.22,1,.36,1)' }
    }
  },
  plugins: []
};
export default config;
