/**
 * Signature registry for cross-referencing `<func>` and `<attr>` inline tags.
 *
 * Pre-scans all .md files to collect `<signature>` blocks with FQN names,
 * then provides lookup for inline references to generate links and tooltips.
 * Function signatures (e.g. `\Testo\Assert::same(...)`) and attribute signatures
 * (e.g. `#[\Testo\MyAttr(...)]`) are stored in separate registries.
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { getLocaleByPath } from './locales'

export interface RegistryEntry {
  fqn: string         // Normalized: \Testo\Assert::blank
  slug: string        // Anchor: testo-assert--blank
  pagePath: string    // URL path: /docs/plugins/assert or /ru/docs/plugins/assert
  signature: string   // Display: Assert::blank(mixed $actual, string $message = ''): void
  short: string       // One-liner description (raw markdown)
  hasAnchor: boolean  // true if h > 0 — linkable heading exists
}

// locale code -> normalized FQN -> entry
const registry = new Map<string, Map<string, RegistryEntry>>()
const attrRegistry = new Map<string, Map<string, RegistryEntry>>()

/**
 * Normalize FQN by stripping arguments and return type.
 * `\Testo\Assert::blank(mixed $actual): void` → `\Testo\Assert::blank`
 * `\Testo\Assert::blank()` → `\Testo\Assert::blank`
 */
export function normalizeFqn(raw: string): string {
  const parenIdx = raw.indexOf('(')
  let base = parenIdx !== -1 ? raw.slice(0, parenIdx) : raw
  base = base.trim()
  if (!base.startsWith('\\')) base = '\\' + base
  return base
}

/**
 * Build slug from FQN signature (same logic as func-block.ts buildSlug).
 */
function buildSlugFromFqn(signature: string): string {
  const fqnMatch = signature.match(/^\\?(.+?)\(/)
  if (fqnMatch) {
    return fqnMatch[1]
      .replace(/\\/g, '-')
      .replace(/::/g, '--')
      .replace(/->/g, '--')
      .toLowerCase()
  }
  const methodMatch = signature.match(/^([A-Za-z_]\w*)/)
  return methodMatch ? methodMatch[1].toLowerCase() : 'unknown'
}

/**
 * Strip namespace prefix from signature for display.
 */
function stripNamespaceForDisplay(signature: string): string {
  const match = signature.match(/^\\?(?:[A-Za-z_]\w*\\)+(.*)$/)
  return match ? match[1] : signature
}

/**
 * Pre-scan all .md files in srcDir to populate the signature registry.
 * Call once before markdown-it processes any pages.
 */
export function preScanSignatures(srcDir: string): void {
  registry.clear()
  attrRegistry.clear()
  const mdFiles = collectMdFiles(srcDir)

  // Match all <signature> blocks with a name attribute
  const sigRe = /<signature\s+([^>]*)>([\s\S]*?)<\/signature>/g

  for (const filePath of mdFiles) {
    const content = readFileSync(filePath, 'utf-8')
    const relPath = relative(srcDir, filePath).replace(/\\/g, '/')
    const locale = getLocaleByPath('/' + relPath)
    const pagePath = '/' + relPath.replace(/\.md$/, '').replace(/\/index$/, '/')

    sigRe.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = sigRe.exec(content)) !== null) {
      const attrs = match[1]
      const body = match[2]

      // Extract name attribute (required)
      const nameMatch = attrs.match(/\bname="([^"]*)"/)
      if (!nameMatch) continue
      const signature = nameMatch[1]

      // Detect attribute signatures: #[\Namespace\Attr(...)]
      const isAttr = signature.startsWith('#[')
      const innerSig = isAttr ? signature.slice(2, -1) : signature

      // Only collect FQN signatures (starting with \)
      if (!innerSig.startsWith('\\')) continue

      const fqn = normalizeFqn(innerSig)
      const targetRegistry = isAttr ? attrRegistry : registry

      if (!targetRegistry.has(locale.code)) {
        targetRegistry.set(locale.code, new Map())
      }
      const localeMap = targetRegistry.get(locale.code)!

      // Skip if already registered (first wins)
      if (localeMap.has(fqn)) continue

      // Check if heading level > 0 (has a navigable anchor)
      const hMatch = attrs.match(/\bh="([1-6])"/)
      const hasAnchor = !!hMatch

      const shortMatch = body.match(/<short>([\s\S]*?)<\/short>/)
      const short = shortMatch ? shortMatch[1].trim() : ''

      const displaySig = stripNamespaceForDisplay(innerSig)

      localeMap.set(fqn, {
        fqn,
        slug: buildSlugFromFqn(innerSig),
        pagePath,
        signature: isAttr ? '#[' + displaySig + ']' : displaySig,
        short,
        hasAnchor,
      })
    }
  }
}

/**
 * Look up a function signature entry by FQN and locale.
 */
export function getEntry(localeCode: string, rawFqn: string): RegistryEntry | undefined {
  const fqn = normalizeFqn(rawFqn)
  return registry.get(localeCode)?.get(fqn)
}

/**
 * Look up an attribute signature entry by FQN and locale.
 */
export function getAttrEntry(localeCode: string, rawFqn: string): RegistryEntry | undefined {
  const fqn = normalizeFqn(rawFqn)
  return attrRegistry.get(localeCode)?.get(fqn)
}

/**
 * Recursively collect all .md files in a directory.
 */
function collectMdFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      // Skip node_modules, .vitepress, etc.
      if (entry.startsWith('.') || entry === 'node_modules') continue
      results.push(...collectMdFiles(fullPath))
    } else if (entry.endsWith('.md') && entry !== 'CLAUDE.md' && entry !== 'README.md') {
      results.push(fullPath)
    }
  }
  return results
}
