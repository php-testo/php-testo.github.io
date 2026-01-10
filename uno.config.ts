import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  shortcuts: {
    'brand-text': 'text-[var(--vp-c-brand-1)]',
  },
  theme: {
    breakpoints: {
      sm: '640px',
      md: '960px',
      lg: '1152px',
    },
  },
})
