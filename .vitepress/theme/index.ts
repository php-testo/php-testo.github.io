import { h } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogSponsor from './BlogSponsor.vue'
import GitHubStars from './GitHubStars.vue'
import CodeTabs from './CodeTabs.vue'
import JetBrainsPluginButton from './JetBrainsPluginButton.vue'
import BlogPosts from './BlogPosts.vue'
import BlogPostHeader from './BlogPostHeader.vue'
import { isBlogPath } from '../locales'
import './style.css'

function isBlogPost() {
  const route = useRoute()
  return isBlogPath(route.path)
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => isBlogPost() ? h(BlogPostHeader) : null,
      'doc-after': () => h(BlogSponsor),
      'nav-bar-content-after': () => h(GitHubStars),
    })
  },
  enhanceApp({ app }) {
    app.component('CodeTabs', CodeTabs)
    app.component('JetBrainsPluginButton', JetBrainsPluginButton)
    app.component('BlogPosts', BlogPosts)
  },
} satisfies Theme
