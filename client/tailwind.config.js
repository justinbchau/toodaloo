/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}",
    "./templates/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'bg': '#0B0B0F',
        'surface1': '#111118',
        'surface2': '#18181F',
        'surface3': '#1E1E28',
        'purple': '#7B6EF6',
        'purple-text': '#A99FF9',
        'text1': '#EEEEF4',
        'text2': '#8B8B9E',
        'text3': '#44444F',
        'success': '#34C77A',
        'warning': '#F5C542',
        'danger': '#F05A5A',
      },
      borderRadius: {
        'sm': 10,
        'md': 16,
        'lg': 22,
        'xl': 30,
      },
      fontFamily: {
        'jakarta': ['PlusJakartaSans_400Regular'],
        'jakarta-medium': ['PlusJakartaSans_500Medium'],
        'jakarta-semibold': ['PlusJakartaSans_600SemiBold'],
        'jakarta-bold': ['PlusJakartaSans_700Bold'],
        'jakarta-extrabold': ['PlusJakartaSans_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
