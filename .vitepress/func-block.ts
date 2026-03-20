/**
 * Function signature block plugin for markdown-it.
 *
 * Renders `<signature>` blocks as styled API reference cards
 * with Shiki-highlighted PHP signatures and parameter descriptions.
 *
 * Usage:
 *   <signature name="Assert::same(mixed $actual, mixed $expected, string $message = '')">
 *   <description>Method description.</description>
 *   <param name="$actual">The value being checked.</param>
 *   <param name="$expected">The expected value.</param>
 *   <example>
 *   ```php
 *   Assert::same($user->role, 'admin');
 *   ```
 *   </example>
 *   </signature>
 */
import type MarkdownIt from 'markdown-it'
import { getLocaleByPath, type LocaleConfig } from './locales'
import { getEntry } from './func-registry'

interface Param {
  name: string
  desc: string
}

export function funcBlockPlugin(md: MarkdownIt) {
  md.block.ruler.before('html_block', 'func_block', (state, startLine, endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const firstLine = state.src.slice(pos, max)

    if (!firstLine.startsWith('<signature ')) return false
    if (silent) return true

    // Find closing </signature>
    let closeLine = -1
    for (let i = startLine; i < endLine; i++) {
      const ls = state.bMarks[i] + state.tShift[i]
      const le = state.eMarks[i]
      if (state.src.slice(ls, le).includes('</signature>')) {
        closeLine = i
        break
      }
    }

    if (closeLine === -1) return false

    const token = state.push('func_block', '', 0)
    token.content = state.src.slice(pos, state.eMarks[closeLine])
    token.map = [startLine, closeLine + 1]
    token.block = true

    // Resolve locale from file path for localized labels
    const relativePath = state.env?.relativePath || ''
    token.meta = { locale: getLocaleByPath('/' + relativePath) }

    state.line = closeLine + 1
    return true
  })

  md.renderer.rules['func_block'] = (tokens, idx, options, env) => {
    return renderFuncBlock(md, tokens[idx].content, tokens[idx].meta?.locale, env)
  }

  // Inline rule: parse <func>..FQN..</func> references
  md.inline.ruler.before('html_inline', 'func_ref', (state, silent) => {
    if (state.src.slice(state.pos, state.pos + 6) !== '<func>') return false

    const closeIdx = state.src.indexOf('</func>', state.pos + 6)
    if (closeIdx === -1) return false

    if (silent) return true

    const token = state.push('func_ref', '', 0)
    token.content = state.src.slice(state.pos + 6, closeIdx).trim()

    const relativePath = state.env?.relativePath || ''
    token.meta = { locale: getLocaleByPath('/' + relativePath) }

    state.pos = closeIdx + 7
    return true
  })

  // Renderer for <func> inline references
  md.renderer.rules['func_ref'] = (tokens, idx) => {
    const token = tokens[idx]
    const rawFqn = token.content
    const locale = token.meta?.locale

    // Build display name: strip namespace, keep ()
    const displayFqn = stripNamespace(rawFqn).display

    // Look up in registry
    const entry = getEntry(locale?.code ?? 'en', rawFqn)

    if (entry) {
      const sigHtml = highlightSignature(md, entry.signature)
      // Highlight inline display using the full signature, then extract the short portion
      const displayHtml = highlightFuncRef(md, displayFqn, entry.signature)
      const shortHtml = entry.short ? md.renderInline(entry.short) : ''

      const tooltip = `<span class="func-ref-tooltip">`
        + `<code class="func-ref-tooltip-sig vp-code">${sigHtml}</code>`
        + (shortHtml ? `<span class="func-ref-tooltip-short">${shortHtml}</span>` : '')
        + `</span>`

      // Link only if signature has a navigable anchor (h > 0)
      if (entry.hasAnchor) {
        const href = entry.pagePath + '#' + entry.slug
        return `<a href="${href}" class="func-ref vp-code">${displayHtml}${tooltip}</a>`
      }

      // Tooltip without link
      return `<span class="func-ref vp-code">${displayHtml}${tooltip}</span>`
    }

    // No match in registry — render as plain inline code
    return `<code>${escapeHtml(displayFqn)}</code>`
  }
}

