import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { Feed } from 'feed'
import { createContentLoader, SiteConfig } from 'vitepress'

const baseUrl = 'https://php-testo.github.io'

interface FeedConfig {
  title: string
  description: string
  filename: string
  filter: (url: string) => boolean
  lang: string
}

const feeds: FeedConfig[] = [
  {
    title: 'Testo Blog',
    description: 'Updates from Testo - Modern PHP Testing Framework',
    filename: 'feed.xml',
    filter: (url) => url.startsWith('/blog/') && url !== '/blog/',
    lang: 'en',
  },
  {
    title: 'Блог Testo',
    description: 'Новости Testo - современного PHP фреймворка для тестирования',
    filename: 'ru/feed.xml',
    filter: (url) => url.startsWith('/ru/blog/') && url !== '/ru/blog/',
    lang: 'ru',
  },
]

export async function generateRss(config: SiteConfig) {
  const posts = await createContentLoader(['blog/*.md', 'ru/blog/*.md'], {
    excerpt: false,
    render: false,
  }).load()

  for (const feedConfig of feeds) {
    const feed = new Feed({
      title: feedConfig.title,
      description: feedConfig.description,
      id: baseUrl,
      link: baseUrl,
      language: feedConfig.lang,
      copyright: `Copyright © ${new Date().getFullYear()} Testo`,
      generator: 'VitePress + feed',
      feedLinks: {
        rss: `${baseUrl}/${feedConfig.filename}`,
      },
    })

    const filteredPosts = posts
      .filter((post) => feedConfig.filter(post.url))
      .sort((a, b) => {
        const dateA = new Date(a.frontmatter.date || 0).getTime()
        const dateB = new Date(b.frontmatter.date || 0).getTime()
        return dateB - dateA
      })

    for (const post of filteredPosts) {
      const url = `${baseUrl}${post.url}`
      const imageUrl = post.frontmatter.image ? `${baseUrl}${post.frontmatter.image}` : undefined

      feed.addItem({
        title: post.frontmatter.title || 'Untitled',
        id: url,
        link: url,
        description: post.frontmatter.description || '',
        date: new Date(post.frontmatter.date || Date.now()),
        author: post.frontmatter.author
          ? [{ name: post.frontmatter.author }]
          : [{ name: 'Testo Team' }],
        image: imageUrl,
      })
    }

    const outDir = config.outDir
    const filePath = path.join(outDir, feedConfig.filename)

    // Ensure directory exists
    mkdirSync(path.dirname(filePath), { recursive: true })

    // Generate RSS
    let rssContent = feed.rss2()

    // Add dc namespace
    if (!rssContent.includes('xmlns:dc=')) {
      rssContent = rssContent.replace(
        '<rss version="2.0"',
        '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"'
      )
    }

    // Add dc:creator for each post
    for (const post of filteredPosts) {
      const author = post.frontmatter.author || 'Testo Team'
      const url = `${baseUrl}${post.url}`
      // Insert dc:creator after </description> for this item
      rssContent = rssContent.replace(
        new RegExp(`(<guid isPermaLink="false">${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</guid>)`),
        `$1\n            <dc:creator><![CDATA[${author}]]></dc:creator>`
      )
    }

    writeFileSync(filePath, rssContent)
    console.log(`✓ RSS generated: ${feedConfig.filename} (${filteredPosts.length} posts)`)
  }
}
