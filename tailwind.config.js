export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold:    '#d4a843',
        ot:      '#7ab8f5',
        nt:      '#7dd4a0',
        ink:     '#080808',
        surface: '#0f0f0f',
        raised:  '#161616',
        border:  '#1e1e1e',
        dim:     '#555',
        muted:   '#333',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}