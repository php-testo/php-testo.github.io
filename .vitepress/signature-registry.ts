/**
 * Signature registry for cross-referencing `<func>`, `<attr>`, `<class>`, and `<enum>` inline tags.
 *
 * Pre-scans all .md files to collect `<signature>` blocks with FQN names,
 * then provides lookup for inline references to generate links and tooltips.
 * Four separate registries:
 *   - functions/methods: signatures with `::` or `->` (e.g. `\Testo\Assert::same(...)`)
 *   - attributes: signatures starting with `#[` (e.g. `#[\Testo\MyAttr(...)]`)
 *   - classes: plain FQN signatures (e.g. `new \Testo\Filter(...)`, `enum \Testo\Mode`) — covers classes, enums, traits, interfaces
 *   - enum cases: `<case>` tags inside enum signatures (e.g. `\Testo\Mode::Available`)
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

export interface EnumCaseEntry {
  fqn: string         // \Testo\Codecov\Config\CoverageMode::Available
  caseName: string    // Available
  enumFqn: string     // \Testo\Codecov\Config\CoverageMode
  slug: string        // testo-codecov-config-coveragemode--available
  pagePath: string
  description: string // raw markdown description of the case
  value: string       // optional backed value (e.g. 'line', 1)
  hasAnchor: boolean  // inherited from parent enum signature
  enumShort: string   // parent enum's <short>
  enumSignature: string // display signature of parent enum
}

// locale code -> normalized FQN -> entry
const registry = new Map<string, Map<string, RegistryEntry>>()
const attrRegistry = new Map<string, Map<string, RegistryEntry>>()
const classRegistry = new Map<string, Map<string, RegistryEntry>>()
const enumCaseRegistry = new Map<string, Map<string, EnumCaseEntry>>()

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
 * Build slug from FQN signature (same logic as signature.ts buildSlug).
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
  // FQN without parentheses (e.g. attributes: \Testo\Codecov\CoversNothing)
  const fqnPlain = signature.match(/^\\?(.+)/)
  if (fqnPlain) {
    return fqnPlain[1]
      .replace(/\\/g, '-')
      .replace(/::/g, '--')
      .replace(/->/g, '--')
      .toLowerCase()
  }
  return 'unknown'
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
  classRegistry.clear()
  enumCaseRegistry.clear()
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

      // Detect signature type by prefix:
      // - #[...] → attribute
      // - new ... → class/constructor
      // - enum ... → enum (→ classRegistry + enumCaseRegistry)
      // - otherwise → function/method
      const isAttr = signature.startsWith('#[')
      const isClass = !isAttr && signature.startsWith('new ')
      const isEnum = !isAttr && !isClass && signature.startsWith('enum ')
      const innerSig = isAttr ? signature.slice(2, -1)
        : isClass ? signature.slice(4)
        : isEnum ? signature.slice(5)
        : signature

      // Only collect FQN signatures (starting with \)
      if (!innerSig.startsWith('\\')) continue

      const fqn = normalizeFqn(innerSig)

      // Check if heading level > 0 (has a navigable anchor)
      const hMatch = attrs.match(/\bh="([1-6])"/)
      const hasAnchor = !!hMatch

      const shortMatch = body.match(/<short>([\s\S]*?)<\/short>/)
      const short = shortMatch ? shortMatch[1].trim() : ''

      const displaySig = stripNamespaceForDisplay(innerSig)

      // Route to appropriate registry:
      // - attributes (#[...]) → attrRegistry
      // - enums (enum ...) → classRegistry + parse cases/methods
      // - classes (new ...) → classRegistry
      // - functions/methods (default) → registry
      const targetRegistry = isAttr ? attrRegistry : (isClass || isEnum) ? classRegistry : registry

      if (!targetRegistry.has(locale.code)) {
        targetRegistry.set(locale.code, new Map())
      }
      const localeMap = targetRegistry.get(locale.code)!

      // Skip if already registered (first wins)
      if (!localeMap.has(fqn)) {
        localeMap.set(fqn, {
          fqn,
          slug: buildSlugFromFqn(innerSig),
          pagePath,
          signature: isAttr ? '#[' + displaySig + ']' : isEnum ? 'enum ' + displaySig : isClass ? 'new ' + displaySig : displaySig,
          short,
          hasAnchor,
        })
      }

      // For enums: parse <case> and <method> tags
      if (isEnum) {
        const enumSlug = buildSlugFromFqn(innerSig)
        const enumDisplaySig = 'enum ' + displaySig

        // Parse <case> tags → enumCaseRegistry
        if (!enumCaseRegistry.has(locale.code)) {
          enumCaseRegistry.set(locale.code, new Map())
        }
        const caseMap = enumCaseRegistry.get(locale.code)!

        const caseRe = /<case\s+([^>]*)>([\s\S]*?)<\/case>/g
        let cm: RegExpExecArray | null
        while ((cm = caseRe.exec(body)) !== null) {
          const caseAttrs = cm[1]
          const caseDesc = cm[2].trim()

          const caseNameMatch = caseAttrs.match(/\bname="([^"]*)"/)
          if (!caseNameMatch) continue
          const caseName = caseNameMatch[1]

          const valueMatch = caseAttrs.match(/\bvalue="([^"]*)"/)
          const value = valueMatch ? valueMatch[1] : ''

          const caseFqn = fqn + '::' + caseName
          const caseSlug = enumSlug + '--' + caseName.toLowerCase()

          if (!caseMap.has(caseFqn)) {
            caseMap.set(caseFqn, {
              fqn: caseFqn,
              caseName,
              enumFqn: fqn,
              slug: caseSlug,
              pagePath,
              description: caseDesc,
              value,
              hasAnchor,
              enumShort: short,
              enumSignature: enumDisplaySig,
            })
          }
        }

        // Parse <method> tags → registry (function/method registry)
        if (!registry.has(locale.code)) {
          registry.set(locale.code, new Map())
        }
        const methodMap = registry.get(locale.code)!

        const methodRe = /<method\s+([^>]*)>([\s\S]*?)<\/method>/g
        let mm: RegExpExecArray | null
        while ((mm = methodRe.exec(body)) !== null) {
          const methodAttrs = mm[1]
          const methodBody = mm[2]

          const methodNameMatch = methodAttrs.match(/\bname="([^"]*)"/)
          if (!methodNameMatch) continue
          const methodSig = methodNameMatch[1]

          // Build FQN: \Namespace\Enum::methodName
          const methodBaseName = methodSig.match(/^([A-Za-z_]\w*)/)
          if (!methodBaseName) continue
          const methodFqn = fqn + '::' + methodBaseName[1]
          const methodSlug = enumSlug + '--' + methodBaseName[1].toLowerCase()

          const methodShortMatch = methodBody.match(/<short>([\s\S]*?)<\/short>/)
          const methodShort = methodShortMatch ? methodShortMatch[1].trim() : ''

          const methodDisplaySig = displaySig + '::' + methodSig

          if (!methodMap.has(methodFqn)) {
            methodMap.set(methodFqn, {
              fqn: methodFqn,
              slug: methodSlug,
              pagePath,
              signature: methodDisplaySig,
              short: methodShort,
              hasAnchor,
            })
          }
        }
      }
    }
  }
}

/**
 * Return all attribute entries for a locale.
 */
export function getAllAttrEntries(localeCode: string): RegistryEntry[] {
  const map = attrRegistry.get(localeCode)
  return map ? [...map.values()] : []
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
 * Look up a class/enum/trait/interface signature entry by FQN and locale.
 */
export function getClassEntry(localeCode: string, rawFqn: string): RegistryEntry | undefined {
  const fqn = normalizeFqn(rawFqn)
  return classRegistry.get(localeCode)?.get(fqn)
}

/**
 * Look up an enum case entry by FQN (e.g. \Testo\Mode::Available) and locale.
 */
export function getEnumCaseEntry(localeCode: string, rawFqn: string): EnumCaseEntry | undefined {
  // rawFqn: \Testo\Codecov\Config\CoverageMode::Available
  const fqn = rawFqn.trim()
  const normalized = fqn.startsWith('\\') ? fqn : '\\' + fqn
  return enumCaseRegistry.get(localeCode)?.get(normalized)
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
