/**
 * Plugin info card + inline reference for markdown-it.
 *
 * Block tag `<plugin-info>` renders a styled card with plugin metadata.
 * Inline tag `<plugin>` renders a link to the plugin's page by name.
 *
 * Usage:
 *   <plugin-info class="\Testo\Assert\AssertPlugin" name="Assert" included="\Testo\Application\Config\Plugin\SuitePlugins" />
 *   <plugin-info class="\Testo\Convention\ConventionPlugin" name="Convention" github="https://..." />
 *
 * Attributes:
 *   - class (required): FQN of the plugin class
 *   - name (required): human-readable plugin name
 *   - included: plugin set name ("SuitePlugins", "ApplicationPlugins"). Omit if manual.
 *   - github: URL to plugin's GitHub page (optional)
 */
import type MarkdownIt from 'markdown-it'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { getLocaleByPath } from './locales'

// ─── Labels ──────────────────────────────────────────────

interface PluginLabels {
  pluginClass: string
  includedIn: (set: string) => string
  notIncluded: string
  noSetup: string
  github: string
}

const labels: Record<string, PluginLabels> = {
  en: {
    pluginClass: 'Plugin class',
    includedIn: (set) => `Included in <class>${set}</class> — enabled by default.`,
    notIncluded: 'Not included in default plugins.',
    noSetup: 'The plugin does not require setup.',
    github: 'GitHub',
  },
  ru: {
    pluginClass: 'Класс плагина',
    includedIn: (set) => `Входит в <class>${set}</class> по умолчанию.`,
    notIncluded: 'Не входит в состав плагинов по умолчанию.',
    noSetup: 'Плагин не требует настройки.',
    github: 'GitHub',
  },
}

// ─── Registry ────────────────────────────────────────────

export interface PluginRegistryEntry {
  fqn: string        // \Testo\Assert\AssertPlugin
  name: string       // Assert
  pagePath: string   // /docs/plugins/assert
  included?: string  // SuitePlugins
}

// locale code -> name (lowercase) -> entry
const registry = new Map<string, Map<string, PluginRegistryEntry>>()

export function registerPlugin(localeCode: string, entry: PluginRegistryEntry): void {
  if (!registry.has(localeCode)) {
    registry.set(localeCode, new Map())
  }
  const map = registry.get(localeCode)!
  const key = entry.name.toLowerCase()
  if (!map.has(key)) {
    map.set(key, entry)
  }
}

export function getPluginEntry(localeCode: string, name: string): PluginRegistryEntry | undefined {
  return registry.get(localeCode)?.get(name.toLowerCase())
}

export function getPluginByPagePath(localeCode: string, pagePath: string): PluginRegistryEntry | undefined {
  const map = registry.get(localeCode)
  if (!map) return undefined
  for (const entry of map.values()) {
    if (entry.pagePath === pagePath) return entry
  }
  return undefined
}

// ─── Pre-scan ────────────────────────────────────────────

/**
 * Pre-scan all .md files to populate plugin registry before rendering.
 */
export function preScanPlugins(srcDir: string): void {
  registry.clear()
  const re = /<plugin-info\s+([^>]+)\/>/g

  for (const filePath of collectMdFiles(srcDir)) {
    const content = readFileSync(filePath, 'utf-8')
    const relPath = relative(srcDir, filePath).replace(/\\/g, '/')
    const locale = getLocaleByPath('/' + relPath)
    const pagePath = '/' + relPath.replace(/\.md$/, '').replace(/\/index$/, '/')

    re.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(content)) !== null) {
      const attrs = match[1]
      const fqn = parseAttr(attrs, 'class')
      const name = parseAttr(attrs, 'name')
      if (!name) continue

      const included = parseAttr(attrs, 'included')
      registerPlugin(locale.code, { fqn: fqn || name, name, pagePath, included })
    }
  }
}

function collectMdFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (entry.startsWith('.') || entry === 'node_modules') continue
      results.push(...collectMdFiles(fullPath))
    } else if (entry.endsWith('.md') && entry !== 'CLAUDE.md' && entry !== 'README.md') {
      results.push(fullPath)
    }
  }
  return results
}

// ─── Helpers ─────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripNamespace(fqn: string): string {
  const idx = fqn.lastIndexOf('\\')
  return idx !== -1 ? fqn.slice(idx + 1) : fqn
}

function parseAttr(line: string, attr: string): string | undefined {
  const m = line.match(new RegExp(`${attr}="([^"]+)"`))
  return m?.[1]
}

// ─── Plugin ──────────────────────────────────────────────

export function pluginBlockPlugin(md: MarkdownIt) {
  // Block rule: <plugin-info ... />
  md.block.ruler.before('html_block', 'plugin_block', (state, startLine, _endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const line = state.src.slice(pos, max).trim()

    if (!line.startsWith('<plugin-info')) return false
    if (silent) return true

    const fqn = parseAttr(line, 'class')
    const name = parseAttr(line, 'name')
    if (!name) return false

    const included = parseAttr(line, 'included')
    const github = parseAttr(line, 'github')

    // Register in registry
    const relativePath = state.env?.relativePath || ''
    const locale = getLocaleByPath('/' + relativePath)
    const pagePath = '/' + relativePath.replace(/\.md$/, '').replace(/\/index$/, '/')

    registerPlugin(locale.code, { fqn: fqn || name, name, pagePath, included })

    const l = labels[locale.code] ?? labels.en

    let statusHtml: string
    if (included) {
      statusHtml = l.includedIn(included)
    } else if (fqn) {
      statusHtml = l.notIncluded
    } else {
      statusHtml = l.noSetup
    }

    let linksHtml = ''
    if (github) {
      linksHtml = ` <a href="${escapeHtml(github)}" target="_blank" rel="noopener">${l.github}</a>`
    }

    // Build inline content
    let inlineContent: string
    if (fqn) {
      inlineContent = `${l.pluginClass}: <class>${fqn}</class>. ${statusHtml}${linksHtml}`
    } else {
      inlineContent = `${statusHtml}${linksHtml}`
    }

    // Open wrapper as raw HTML
    const openToken = state.push('html_block', '', 0)
    openToken.content = `<div class="info custom-block" data-info-icon>\n<p>\n`
    openToken.map = [startLine, startLine + 1]

    // Inline content — <class> will be processed by inline rules
    const inlineToken = state.push('inline', '', 0)
    inlineToken.content = inlineContent
    inlineToken.map = [startLine, startLine + 1]
    inlineToken.children = []

    // Close wrapper
    const closeToken = state.push('html_block', '', 0)
    closeToken.content = `\n</p>\n</div>\n`

    state.line = startLine + 1
    return true
  })

}
