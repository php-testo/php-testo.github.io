export interface LocaleConfig {
  code: string        // 'en', 'ru', 'de', etc.
  prefix: string      // '' for root, 'ru', 'de', etc.
  blogTitle: string
  blogDescription: string
}

export const locales: LocaleConfig[] = [
  {
    code: 'en',
    prefix: '',
    blogTitle: 'Testo Blog',
    blogDescription: 'Updates from Testo - Modern PHP Testing Framework',
  },
  {
    code: 'ru',
    prefix: 'ru',
    blogTitle: 'Блог Testo',
    blogDescription: 'Новости Testo - современного PHP фреймворка для тестирования',
  },
]

// Helper functions
export function getBlogFolder(locale: LocaleConfig): string {
  return locale.prefix ? `${locale.prefix}/blog` : 'blog'
}

export function getBlogUrl(locale: LocaleConfig): string {
  return locale.prefix ? `/${locale.prefix}/blog/` : '/blog/'
}

export function getFeedFilename(locale: LocaleConfig): string {
  return locale.prefix ? `${locale.prefix}/feed.xml` : 'feed.xml'
}

export function isBlogPath(path: string): boolean {
  return locales.some(locale => {
    const blogUrl = getBlogUrl(locale)
    return path.startsWith(blogUrl) && path !== blogUrl
  })
}

export function isBlogIndexPath(path: string): boolean {
  return locales.some(locale => path === getBlogUrl(locale))
}

// Generate glob patterns for all blog folders
export function getBlogGlobPatterns(): string[] {
  return locales.map(locale => `${getBlogFolder(locale)}/*.md`)
}

// Get all blog index URLs (for filtering)
export function getBlogIndexUrls(): string[] {
  return locales.map(locale => getBlogUrl(locale))
}
