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
    },
  },
  plugins: [],
}
