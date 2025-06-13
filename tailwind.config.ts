import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',  // Mindent a src mappában
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
