import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  url: string
  date: string
  description: string
  image?: string
  author?: string
}

declare const data: Post[]
export { data }

export default createContentLoader(['blog/*.md', 'ru/blog/*.md'], {
  transform(raw): Post[] {
    return raw
      .filter((page) => page.url !== '/blog/' && page.url !== '/ru/blog/')
      .map((page) => ({
        title: page.frontmatter.title,
        url: page.url,
        date: formatDate(page.frontmatter.date),
        description: page.frontmatter.description,
        image: page.frontmatter.image,
        author: page.frontmatter.author,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },
})

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toISOString().slice(0, 10)
}
