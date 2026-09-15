/**
 * Prompts registry + the `<prompts-list />` card list.
 *
 * A prompt page is marked `llms: prompt` and its body is the prompt text
 * itself — the `.md` served at its path is what an agent fetches, so nothing
 * that isn't part of the prompt may reach it.
 *
 * The marker is an llms.txt field, and those live in English pages only, so a
 * translation is claimed by mirrored path instead: `docs/ai/prompts/init.md`
 * takes `ru/docs/ai/prompts/init.md` as its Russian version.
 */
import type MarkdownIt from 'markdown-it'
import { existsSync, readFileSync } from 'fs'
import { basename, join, relative } from 'path'
// @ts-ignore
import matter from 'gray-matter'
import { locales, getLocaleByPath, LocaleConfig } from './locales'
import { collectMdFiles } from './plugin-block'

export interface PromptRegistryEntry {
  title: string
  description: string
  category?: string
  pagePath: string // /docs/ai/prompts/init
}

// locale code -> entries
const registry = new Map<string, PromptRegistryEntry[]>()

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readEntry(filePath: string, srcDir: string): PromptRegistryEntry {
  const { data: fm, content } = matter(readFileSync(filePath, 'utf-8'))
  const relPath = relative(srcDir, filePath).replace(/\\/g, '/')
  const h1 = content.match(/^#\s+(.+)$/m)

  return {
    title: fm.title || h1?.[1].trim() || basename(filePath, '.md'),
    description: fm.description || fm.llms_description || '',
    category: fm.prompt_category,
    pagePath: '/' + relPath.replace(/\.md$/, ''),
  }
}

function push(localeCode: string, entry: PromptRegistryEntry): void {
  if (!registry.has(localeCode)) registry.set(localeCode, [])
  registry.get(localeCode)!.push(entry)
}

/** Pre-scan English `llms: prompt` pages and their translations. */
export function preScanPrompts(srcDir: string): void {
  registry.clear()
  const docsDir = join(srcDir, 'docs')
  if (!existsSync(docsDir)) return

  for (const filePath of collectMdFiles(docsDir)) {
    const { data: fm } = matter(readFileSync(filePath, 'utf-8'))
    if (fm.llms !== 'prompt') continue

    push('en', readEntry(filePath, srcDir))

    for (const locale of locales) {
      if (!locale.prefix) continue
      const translated = join(srcDir, locale.prefix, relative(srcDir, filePath))
      if (existsSync(translated)) push(locale.code, readEntry(translated, srcDir))
    }
  }
}

interface PromptsOptions {
  /** Site origin, used to build the copy-ready raw Markdown URL. */
  baseUrl?: string
}

export function promptsBlockPlugin(md: MarkdownIt, opts: PromptsOptions = {}) {
  // The note below is injected at render time rather than written into the
  // file, so the served .md stays pure prompt text with nothing for an agent
  // to mistake for part of the task.
  md.core.ruler.push('prompt_note', (state) => {
    const relativePath = state.env?.relativePath
    if (!relativePath) return

    const locale = getLocaleByPath('/' + relativePath)
    const pagePath = '/' + relativePath.replace(/\.md$/, '')
    if (!(registry.get(locale.code) ?? []).some(e => e.pagePath === pagePath)) return

    const token = new state.Token('html_block', '', 0)
    token.content = renderPromptNote(locale, (opts.baseUrl ?? '') + pagePath + '.md')

    // After the page heading, so the h1 stays first.
    const afterH1 = state.tokens[0]?.type === 'heading_open' ? 3 : 0
    state.tokens.splice(afterH1, 0, token)
  })

  md.block.ruler.before('html_block', 'prompts_list', (state, startLine, _endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const line = state.src.slice(pos, max).trim()

    if (line !== '<prompts-list />' && line !== '<prompts-list/>') return false
    if (silent) return true

    const token = state.push('prompts_list', '', 0)
    const relativePath = state.env?.relativePath || ''
    token.meta = { locale: getLocaleByPath('/' + relativePath) }
    state.line = startLine + 1
    return true
  })

  md.renderer.rules['prompts_list'] = (tokens, idx) =>
    renderPromptsList(md, tokens[idx].meta?.locale, opts.baseUrl ?? '')
}

function renderPromptNote(locale: LocaleConfig, rawUrl: string): string {
  const text = locale.code === 'ru'
    ? `Всё, что ниже — готовый промпт. Скопируйте его целиком или дайте агенту ссылку на исходный Markdown: <a href="${escapeHtml(rawUrl)}">${escapeHtml(rawUrl)}</a>`
    : `Everything below is the prompt itself. Copy it as it is, or point your agent at the raw Markdown: <a href="${escapeHtml(rawUrl)}">${escapeHtml(rawUrl)}</a>`

  return `<div class="tip custom-block prompt-note"><p>${text}</p></div>\n`
}

function renderPromptsList(md: MarkdownIt, locale: LocaleConfig | undefined, baseUrl: string): string {
  const localeCode = locale?.code ?? 'en'
  const entries = registry.get(localeCode) ?? []

  if (entries.length === 0) return ''

  const l = localeCode === 'ru'
    ? { open: 'Открыть промпт', copy: 'Скопировать ссылку', copied: 'Скопировано' }
    : { open: 'Open prompt', copy: 'Copy URL', copied: 'Copied' }

  const cards = [...entries].sort((a, b) =>
    (a.category ?? '').localeCompare(b.category ?? '') || a.title.localeCompare(b.title))

  let html = '<div class="prompt-cards">\n'

  for (const card of cards) {
    const href = card.pagePath + '.md'

    html += '<div class="prompt-card">\n'
    html += '  <span class="prompt-card-head">'
    html += `<span class="prompt-card-title">${escapeHtml(card.title)}</span>`
    if (card.category) {
      html += `<span class="prompt-card-category">${escapeHtml(card.category)}</span>`
    }
    html += '</span>\n'
    html += `  <span class="prompt-card-desc">${md.renderInline(card.description)}</span>\n`
    html += '  <span class="prompt-card-actions">'
    // `target` keeps VitePress's router from treating the .md path as a route
    // and answering with its 404 page.
    html += `<a class="prompt-card-btn" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(l.open)}</a>`
    html += `<button class="prompt-card-btn prompt-card-copy" type="button" data-url="${escapeHtml(baseUrl + href)}"`
    html += ` data-copied="${escapeHtml(l.copied)}">${escapeHtml(l.copy)}</button>`
    html += '</span>\n'
    html += '</div>\n'
  }

  html += '</div>\n'
  return html
}
