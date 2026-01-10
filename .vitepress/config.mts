import { defineConfig } from 'vitepress'
import { RssPlugin } from 'vitepress-plugin-rss'

const baseUrl = 'https://php-testo.github.io'

const rssOptionsEn = {
  title: 'Testo Blog',
  baseUrl,
  copyright: 'Copyright © Testo',
  description: 'Updates from Testo - Modern PHP Testing Framework',
  filename: 'feed.xml',
  filter: (post: { url: string }) => post.url.startsWith('/blog/') && !post.url.endsWith('/blog/'),
  icon: false,
}

const rssOptionsRu = {
  title: 'Блог Testo',
  baseUrl,
  copyright: 'Copyright © Testo',
  description: 'Новости Testo - современного PHP фреймворка для тестирования',
  filename: 'ru/feed.xml',
  filter: (post: { url: string }) => post.url.startsWith('/ru/blog/') && !post.url.endsWith('/blog/'),
  icon: false,
}

export default defineConfig({
  title: 'Testo',
  description: 'Modern PHP Testing Framework',

  lastUpdated: true,
  cleanUrls: true,
  srcExclude: ['CLAUDE.md', 'README.md'],
  ignoreDeadLinks: [/feed\.xml$/],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  vite: {
    plugins: [RssPlugin(rssOptionsEn), RssPlugin(rssOptionsRu)],
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
})
