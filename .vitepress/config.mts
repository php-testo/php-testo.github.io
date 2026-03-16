import { fileURLToPath } from 'url'
import { defineConfig, HeadConfig } from 'vitepress'
import { generateRss, rssPlugin } from './rss'
import { generateLlms, llmsPlugin } from './llms'
import { isBlogPath } from './locales'
import { faqPlugin } from './faq'
import { infoBlockPlugin } from './info-block'

const baseUrl = 'https://php-testo.github.io'

export default defineConfig({
  title: 'Testo',
  description: 'Modern PHP Testing Framework',

  lastUpdated: false,
  cleanUrls: true,

  markdown: {
    config: (md) => {
      md.use(faqPlugin)
      md.use(infoBlockPlugin)
    },
  },
  srcExclude: ['CLAUDE.md', 'README.md'],
  ignoreDeadLinks: [/feed\.xml$/],

  vite: {
    plugins: [rssPlugin(), llmsPlugin()],
    resolve: {
      alias: [
        {
          find: /.*\/VPLocalNav\.vue$/,
          replacement: fileURLToPath(new URL('./theme/VPLocalNav.vue', import.meta.url)),
        },
      ],
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-VYGDN3X0PR' }],
    ['script', {}, `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-VYGDN3X0PR');`],
  ],

  buildEnd: async (config) => {
    await generateRss(config)
    await generateLlms(config)
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      head: [
        ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'Testo Blog', href: '/feed.xml' }],
      ],
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/docs/getting-started' },
          { text: 'Blog', link: '/blog/' },
        ],
        editLink: {
          pattern: 'https://github.com/php-testo/php-testo.github.io/edit/master/:path',
          text: 'Edit this page',
        },
        sidebar: {
          '/docs/': [
            {
              text: 'Introduction',
              items: [
                { text: 'Why Testo?', link: '/docs/why-testo' },
                { text: 'Getting Started', link: '/docs/getting-started' },
                { text: 'Configuration', link: '/docs/configuration' },
              ],
            },
            {
              text: 'Writing Tests',
              link: '/docs/writing-tests',
              items: [
                { text: 'Test Attribute', link: '/docs/plugins/test' },
                { text: 'Naming Conventions', link: '/docs/plugins/convention' },
                { text: 'Inline Tests', link: '/docs/plugins/inline' },
                { text: 'Data Providers', link: '/docs/plugins/data' },
                { text: 'Lifecycle', link: '/docs/plugins/lifecycle' },
              ],
            },
            {
              text: 'Guide',
              items: [
                { text: 'CLI Reference', link: '/docs/cli-reference' },
                { text: 'Filtering', link: '/docs/plugins/filter' },
              ],
            },
            {
              text: 'Customization',
              items: [
                { text: 'Events', link: '/docs/events' },
              ],
            },
          ],
        },
      },
    },
    ru: {
      label: 'Русский',
      lang: 'ru',
      link: '/ru/',
      head: [
        ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'Блог Testo', href: '/ru/feed.xml' }],
      ],
      themeConfig: {
        nav: [
          { text: 'Документация', link: '/ru/docs/getting-started' },
          { text: 'Блог', link: '/ru/blog/' },
        ],
        editLink: {
          pattern: 'https://github.com/php-testo/php-testo.github.io/edit/master/:path',
          text: 'Редактировать эту страницу',
        },
        sidebar: {
          '/ru/docs/': [
            {
              text: 'Введение',
              items: [
                { text: 'Почему Testo?', link: '/ru/docs/why-testo' },
                { text: 'Начало работы', link: '/ru/docs/getting-started' },
                { text: 'Конфигурация', link: '/ru/docs/configuration' },
              ],
            },
            {
              text: 'Пишем тесты',
              link: '/ru/docs/writing-tests',
              items: [
                { text: 'Атрибут Test', link: '/ru/docs/plugins/test' },
                { text: 'Конвенции именования', link: '/ru/docs/plugins/convention' },
                { text: 'Встроенные тесты', link: '/ru/docs/plugins/inline' },
                { text: 'Провайдеры данных', link: '/ru/docs/plugins/data' },
                { text: 'Жизненный цикл', link: '/ru/docs/plugins/lifecycle' },
              ],
            },
            {
              text: 'Руководство',
              items: [
                { text: 'CLI справка', link: '/ru/docs/cli-reference' },
                { text: 'Фильтрация', link: '/ru/docs/plugins/filter' },
              ],
            },
            {
              text: 'Кастомизация',
              items: [
                { text: 'События', link: '/ru/docs/events' },
              ],
            },
          ],
        },
        outline: {
          label: 'На этой странице',
        },
        docFooter: {
          prev: 'Назад',
          next: 'Вперёд',
        },
        lastUpdated: {
          text: 'Обновлено',
        },
        returnToTopLabel: 'Наверх',
        sidebarMenuLabel: 'Меню',
        darkModeSwitchLabel: 'Тема',
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',

    search: {
      provider: 'local',
    },
  },

  transformPageData(pageData) {
    // Disable lastUpdated and editLink for blog posts
    const pagePath = '/' + pageData.relativePath.replace(/\.md$/, '')
    if (isBlogPath(pagePath) || isBlogPath(pagePath + '/')) {
      pageData.frontmatter.lastUpdated = false
      pageData.frontmatter.editLink = false
    }
  },

  transformHead({ pageData, siteData }) {
    const head: HeadConfig[] = []

    const title = pageData.frontmatter.title || siteData.title
    const description = pageData.frontmatter.description || siteData.description
    const image = pageData.frontmatter.image
    const pageUrl = baseUrl + '/' + pageData.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '')

    head.push(['meta', { property: 'og:type', content: 'website' }])
    head.push(['meta', { property: 'og:url', content: pageUrl }])

    if (title) {
      head.push(['meta', { property: 'og:title', content: title }])
      head.push(['meta', { name: 'twitter:title', content: title }])
    }

    if (description) {
      head.push(['meta', { property: 'og:description', content: description }])
      head.push(['meta', { name: 'twitter:description', content: description }])
    }

    if (image) {
      head.push(['meta', { property: 'og:image', content: baseUrl + image }])
      head.push(['meta', { name: 'twitter:image', content: baseUrl + image }])
      head.push(['meta', { name: 'twitter:card', content: 'summary_large_image' }])
    }

    return head
  },
})
