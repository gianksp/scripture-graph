export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand accents
        gold: '#d4a843',
        ot: '#7ab8f5',  // Old Testament blue
        nt: '#7dd4a0',  // New Testament green

        // Backgrounds
        canvas: { DEFAULT: '#f7f7f7', dark: '#080808' },
        panel: { DEFAULT: '#ffffff', dark: '#0a0a0a' },
        surface: { DEFAULT: '#f0f0f0', dark: '#0f0f0f' },
        elevated: { DEFAULT: '#e8e8e8', dark: '#161616' },

        // Borders
        hairline: { DEFAULT: '#d8d8d8', dark: '#1a1a1a' },
        subtle: { DEFAULT: '#cccccc', dark: '#222222' },

        // Text
        primary: { DEFAULT: '#111111', dark: '#eeeeee' },
        secondary: { DEFAULT: '#444444', dark: '#cccccc' },
        tertiary: { DEFAULT: '#777777', dark: '#aaaaaa' },
        placeholder: { DEFAULT: '#ffffff', dark: '#444444' },
        ghost: { DEFAULT: '#eeeeee', dark: '#2a2a2a' },

        // Interactive
        interactive: { DEFAULT: '#555555', dark: '#555555' },
      },
      fontFamily: {
        mono: ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['9px', { lineHeight: '1.4' }],
        xs: ['10px', { lineHeight: '1.5' }],
        sm: ['11px', { lineHeight: '1.5' }],
        base: ['12px', { lineHeight: '1.6' }],
        md: ['13px', { lineHeight: '1.6' }],
        lg: ['15px', { lineHeight: '1.4' }],
        xl: ['17px', { lineHeight: '1.3' }],
      },
    },
  },
  plugins: [],
}