function renderFuncBlock(md: MarkdownIt, raw: string, locale?: LocaleConfig, env?: any): string {
  // Parse name attribute (the full signature)
  const nameMatch = raw.match(/<signature\s+[^>]*name="([^"]*)"/)
  if (!nameMatch) return ''
  const signature = nameMatch[1]

  // Parse heading level: h="3" etc., default h="0" for bold text instead of heading
  const hMatch = raw.match(/<signature\s+[^>]*h="([^"]*)"/)
  const headingLevel = hMatch ? parseInt(hMatch[1], 10) : 0

  // Check for compact rendering mode
  const compact = /^<signature\s+[^>]*\bcompact\b/.test(raw)

  // Extract body between opening tag and </signature>
  const openEnd = raw.indexOf('>')
  const closeStart = raw.lastIndexOf('</signature>')
  if (openEnd === -1 || closeStart === -1) return ''
  const body = raw.slice(openEnd + 1, closeStart)

  // Extract <short> — one-liner rendered between heading and signature box
  const shortMatch = body.match(/<short>([\s\S]*?)<\/short>/)
  const short = shortMatch ? shortMatch[1].trim() : ''

  // Extract <description> block (supports full markdown)
  const descMatch = body.match(/<description>([\s\S]*?)<\/description>/)
  const description = descMatch ? descMatch[1].trim() : ''

  // Extract <param> tags
  const params: Param[] = []
  const paramRe = /<param\s+name="([^"]*)">([\s\S]*?)<\/param>/g
  let m: RegExpExecArray | null
  while ((m = paramRe.exec(body)) !== null) {
    params.push({ name: m[1], desc: m[2].trim() })
  }

  // Extract <example> tags (full markdown blocks)
  const examples: string[] = []
  const exampleRe = /<example>([\s\S]*?)<\/example>/g
  let em: RegExpExecArray | null
  while ((em = exampleRe.exec(body)) !== null) {
    examples.push(em[1].trim())
  }

  // Strip namespace from signature for display
  const { display } = stripNamespace(signature)

  // Extract short name for heading: "Class::method" or just "method"
  const shortName = extractShortName(display)

  // Localized labels
  const paramsLabel = locale?.signatureParamsLabel ?? 'Parameters:'
  const examplesLabel = locale?.signatureExamplesLabel ?? 'Examples:'

  // Build slug from FQN for unique heading IDs
  const slug = buildSlug(signature)

  // Build HTML output
  const sigHtml = highlightSignature(md, display)
  const descHtml = description ? md.render(description, env) : ''

  // Compact mode: everything inline, no section headers
  if (compact) {
    const shortHtml = short ? md.renderInline(short) : ''
    const compactDescHtml = description ? md.render(description, env) : ''

    let html = '<div class="func-compact">'

    // Hidden anchor for navigation when heading level is specified
    if (headingLevel > 0 && headingLevel <= 6) {
      html += `<h${headingLevel} id="${escapeHtml(slug)}" class="func-compact-anchor" tabindex="-1">${escapeHtml(shortName)} <a class="header-anchor" href="#${escapeHtml(slug)}" aria-label="Permalink to &quot;${escapeHtml(shortName)}&quot;">​</a></h${headingLevel}>`
    }

    html += `<code class="func-sig vp-code">${sigHtml}</code>`
    if (shortHtml) html += `<span class="func-compact-short">${shortHtml}</span>`
    if (compactDescHtml) html += `<div class="func-compact-desc">${compactDescHtml}</div>`

    if (params.length > 0) {
      const inline = params.map(p => `<code>${escapeHtml(p.name)}</code> -> ${md.renderInline(p.desc)}`).join('; ')
      html += `<div class="func-compact-params">${inline}</div>`
    }

    for (const ex of examples) {
      html += `<div class="func-compact-example">${md.render(ex, env)}</div>`
    }

    html += '</div>\n'
    return html
  }

  let html = ''

  // Heading or bold text from short name
  if (headingLevel > 0 && headingLevel <= 6) {
    html += `<h${headingLevel} id="${escapeHtml(slug)}" tabindex="-1">${escapeHtml(shortName)} <a class="header-anchor" href="#${escapeHtml(slug)}" aria-label="Permalink to &quot;${escapeHtml(shortName)}&quot;">​</a></h${headingLevel}>\n`
  } else {
    html += `<p class="func-title"><strong>${escapeHtml(shortName)}</strong></p>\n`
  }

  if (short) {
    html += `<p class="func-short">${md.renderInline(short)}</p>\n`
  }

  html += '<div class="func-block">\n'
  html += `  <code class="func-sig vp-code">${sigHtml}</code>\n`

  if (descHtml) {
    html += `  <div class="func-desc">${descHtml}</div>\n`
  }

  if (params.length > 0) {
    html += '  <div class="func-section">\n'
    html += `    <p class="func-section-title">${escapeHtml(paramsLabel)}</p>\n`
    html += '    <dl class="func-params">\n'
    for (const p of params) {
      html += `      <dt><code>${escapeHtml(p.name)}</code></dt>\n`
      html += `      <dd>${md.renderInline(p.desc)}</dd>\n`
    }
    html += '    </dl>\n'
    html += '  </div>\n'
  }

  if (examples.length > 0) {
    html += '  <div class="func-section">\n'
    html += `    <p class="func-section-title">${escapeHtml(examplesLabel)}</p>\n`
    for (const ex of examples) {
      html += `    <div class="func-example">${md.render(ex, env)}</div>\n`
    }
    html += '  </div>\n'
  }

  html += '</div>\n'
  return html
}

