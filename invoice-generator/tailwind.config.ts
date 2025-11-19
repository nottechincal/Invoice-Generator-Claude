import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Enterprise Brand Colors (from UI/UX spec)
        brand: {
          primary: '#2563EB',     // Blue-600
          dark: '#1E40AF',        // Blue-700
          light: '#DBEAFE',       // Blue-100
        },
        // Status Colors
        success: {
          DEFAULT: '#10B981',     // Green-500
          light: '#D1FAE5',       // Green-100
        },
        warning: {
          DEFAULT: '#F59E0B',     // Amber-500
          light: '#FEF3C7',       // Amber-100
        },
        error: {
          DEFAULT: '#EF4444',     // Red-500
          light: '#FEE2E2',       // Red-100
        },
        info: {
          DEFAULT: '#3B82F6',     // Blue-500
          light: '#DBEAFE',       // Blue-100
        },
        // Invoice Status Colors
        status: {
          draft: '#6B7280',       // Gray-500
          sent: '#3B82F6',        // Blue-500
          viewed: '#8B5CF6',      // Purple-500
          partial: '#F59E0B',     // Amber-500
          paid: '#10B981',        // Green-500
          overdue: '#EF4444',     // Red-500
          void: '#6B7280',        // Gray-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        // Enterprise Typography Scale
        'display': ['48px', { lineHeight: '56px', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['30px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h5': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'h6': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'body-large': ['18px', { lineHeight: '28px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'body-small': ['14px', { lineHeight: '20px' }],
        'caption': ['12px', { lineHeight: '16px' }],
      },
      spacing: {
        // 8px Grid System
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },
      borderRadius: {
        'invoice': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
