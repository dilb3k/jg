/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        'theme-bg': '#EBF1F6',
        'theme-surface': '#ffffff',
        'theme-text': '#0f172a',
        'theme-text-secondary': '#64748b',
        'theme-text-tertiary': '#94a3b8',
        'theme-border': '#e2e8f0',
        'theme-primary': '#7C3AED',
        'theme-secondary': '#10b981',
        'theme-danger': '#ef4444',
        'theme-warning': '#f59e0b',
        'theme-success': '#22c55e',
      },
    },
  },
  plugins: [],
}
