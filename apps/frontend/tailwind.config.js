/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6600', // Orange
          50: '#FFF5F0',
          100: '#FFEBE0',
          500: '#F95700',
          600: '#FF6600',
          700: '#E05300',
        },
        accent: {
          DEFAULT: '#FF6600', // Orange
          50: '#FFF5F0',
          100: '#FFEBE0',
          500: '#F95700',
          600: '#FF6600',
        },
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: '#FFFFFF',
        canvas: '#FFFFFF',
        border: '#E5E7EB',
        ink: {
          DEFAULT: '#111111', // Black
          muted: '#666666',   // Gray
        },
        // Strict Color System Enforcement
        orange: {
          primary: '#FF6600',
          vibrant: '#F95700',
        },
        black: {
          DEFAULT: '#111111',
          pure: '#000000',
        },
        charcoal: {
          DEFAULT: '#1A1A1A',
        },
        gray: {
          muted: '#666666',
          light: '#999999',
          border: '#E5E7EB',
        },
        // Stitch design token overrides
        "inverse-primary": "#ffb596",
        "on-tertiary-fixed-variant": "#474646",
        "surface-container": "#efeded",
        "surface-container-lowest": "#ffffff",
        "on-secondary": "#ffffff",
        "outline": "#666666",
        "tertiary-fixed": "#e5e2e1",
        "outline-variant": "#e5e7eb",
        "on-surface-variant": "#666666",
        "on-primary": "#ffffff",
        "secondary": "#F95700",
        "secondary-container": "#FF6600",
        "inverse-on-surface": "#f2f0f0",
        "on-secondary-fixed-variant": "#812900",
        "on-tertiary": "#ffffff",
        "on-background": "#111111",
        "on-tertiary-container": "#2f2f2f",
        "surface-bright": "#ffffff",
        "tertiary": "#666666",
        "on-surface": "#111111",
        "on-primary-fixed": "#360f00",
        "surface-tint": "#FF6600",
        "surface-dim": "#dbdad9",
        "secondary-fixed": "#ffdbcf",
        "on-error-container": "#93000a",
        "surface-container-high": "#e9e8e7",
        "error-container": "#ffdad6",
        "on-primary-fixed-variant": "#7c2e00",
        "on-secondary-fixed": "#380d00",
        "primary-fixed-dim": "#ffb596",
        "surface-variant": "#e4e2e2",
        "secondary-fixed-dim": "#ffb59b",
        "primary-container": "#FF6600",
        "surface-container-highest": "#e4e2e2",
        "surface-container-low": "#f5f3f3",
        "background": "#ffffff",
        "error": "#ba1a1a",
        "primary-fixed": "#ffdbcd",
        "on-secondary-container": "#501600",
        "on-primary-container": "#ffffff",
        "tertiary-fixed-dim": "#c8c6c5",
        "tertiary-container": "#989696",
        "on-error": "#ffffff",
        "on-tertiary-fixed": "#1c1b1b",
        "inverse-surface": "#111111"
      },
      spacing: {
        "stack-md": "24px",
        "stack-sm": "12px",
        "gutter": "32px",
        "margin-page": "64px",
        "container-max": "1280px",
        "stack-lg": "48px",
        "margin-mobile": "24px",
        "section-gap": "120px",
        "unit": "8px"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        "headline-lg": ["Plus Jakarta Sans"],
        "headline-xl": ["Plus Jakarta Sans"],
        "display-lg": ["Plus Jakarta Sans"],
        "body-lg": ["Inter"],
        "display-lg-mobile": ["Plus Jakarta Sans"],
        "ui-mono": ["Inter"],
        "label-bold": ["Inter"],
        "body-md": ["Inter"]
      },
      fontSize: {
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "display-lg": ["72px", { "lineHeight": "80px", "letterSpacing": "-0.04em", "fontWeight": "800" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "display-lg-mobile": ["48px", { "lineHeight": "52px", "letterSpacing": "-0.03em", "fontWeight": "800" }],
        "ui-mono": ["13px", { "lineHeight": "16px", "fontWeight": "500" }],
        "label-bold": ["14px", { "lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "600" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
      },
      borderRadius: {
        card: '12px',
        control: '8px',
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(17, 24, 39, 0.04)',
        hover: '0 4px 12px 0 rgba(17, 24, 39, 0.08)',
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
