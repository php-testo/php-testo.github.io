import type { ComputedRef, InjectionKey } from 'vue'

export interface LocalNavBack {
  url: string
  label: string
}

export const localNavBackKey: InjectionKey<ComputedRef<LocalNavBack | null>> = Symbol('local-nav-back')

export interface LocaleConfig {
  code: string        // 'en', 'ru', 'de', etc.
  prefix: string      // '' for root, 'ru', 'de', etc.
  blogTitle: string
  blogDescription: string
  blogLabel: string   // Back button label: 'Blog', 'Блог', etc.
  signatureParamsLabel: string    // 'Parameters:', 'Параметры:', etc.
  signatureExamplesLabel: string  // 'Examples:', 'Примеры:', etc.
  signatureCasesLabel: string     // 'Cases:', 'Значения:', etc.
  tweetLoadLabel: string          // Retry button title after a failed load
  tweetLoadingLabel: string       // Placeholder title while widgets.js is loading
  tweetHint: string               // Default sub-label under the button title
  tweetFailedLabel: string        // Shown when the embed can't be rendered
  tweetOpenLabel: string          // Fallback link to x.com
}

export const locales: LocaleConfig[] = [
  {
    code: 'en',
    prefix: '',
    blogTitle: 'Testo Blog',
    blogDescription: 'Updates from Testo - Modern PHP Testing Framework',
    blogLabel: 'Blog',
    signatureParamsLabel: 'Parameters:',
    signatureExamplesLabel: 'Examples:',
    signatureCasesLabel: 'Cases:',
    tweetLoadLabel: 'Show the tweet by',
    tweetLoadingLabel: 'Loading the tweet by',
    tweetHint: 'Fetching the embedded post from x.com',
    tweetFailedLabel: "Couldn't load it — x.com may be blocked. Click to retry.",
    tweetOpenLabel: 'Open on X',
  },
  {
    code: 'ru',
    prefix: 'ru',
    blogTitle: 'Блог Testo',
    blogDescription: 'Новости Testo - современного PHP фреймворка для тестирования',
    blogLabel: 'Блог',
    signatureParamsLabel: 'Параметры:',
    signatureExamplesLabel: 'Примеры:',
    signatureCasesLabel: 'Значения:',
    tweetLoadLabel: 'Показать твит',
    tweetLoadingLabel: 'Загружаем твит',
    tweetHint: 'Подгружаем встроенный пост с x.com',
    tweetFailedLabel: 'Не удалось загрузить — возможно, x.com заблокирован. Нажмите, чтобы повторить.',
    tweetOpenLabel: 'Открыть в X',
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

export function getLocaleByPath(path: string): LocaleConfig {
  return locales.find(l => l.prefix && path.startsWith(`/${l.prefix}/`)) ?? locales[0]
}

export function getBlogBackLink(path: string): LocalNavBack | null {
  if (!isBlogPath(path)) return null
  const locale = getLocaleByPath(path)
  return { url: getBlogUrl(locale), label: locale.blogLabel }
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
