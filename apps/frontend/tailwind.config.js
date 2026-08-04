/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        accent: {
          DEFAULT: '#10B981', // Emerald 500
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: '#FFFFFF',
        canvas: '#F9FAFB',
        border: '#E5E7EB',
        ink: {
          DEFAULT: '#111827', // primary text
          muted: '#6B7280',   // secondary text
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(17, 24, 39, 0.04)',
        hover: '0 4px 12px 0 rgba(17, 24, 39, 0.08)',
      },
    },
  },
  plugins: [],
}
