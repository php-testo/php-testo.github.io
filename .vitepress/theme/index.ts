import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogSponsor from './BlogSponsor.vue'
import GitHubStars from './GitHubStars.vue'
import CodeTabs from './CodeTabs.vue'
import JetBrainsPluginButton from './JetBrainsPluginButton.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(BlogSponsor),
      'nav-bar-content-after': () => h(GitHubStars),
    })
  },
  enhanceApp({ app }) {
    app.component('CodeTabs', CodeTabs)
    app.component('JetBrainsPluginButton', JetBrainsPluginButton)
  },
} satisfies Theme
