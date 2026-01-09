import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Testo',
  description: 'Modern PHP Testing Framework',

  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/php-testo/testo' },
    ],

    search: {
      provider: 'local',
    },
  },
})