/**
 * Builds a unique slug from the signature's FQN.
 *
 * FQN signatures (e.g. `\Testo\Assert::string(...)`) produce slugs like `assert-string`.
 * Non-FQN signatures (e.g. `contains(...)`) fall back to the short method name.
 */
function buildSlug(signature: string): string {
  // Extract FQN path before the opening paren: \Testo\Assert::same(...) → Testo\Assert::same
  const fqnMatch = signature.match(/^\\?(.+?)\(/)
  if (fqnMatch) {
    return fqnMatch[1]
      .replace(/\\/g, '-')
      .replace(/::/g, '--')   // double dash between class and method
      .replace(/->/g, '--')
      .toLowerCase()
  }

  // No FQN — use short method name
  const methodMatch = signature.match(/^([A-Za-z_]\w*)/)
  return methodMatch ? methodMatch[1].toLowerCase() : 'unknown'
}

/**
 * Strips namespace prefix from FQN signatures for display.
 * E.g. `\Testo\Assert::method(...)` → `Assert::method(...)`
 */
function stripNamespace(signature: string): { display: string } {
  const match = signature.match(/^\\?(?:[A-Za-z_]\w*\\)+(.*)$/)
  return { display: match ? match[1] : signature }
}

/**
 * Extracts short name for heading from display signature.
 * E.g. `Assert::fail(string $message = ''): never` → `Assert::fail`
 */
function extractShortName(display: string): string {
  // Match "Class::method" or "Class->method" before the opening paren
  const match = display.match(/^([A-Za-z_]\w*(?:::|->)[A-Za-z_]\w*)/)
  if (match) return match[1]

  // Match just "functionName" before paren
  const funcMatch = display.match(/^([A-Za-z_]\w*)/)
  return funcMatch ? funcMatch[1] : display
}

/**
 * Highlights a short func reference (e.g. `Assert::blank()`) by wrapping it
 * as a PHP static call expression so Shiki can tokenize it properly.
 */
function highlightFuncRef(md: MarkdownIt, displayFqn: string, _fullSignature: string): string {
  // displayFqn is e.g. "Assert::blank()" — valid PHP as a static method call
  return highlightSignature(md, displayFqn) || escapeHtml(displayFqn)
}

/**
 * Highlights a PHP signature string using Shiki via markdown-it's highlight option.
 */
function highlightSignature(md: MarkdownIt, signature: string): string {
  const fallback = escapeHtml(signature)

  const highlight = md.options.highlight
  if (!highlight) return fallback

  try {
    // PHP grammar needs <?php prefix to activate proper tokenization
    const result = highlight('<?php\n' + signature, 'php', '')

    // Extract content between <code> and </code>
    const codeMatch = result.match(/<code[^>]*>([\s\S]*?)<\/code>/)
    if (!codeMatch) return fallback

    let inner = codeMatch[1].trim()

    // Remove first line (<?php) — Shiki separates lines by \n
    const newlineIdx = inner.indexOf('\n')
    if (newlineIdx !== -1) {
      inner = inner.slice(newlineIdx + 1).trim()
    }

    // Unwrap <span class="line">...tokens...</span> → bare tokens
    const lineMatch = inner.match(/^<span class="line">([\s\S]*)<\/span>$/)
    if (lineMatch) {
      inner = lineMatch[1]
    }

    return inner || fallback
  } catch {
    return fallback
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
