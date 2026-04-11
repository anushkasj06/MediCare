/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary:  { DEFAULT: 'var(--pri)', light: 'var(--pri-l)', dark: 'var(--pri-d)', soft: 'var(--pri-soft)' },
        accent:   { DEFAULT: 'var(--acc)', light: 'var(--acc-l)', dark: 'var(--acc-d)', soft: 'var(--acc-soft)' },
        warning:  { DEFAULT: 'var(--warn)',    soft: 'var(--warn-soft)' },
        danger:   { DEFAULT: 'var(--danger)',  soft: 'var(--danger-soft)' },
        success:  { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        surface:  { DEFAULT: 'var(--card-bg)', 2: 'var(--bg3)', 3: 'var(--bg4)' },
        border:   { DEFAULT: 'var(--border)',  dark: 'var(--border-dark)' },
        text:     { DEFAULT: 'var(--text)',    muted: 'var(--text-muted)', light: 'var(--text-light)' },
      },
      boxShadow: {
        card:  'var(--card-shadow)',
        modal: '0 20px 60px rgba(15,76,129,0.18)',
        glow:  '0 0 24px var(--pri-glow)',
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem', '3xl': '2rem' },
      animation: {
        fadeUp:     'fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
        fadeIn:     'fadeIn 0.3s ease forwards',
        slideIn:    'slideIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards',
        pulse2:     'pulse2 2s ease infinite',
        shimmer:    'shimmer 1.6s linear infinite',
        float:      'float 3s ease-in-out infinite',
        'spin-slow':'spin-slow 8s linear infinite',
      },
    },
  },
  plugins: [],
}
