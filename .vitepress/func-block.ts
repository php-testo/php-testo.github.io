/**
 * Function/attribute signature block plugin for markdown-it.
 *
 * Tags:
 *   <signature> — API reference card with Shiki-highlighted PHP signature (functions and attributes)
 *   <func>      — inline/block cross-reference to a function <signature> (tooltip + link)
 *   <attr>      — inline/block cross-reference to an attribute <signature> (tooltip + link)
 *   <class>     — inline/block tag rendering short class name with FQN tooltip
 *   <plugin>    — inline/block link to a plugin page by name (from plugin-block registry)
 */
import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import { getLocaleByPath, type LocaleConfig } from './locales'
import { getEntry, getAttrEntry, getClassEntry } from './func-registry'
import { getPluginEntry } from './plugin-block'

interface Param {
  name: string
  desc: string
}

// ─── Helpers ─────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripNamespace(signature: string): { display: string } {
  const match = signature.match(/^\\?(?:[A-Za-z_]\w*\\)+(.*)$/)
  return { display: match ? match[1] : signature }
}

function stripNamespaceShort(fqn: string): string {
  const idx = fqn.lastIndexOf('\\')
  return idx !== -1 ? fqn.slice(idx + 1) : fqn
}

function extractShortName(display: string): string {
  const match = display.match(/^([A-Za-z_]\w*(?:::|->)[A-Za-z_]\w*)/)
  if (match) return match[1]
  const funcMatch = display.match(/^([A-Za-z_]\w*)/)
  return funcMatch ? funcMatch[1] : display
}

