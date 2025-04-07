/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7fa',
          100: '#cceff5',
          200: '#99dfeb',
          300: '#66cfe0',
          400: '#33bfd6',
          500: '#00afcc',
          600: '#008ca3',
          700: '#00697a',
          800: '#004652',
          900: '#002329',
        },
        secondary: {
          50: '#f0f9e8',
          100: '#e0f3d1',
          200: '#c2e7a3',
          300: '#a3db75',
          400: '#85cf47',
          500: '#66c319',
          600: '#529c14',
          700: '#3d750f',
          800: '#294e0a',
          900: '#142705',
        },
        accent: {
          50: '#fff8e6',
          100: '#fff1cc',
          200: '#ffe399',
          300: '#ffd666',
          400: '#ffc833',
          500: '#ffba00',
          600: '#cc9500',
          700: '#997000',
          800: '#664a00',
          900: '#332500',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // BDG2 dataset color scheme (for consistency in data visualization)
        bdg2: {
          electricity: '#4361ee',
          gas: '#f72585',
          water: '#4cc9f0',
          steam: '#ff9e00',
          hotwater: '#ef233c',
          chilledwater: '#3a86ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        // Special shadow for cards that display energy data
        energy: '0 4px 12px rgba(0, 175, 204, 0.15)',
      },
      borderRadius: {
        card: '0.75rem',
        button: '0.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
} 