export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#d4a843',
        'gold-dim': '#7a5f25',
        surface: '#111111',
        surface2: '#181818',
        dim: '#888880',
        faint: '#444440',
        border: '#252525',
        border2: '#333333',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      }
    }
  },
  plugins: []
}