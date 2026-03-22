import { computed, defineComponent, h, provide } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogSponsor from './BlogSponsor.vue'
import GitHubStars from './GitHubStars.vue'
import CodeTabs from './CodeTabs.vue'
import HomeBench from './HomeBench.vue'
import JetBrainsPluginButton from './JetBrainsPluginButton.vue'
import JetBrainsPlugin from './JetBrainsPlugin.vue'
import BlogPosts from './BlogPosts.vue'
import BlogPostHeader from './BlogPostHeader.vue'
import { isBlogPath, getBlogBackLink, localNavBackKey } from '../locales'
import './style.css'

function setupFuncRefTooltips() {
  document.addEventListener('mouseenter', (e) => {
    const ref = (e.target as Element).closest?.('.func-ref')
    if (!ref) return

    const tip = ref.querySelector('.func-ref-tooltip') as HTMLElement
    if (!tip) return

    const rect = ref.getBoundingClientRect()
    const gap = 8

    // Reset and show with default max-width for measuring
    tip.style.left = '0'
    tip.style.top = '0'
    tip.style.maxWidth = ''
    tip.classList.add('is-visible')

    // If signature overflows at 480px, expand to fit it
    const sig = tip.querySelector('.func-ref-tooltip-sig') as HTMLElement
    if (sig && sig.scrollWidth > sig.clientWidth) {
      const needed = sig.scrollWidth + 28  // 14px padding * 2
      tip.style.maxWidth = Math.min(needed, window.innerWidth - 16) + 'px'
    }

    // Measure tooltip after adjustment
    const tipRect = tip.getBoundingClientRect()

    // Vertical: above if fits, below otherwise
    let top = rect.top - tipRect.height - gap
    if (top < 0) top = rect.bottom + gap
    tip.style.top = top + 'px'

    // Horizontal: center on the func element, clamp to viewport
    const refCenter = rect.left + rect.width / 2
    let left = refCenter - tipRect.width / 2
    if (left + tipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tipRect.width - 8
    }
    if (left < 8) left = 8
    tip.style.left = left + 'px'
  }, true)

  document.addEventListener('mouseleave', (e) => {
    const ref = (e.target as Element).closest?.('.func-ref')
    if (!ref) return

    const tip = ref.querySelector('.func-ref-tooltip') as HTMLElement
    if (tip) tip.classList.remove('is-visible')
  }, true)
}

export default {
  extends: DefaultTheme,
  Layout: defineComponent({
    setup() {
      const route = useRoute()

      const isBlog = computed(() => isBlogPath(route.path))

      provide(localNavBackKey, computed(() => getBlogBackLink(route.path)))

      return () => h(DefaultTheme.Layout, null, {
        'doc-before': () => isBlog.value ? h(BlogPostHeader) : null,
        'doc-after': () => h(BlogSponsor),
        'nav-bar-content-after': () => h(GitHubStars),
      })
    },
  }),
  enhanceApp({ app, router }) {
    app.component('CodeTabs', CodeTabs)
    app.component('HomeBench', HomeBench)
    app.component('JetBrainsPluginButton', JetBrainsPluginButton)
    app.component('JetBrainsPlugin', JetBrainsPlugin)
    app.component('BlogPosts', BlogPosts)

    if (typeof window !== 'undefined') {
      setupFuncRefTooltips()
    }
  },
} satisfies Theme
