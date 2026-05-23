// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",     // ✅ สำหรับ Next.js Pages Router
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",       // ✅ สำหรับ App Router (กันพลาด)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
