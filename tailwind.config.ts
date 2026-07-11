// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Surface scale
        surface: {
          DEFAULT:  '#f7f9fb',
          dim:      '#d8dadc',
          bright:   '#f7f9fb',
          lowest:   '#ffffff',
          low:      '#f2f4f6',
          container:'#eceef0',
          high:     '#e6e8ea',
          highest:  '#e0e3e5',
          variant:  '#e0e3e5',
          tint:     '#0054d6',
        },
        'on-surface':         '#191c1e',
        'on-surface-variant': '#424656',
        'inverse-surface':    '#2d3133',
        'inverse-on-surface': '#eff1f3',

        outline: {
          DEFAULT: '#727687',
          variant: '#c2c6d8',
        },

        // IBCC ribbon palette — all five colors as first-class, equal tokens
        ribbon: {
          blue:   '#3d7fbf',
          red:    '#c0395a',
          amber:  '#e8a33d',
          teal:   '#3dae8c',
          purple: '#b05fa8',
        },

        // primary kept as blue (nav/links/forms — the "structural" color)
        primary: {
          DEFAULT:        '#5b9bdb',
          container:      '#3d7fbf',
          fixed:          '#d6e8fa',
          'fixed-dim':    '#aed0f0',
          inverse:        '#aed0f0',
          'on':           '#ffffff',
          'on-container': '#f8fbff',
          'on-fixed':     '#0c2c47',
          'on-fixed-variant': '#1f578c',
        },

        // secondary = ribbon teal
        secondary: {
          DEFAULT:        '#3dae8c',
          container:      '#2e8a6e',
          fixed:          '#d3efe5',
          'fixed-dim':    '#a3dac6',
          'on':           '#ffffff',
          'on-container': '#0c3a2c',
          'on-fixed':     '#08251c',
          'on-fixed-variant': '#1f6750',
        },

        // tertiary = ribbon purple
        tertiary: {
          DEFAULT:        '#b05fa8',
          container:      '#934a8c',
          fixed:          '#f3dcef',
          'fixed-dim':    '#e2b3da',
          'on':           '#ffffff',
          'on-container': '#3a1f37',
          'on-fixed':     '#2c1729',
          'on-fixed-variant': '#7a4073',
        },

        // accent = ribbon amber/gold (warnings, highlights, callouts)
        accent: {
          DEFAULT:        '#e8a33d',
          container:      '#c4842a',
          fixed:          '#fbe8cc',
          'on':           '#1f1402',
          'on-container': '#fffaf0',
        },

        // error = ribbon red (kept semantically as error/destructive)
        error: {
          DEFAULT:        '#c0395a',
          container:      '#fbdbe2',
          'on':           '#ffffff',
          'on-container': '#5c1426',
        },

        background: '#f7f9fb',
        'on-background': '#191c1e',
      },

      fontFamily: {
        sans:    ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },

      fontSize: {
        'headline-lg':        ['28px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-md':        ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'body-lg':            ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md':            ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-bold':         ['12px', { lineHeight: '16px', fontWeight: '700' }],
      },

      borderRadius: {
        sm:      '0.25rem',
        DEFAULT: '0.5rem',
        md:      '0.75rem',
        lg:      '1rem',
        xl:      '1.5rem',
        full:    '9999px',
      },

      spacing: {
        frame:   '1.5rem',
        sidebar: '260px',
        gutter:  '1.25rem',
        island:  '1.5rem',
      },

      width:    { sidebar: '260px' },
      maxWidth: { sidebar: '260px' },

      boxShadow: {
        island:        '0px 10px 30px rgba(61, 127, 191, 0.08)',
        'island-active':'0px 4px 16px rgba(61, 127, 191, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        glass:         '0 8px 32px rgba(61, 127, 191, 0.1)',
      },

      backdropBlur: { glass: '20px' },

      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #5b9bdb 0%, #3d7fbf 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #1f578c 0%, #3d7fbf 100%)',
        'content-wash':     'linear-gradient(160deg, #ffffff 0%, #eaf2fb 100%)',
        'frame-gradient':   'linear-gradient(135deg, #3d7fbf 0%, #3dae8c 25%, #e8a33d 50%, #b05fa8 75%, #c0395a 100%)',
        'island-header':    'linear-gradient(90deg, #eef5fc 0%, #e3eefb 100%)',
        'chart-fill':        'linear-gradient(180deg, rgba(61, 127, 191, 0.18) 0%, rgba(61, 127, 191, 0) 100%)',
        'chart-fill-blue':   'linear-gradient(180deg, rgba(61, 127, 191, 0.18) 0%, rgba(61, 127, 191, 0) 100%)',
        'chart-fill-teal':   'linear-gradient(180deg, rgba(61, 174, 140, 0.18) 0%, rgba(61, 174, 140, 0) 100%)',
        'chart-fill-amber':  'linear-gradient(180deg, rgba(232, 163, 61, 0.18) 0%, rgba(232, 163, 61, 0) 100%)',
        'chart-fill-purple': 'linear-gradient(180deg, rgba(176, 95, 168, 0.18) 0%, rgba(176, 95, 168, 0) 100%)',
        'chart-fill-red':    'linear-gradient(180deg, rgba(192, 57, 90, 0.18) 0%, rgba(192, 57, 90, 0) 100%)',
      },

      gridTemplateColumns: {
        '12': 'repeat(12, minmax(0, 1fr))',
        '6':  'repeat(6, minmax(0, 1fr))',
      },

      keyframes: {
        'island-in': {
          '0%':   { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'progress-indeterminate': {
          '0%':   { transform: 'translateX(-100%) scaleX(0.4)' },
          '50%':  { transform: 'translateX(0%) scaleX(0.6)' },
          '100%': { transform: 'translateX(100%) scaleX(0.4)' },
        },
      },

      animation: {
        'island-in': 'island-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in':   'fade-in 0.2s ease both',
        'slide-in':  'slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer:     'shimmer 1.6s ease-in-out infinite',
        'progress-indeterminate': 'progress-indeterminate 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config