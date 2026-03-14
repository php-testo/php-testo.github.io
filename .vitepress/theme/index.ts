import { computed, defineComponent, h, provide } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogSponsor from './BlogSponsor.vue'
import GitHubStars from './GitHubStars.vue'
import CodeTabs from './CodeTabs.vue'
import JetBrainsPluginButton from './JetBrainsPluginButton.vue'
import JetBrainsPlugin from './JetBrainsPlugin.vue'
import BlogPosts from './BlogPosts.vue'
import BlogPostHeader from './BlogPostHeader.vue'
import { isBlogPath, getBlogBackLink, localNavBackKey } from '../locales'
import './style.css'

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
  enhanceApp({ app }) {
    app.component('CodeTabs', CodeTabs)
    app.component('JetBrainsPluginButton', JetBrainsPluginButton)
    app.component('JetBrainsPlugin', JetBrainsPlugin)
    app.component('BlogPosts', BlogPosts)
  },
} satisfies Theme
