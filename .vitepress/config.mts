import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Testo',
  description: 'Modern PHP Testing Framework',

  lastUpdated: true,
  cleanUrls: true,

  rewrites: {
    'pages/en/index.md': 'index.md',
    'pages/ru/index.md': 'ru/index.md',
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/docs/en/getting-started' },
          { text: 'Blog', link: '/blog/en/' },
        ],
        sidebar: {
          '/docs/en/': [
            {
              text: 'Introduction',
              items: [
                { text: 'Getting Started', link: '/docs/en/getting-started' },
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
      themeConfig: {
        nav: [
          { text: 'Документация', link: '/docs/ru/getting-started' },
          { text: 'Блог', link: '/blog/ru/' },
        ],
        sidebar: {
          '/docs/ru/': [
            {
              text: 'Введение',
              items: [
                { text: 'Начало работы', link: '/docs/ru/getting-started' },
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/php-testo/testo' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Testo',
    },
  },
})
