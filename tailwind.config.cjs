const clinicConfig = require('./src/config/clinic.json')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: clinicConfig.theme.border,
        primary: {
          DEFAULT: clinicConfig.theme.primary,
          hover: clinicConfig.theme.primaryHover,
        },
        highlight: {
          DEFAULT: clinicConfig.theme.secondary,
          hover: clinicConfig.theme.secondaryHover,
        },
        accent: clinicConfig.theme.accent,
        success: clinicConfig.theme.success,
        warning: clinicConfig.theme.warning,
        error: clinicConfig.theme.error,
        background: clinicConfig.theme.background,
        card: clinicConfig.theme.card,
        text: {
          primary: clinicConfig.theme.textPrimary,
          secondary: clinicConfig.theme.textSecondary,
        },
      },
      boxShadow: {
        'elevation-low': '0 1px 2px 0 rgba(16, 24, 40, 0.05), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        'elevation-md': '0 4px 12px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        'elevation-high': '0 12px 28px -6px rgba(16, 24, 40, 0.16), 0 6px 12px -4px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
}
