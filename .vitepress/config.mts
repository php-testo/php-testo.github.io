import { defineConfig, HeadConfig } from 'vitepress'
import { generateRss, rssPlugin } from './rss'
import { isBlogPath } from './locales'

const baseUrl = 'https://php-testo.github.io'

export default defineConfig({
  title: 'Testo',
  description: 'Modern PHP Testing Framework',

  lastUpdated: false,
  cleanUrls: true,
  srcExclude: ['CLAUDE.md', 'README.md'],
  ignoreDeadLinks: [/feed\.xml$/],

  vite: {
    plugins: [rssPlugin()],
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  buildEnd: generateRss,

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
              ],
            },
            {
              text: 'Writing Tests',
              items: [
                { text: 'Inline Tests', link: '/docs/inline-tests' },
              ],
            },
            {
              text: 'Guide',
              items: [
                { text: 'CLI Reference', link: '/docs/cli-reference' },
                { text: 'Filtering', link: '/docs/filtering' },
                { text: 'Sample Module', link: '/docs/sample-module' },
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
              ],
            },
            {
              text: 'Пишем тесты',
              items: [
                { text: 'Встроенные тесты', link: '/ru/docs/inline-tests' },
              ],
            },
            {
              text: 'Руководство',
              items: [
                { text: 'CLI справка', link: '/ru/docs/cli-reference' },
                { text: 'Фильтрация', link: '/ru/docs/filtering' },
                { text: 'Модуль Sample', link: '/ru/docs/sample-module' },
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

  transformHead({ pageData }) {
    const head: HeadConfig[] = []

    if (pageData.frontmatter.image) {
      head.push(['meta', { property: 'og:image', content: baseUrl + pageData.frontmatter.image }])
      head.push(['meta', { name: 'twitter:image', content: baseUrl + pageData.frontmatter.image }])
      head.push(['meta', { name: 'twitter:card', content: 'summary_large_image' }])
    }

    if (pageData.frontmatter.description) {
      head.push(['meta', { property: 'og:description', content: pageData.frontmatter.description }])
      head.push(['meta', { name: 'twitter:description', content: pageData.frontmatter.description }])
    }

    if (pageData.frontmatter.title) {
      head.push(['meta', { property: 'og:title', content: pageData.frontmatter.title }])
      head.push(['meta', { name: 'twitter:title', content: pageData.frontmatter.title }])
    }

    return head
  },
})