function buildSlug(signature: string): string {
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

function highlightSignature(md: MarkdownIt, signature: string): string {
  const fallback = escapeHtml(signature)
  const highlight = md.options.highlight
  if (!highlight) return fallback

  try {
    const result = highlight('<?php\n' + signature, 'php', '')
    const codeMatch = result.match(/<code[^>]*>([\s\S]*?)<\/code>/)
    if (!codeMatch) return fallback

    let inner = codeMatch[1].trim()
    const newlineIdx = inner.indexOf('\n')
    if (newlineIdx !== -1) inner = inner.slice(newlineIdx + 1).trim()

    const lineMatch = inner.match(/^<span class="line">([\s\S]*)<\/span>$/)
    if (lineMatch) inner = lineMatch[1]

    return inner || fallback
  } catch {
    return fallback
  }
}

// ─── Inline tag renderers (return HTML string) ──────────

function renderRefHtml(
  md: MarkdownIt,
  rawFqn: string,
  locale: LocaleConfig | undefined,
  lookupEntry: typeof getEntry,
  wrapDisplay?: (display: string) => string,
  extraClass?: string,
): string {
  const baseDisplay = stripNamespace(rawFqn).display
  const displayFqn = wrapDisplay ? wrapDisplay(baseDisplay) : baseDisplay
  const entry = lookupEntry(locale?.code ?? 'en', rawFqn)

  if (entry) {
    const sigHtml = highlightSignature(md, entry.signature)
    const displayHtml = highlightSignature(md, displayFqn) || escapeHtml(displayFqn)
    const shortHtml = entry.short ? md.renderInline(entry.short) : ''

    const tooltip = `<span class="func-ref-tooltip">`
      + `<code class="func-ref-tooltip-sig vp-code">${sigHtml}</code>`
      + (shortHtml ? `<span class="func-ref-tooltip-short">${shortHtml}</span>` : '')
      + `</span>`

    const cls = extraClass ? `func-ref ${extraClass} vp-code` : 'func-ref vp-code'

    if (entry.hasAnchor) {
      const href = entry.pagePath + '#' + entry.slug
      return `<a href="${href}" class="${cls}">${displayHtml}${tooltip}</a>`
    }

    return `<span class="${cls}">${displayHtml}${tooltip}</span>`
  }

  return `<code>${escapeHtml(displayFqn)}</code>`
}

function renderFuncRefHtml(md: MarkdownIt, rawFqn: string, locale?: LocaleConfig): string {
  return renderRefHtml(md, rawFqn, locale, getEntry)
}

function renderAttrRefHtml(md: MarkdownIt, rawFqn: string, locale?: LocaleConfig): string {
  return renderRefHtml(md, rawFqn, locale, getAttrEntry, (d) => '#[' + d + ']', 'attr-ref')
}

function renderKlassRefHtml(md: MarkdownIt, fqn: string, locale?: LocaleConfig): string {
  const short = stripNamespaceShort(fqn)
  const entry = getClassEntry(locale?.code ?? 'en', fqn)

  if (entry) {
    const sigHtml = highlightSignature(md, entry.signature)
    const shortHtml = entry.short ? md.renderInline(entry.short) : ''

    const tooltip = `<span class="func-ref-tooltip">`
      + `<code class="func-ref-tooltip-sig vp-code">${sigHtml}</code>`
      + (shortHtml ? `<span class="func-ref-tooltip-short">${shortHtml}</span>` : '')
      + `</span>`

    if (entry.hasAnchor) {
      const href = entry.pagePath + '#' + entry.slug
      return `<a href="${href}" class="class-ref func-ref vp-code">${escapeHtml(short)}${tooltip}</a>`
    }

    return `<span class="class-ref func-ref vp-code">${escapeHtml(short)}${tooltip}</span>`
  }

  // Fallback: FQN tooltip only
  const tooltip = `<span class="func-ref-tooltip"><code class="func-ref-tooltip-sig vp-code">${escapeHtml(fqn)}</code></span>`
  return `<span class="class-ref func-ref vp-code">${escapeHtml(short)}${tooltip}</span>`
}

function renderPluginRefHtml(name: string, locale?: LocaleConfig): string {
  const entry = getPluginEntry(locale?.code ?? 'en', name)
  if (entry) {
    return `<a href="${escapeHtml(entry.pagePath)}" class="plugin-ref">${escapeHtml(entry.name)}</a>`
  }
  return escapeHtml(name)
}

// ─── Generic rule registration ──────────────────────────

/**
 * Register an inline rule that matches <tagName>...</tagName> and pushes a token.
 */
function registerInlineTag(
  md: MarkdownIt,
  tagName: string,
  tokenType: string,
  anchor: { after: string } | { before: string },
  opts?: { withLocale?: boolean },
) {
  const openTag = `<${tagName}>`
  const closeTag = `</${tagName}>`

  const rule = (state: StateInline, silent: boolean) => {
    if (state.src.slice(state.pos, state.pos + openTag.length) !== openTag) {
        return false
    }

    const closeIdx = state.src.indexOf(closeTag, state.pos + openTag.length)
    if (closeIdx === -1) return false

    if (silent) return true

    const token = state.push(tokenType, '', 0)
    token.content = state.src.slice(state.pos + openTag.length, closeIdx).trim()

    if (opts?.withLocale) {
      const relativePath = state.env?.relativePath || ''
      token.meta = { locale: getLocaleByPath('/' + relativePath) }
    }

    state.pos = closeIdx + closeTag.length
    return true
  }

  if ('after' in anchor) {
    md.inline.ruler.after(anchor.after, tokenType, rule)
  } else {
    md.inline.ruler.before(anchor.before, tokenType, rule)
  }
}

/**
 * Register a block rule that catches <tagName>...</tagName> at line start,
 * renders the tag via renderContent(), and wraps the rest of the line in a paragraph.
 */
function registerBlockParagraphTag(
  md: MarkdownIt,
  ruleName: string,
  tagName: string,
  renderContent: (content: string, state: StateBlock, startLine: number) => string,
) {
  const openTag = `<${tagName}>`
  const closeTag = `</${tagName}>`

  md.block.ruler.before('html_block', ruleName, (state, startLine, _endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const line = state.src.slice(pos, max)

    if (!line.startsWith(openTag)) return false

    const closeIdx = line.indexOf(closeTag)
    if (closeIdx === -1) return false

    if (silent) return true

    const content = line.slice(openTag.length, closeIdx).trim()
    const afterTag = line.slice(closeIdx + closeTag.length)
    const renderedHtml = renderContent(content, state, startLine)

    const openToken = state.push('paragraph_open', 'p', 1)
    openToken.map = [startLine, startLine + 1]

    const inlineToken = state.push('inline', '', 0)
    inlineToken.content = renderedHtml + afterTag
    inlineToken.map = [startLine, startLine + 1]
    inlineToken.children = []

    state.push('paragraph_close', 'p', -1)

    state.line = startLine + 1
    return true
  })
}

// ─── Plugin ──────────────────────────────────────────────

export function funcBlockPlugin(md: MarkdownIt) {

  // ── Block rules for inline tags at line start ──

  registerBlockParagraphTag(md, 'class_block', 'class', (fqn, state) => {
    const relativePath = state.env?.relativePath || ''
    const locale = getLocaleByPath('/' + relativePath)
    return renderKlassRefHtml(md, fqn, locale)
  })

  registerBlockParagraphTag(md, 'func_line', 'func', (rawFqn, state) => {
    const relativePath = state.env?.relativePath || ''
    const locale = getLocaleByPath('/' + relativePath)
    return renderFuncRefHtml(md, rawFqn, locale)
  })

  registerBlockParagraphTag(md, 'plugin_line', 'plugin', (name, state) => {
    const relativePath = state.env?.relativePath || ''
    const locale = getLocaleByPath('/' + relativePath)
    return renderPluginRefHtml(name, locale)
  })

  registerBlockParagraphTag(md, 'attr_line', 'attr', (rawFqn, state) => {
    const relativePath = state.env?.relativePath || ''
    const locale = getLocaleByPath('/' + relativePath)
    return renderAttrRefHtml(md, rawFqn, locale)
  })

  // ── <signature> block rule (multi-line) ──

  md.block.ruler.before('html_block', 'func_block', (state, startLine, endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const firstLine = state.src.slice(pos, max)

    if (!firstLine.startsWith('<signature ')) return false
    if (silent) return true

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

    const relativePath = state.env?.relativePath || ''
    token.meta = { locale: getLocaleByPath('/' + relativePath) }

    state.line = closeLine + 1
    return true
  })

  md.renderer.rules['func_block'] = (tokens, idx, _options, env) => {
    return renderFuncBlock(md, tokens[idx].content, tokens[idx].meta?.locale, env)
  }

  // ── Inline rules ──

  registerInlineTag(md, 'func', 'func_ref', { before: 'html_inline' }, { withLocale: true })
  registerInlineTag(md, 'class', 'class_ref', { after: 'func_ref' }, { withLocale: true })
  registerInlineTag(md, 'plugin', 'plugin_ref', { after: 'class_ref' }, { withLocale: true })
  registerInlineTag(md, 'attr', 'attr_ref', { after: 'plugin_ref' }, { withLocale: true })

  // ── Inline renderers ──

  md.renderer.rules['func_ref'] = (tokens, idx) => {
    const { content, meta } = tokens[idx]
    return renderFuncRefHtml(md, content, meta?.locale)
  }

  md.renderer.rules['class_ref'] = (tokens, idx) => {
    const { content, meta } = tokens[idx]
    return renderKlassRefHtml(md, content, meta?.locale)
  }

  md.renderer.rules['plugin_ref'] = (tokens, idx) => {
    const { content, meta } = tokens[idx]
    return renderPluginRefHtml(content, meta?.locale)
  }

  md.renderer.rules['attr_ref'] = (tokens, idx) => {
    const { content, meta } = tokens[idx]
    return renderAttrRefHtml(md, content, meta?.locale)
  }
}

// ─── <signature> block renderer ─────────────────────────

function renderFuncBlock(md: MarkdownIt, raw: string, locale?: LocaleConfig, env?: any): string {
  const nameMatch = raw.match(/<signature\s+[^>]*name="([^"]*)"/)
  if (!nameMatch) return ''
  const signature = nameMatch[1]

  const hMatch = raw.match(/<signature\s+[^>]*h="([^"]*)"/)
  const headingLevel = hMatch ? parseInt(hMatch[1], 10) : 0

  const compact = /^<signature\s+[^>]*\bcompact\b/.test(raw)

  const openEnd = raw.indexOf('>')
  const closeStart = raw.lastIndexOf('</signature>')
  if (openEnd === -1 || closeStart === -1) return ''
  const body = raw.slice(openEnd + 1, closeStart)

  const shortMatch = body.match(/<short>([\s\S]*?)<\/short>/)
  const short = shortMatch ? shortMatch[1].trim() : ''

  const descMatch = body.match(/<description>([\s\S]*?)<\/description>/)
  const description = descMatch ? descMatch[1].trim() : ''

  const params: Param[] = []
  const paramRe = /<param\s+name="([^"]*)">([\s\S]*?)<\/param>/g
  let m: RegExpExecArray | null
  while ((m = paramRe.exec(body)) !== null) {
    params.push({ name: m[1], desc: m[2].trim() })
  }

  const examples: string[] = []
  const exampleRe = /<example>([\s\S]*?)<\/example>/g
  let em: RegExpExecArray | null
  while ((em = exampleRe.exec(body)) !== null) {
    examples.push(em[1].trim())
  }

  const isAttr = signature.startsWith('#[')
  const isClass = !isAttr && signature.startsWith('new ')
  const innerSig = isAttr ? signature.slice(2, -1) : isClass ? signature.slice(4) : signature
  const { display: innerDisplay } = stripNamespace(innerSig)
  const display = isAttr ? '#[' + innerDisplay + ']' : isClass ? 'new ' + innerDisplay : innerDisplay
  const rawShortName = extractShortName(innerDisplay)
  const shortName = isAttr ? '#[' + rawShortName + ']' : rawShortName
  const paramsLabel = locale?.signatureParamsLabel ?? 'Parameters:'
  const examplesLabel = locale?.signatureExamplesLabel ?? 'Examples:'
  const slug = buildSlug(innerSig)
  const sigHtml = highlightSignature(md, display)

  if (compact) {
    const shortHtml = short ? md.renderInline(short) : ''
    const compactDescHtml = description ? md.render(description, env) : ''

    let html = '<div class="func-compact">'

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

  const descHtml = description ? md.render(description, env) : ''
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
