import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#0B0D12',
          secondary: '#11151D',
          sidebar: '#0E1219',
          panel: '#151B25',
          elevated: '#1A2230',
        },
        border: {
          subtle: '#283244',
          DEFAULT: '#283244',
          highlight: '#3B4861',
        },
        text: {
          primary: '#E8EDF5',
          secondary: '#929EB0',
          muted: '#627187',
        },
        accent: {
          blue: '#4C8DFF',
          cyan: '#36C5E8',
          purple: '#9A78FF',
          green: '#35C98A',
          amber: '#F1B85B',
          red: '#EF6464',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
