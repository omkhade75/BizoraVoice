/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-canvas)",
        foreground: "var(--text-primary)",
        obsidian: {
          canvas: "var(--bg-canvas)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
          hover: "var(--bg-surface-hover)",
        },
        sonic: {
          amber: "var(--accent-amber)",
          "amber-hover": "var(--accent-amber-hover)",
          "amber-subtle": "var(--accent-amber-subtle)",
          "amber-glow": "var(--accent-amber-glow)",
          active: "var(--status-active)",
          warning: "var(--status-warning)",
          error: "var(--status-error)",
          info: "var(--status-info)",
        },
        border: {
          subtle: "var(--border-subtle)",
          medium: "var(--border-medium)",
          strong: "var(--border-strong)",
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Geist Mono',
          'Fira Code',
          'monospace',
        ],
      },
      boxShadow: {
        'glow-amber': '0 0 24px -4px rgba(230, 154, 72, 0.25)',
        'glow-subtle': '0 0 16px -2px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'sonic-pulse': 'sonicPulse 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        sonicPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.04)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
