# Testo Documentation

**Testo** - extensible PHP testing framework. Tests without TestCase inheritance, middleware architecture, PSR-14 events, separate Assert/Expect facades.

## Structure

```
docs/         # English (root)
├── index.md  # Home page
├── docs/     # Documentation pages
└── .vitepress/
    ├── config.mts       # Config: nav, sidebar, locales
    └── theme/style.css  # Custom styles (dough colors)

ru/           # Russian locale (same structure)
```

## Style Guide

**Tone:** Informal but technically accurate. Write for newcomers to Testo — use full sentences, explain concepts before showing code. Avoid telegraphic style ("Register interceptor. Call next.") — context and motivation matter.

**Home page rules:**
- DON'T show code in features (text only, 1 sentence each)
- Don't mention competitors, use "old solutions"

**Code examples:**
- List of options first, then one code block with all examples (easier to read than many small blocks)
- Keep examples compact — show structure, not implementation (when implementation doesn't matter)
- Show contrast between approaches in examples

**Text structure:**
- Avoid tautology in lists, fix typos
- Small sections sometimes better integrated into existing ones

**Markdown:** Use `::: tip`, `::: warning`, `::: info`, `::: question` blocks

**Cross-references in text:**
- Use `<plugin>Name</plugin>` when referencing a Testo plugin by name (e.g., `<plugin>Assert</plugin>`)
- Use `<class>\FQN</class>` when referencing PHP classes and interfaces (e.g., `<class>\Testo\Event\Test\TestFinished</class>`)
- Use `<attr>\FQN</attr>` for any PHP attributes — user-facing (`<attr>\Testo\Retry</attr>`) and meta-attributes (`<attr>\Testo\Pipeline\Attribute\FallbackInterceptor</attr>`)
- Use `<func>\FQN::method()</func>` for methods (e.g., `<func>\Testo\Assert::same()</func>`)
- Do NOT use plain markdown links (`[Assert](./plugins/assert.md)`) when these tags are available

## Working with Content

**Adding pages:**
1. Create both `docs/page.md` (EN) and `ru/docs/page.md` (RU)
2. Add to sidebar in `.vitepress/config.mts` for both locales
3. Internal links: `./page` or `/docs/page` (no `.html`)

**Syncing translations:**
- **CRITICAL:** When changing documentation content (adding sections, examples, explanations), ALWAYS update BOTH English and Russian versions
- This applies to content changes, NOT just translation quality fixes
- If you modify `docs/page.md`, you MUST also update `ru/docs/page.md` with the translated version
- Exception: Only fixing translation quality in `ru/` doesn't require touching English version

**Translation quality:**
- Each locale must read as if it were written natively — not as a translation from another language
- Don't mirror source sentence structure; restructure for the target language's natural flow
- Prefer active voice and short, direct sentences in both languages
- When one locale is written first: rewrite for the other, don't translate word-for-word

**Dead links:** Create stub with `::: tip Coming Soon` block

**Styles:** `.vitepress/theme/style.css` - brand colors `--vp-c-brand-1`, responsive breakpoints 960px/640px

## Blog

**Adding blog posts:**
1. Create both `blog/post.md` (EN) and `ru/blog/post.md` (RU)
2. Add link to `blog/index.md` and `ru/blog/index.md`

**Required frontmatter:**
```yaml
---
title: "Post Title"
date: 2025-01-01
description: "Short description for RSS and sharing"
image: /blog/post-name/preview.jpg
author: Author Name
---
```

- `title`, `date`, `description` — required for RSS
- `image` — used for preview in blog list, og:image for social sharing, and displayed in post header
- `author` — displayed in blog list and post header

**Optional frontmatter:**
- `outline` — controls heading levels shown in the right sidebar (table of contents):
  - `outline: [2, 3]` — show h2 and h3 (default behavior)
  - `outline: 'deep'` — show all levels (h2-h6)
  - `outline: false` — hide outline completely
  - `outline: 2` — show only h2

## llms.txt

Testo provides `llms.txt` for AI agents. Only `docs/` pages are included — blog posts are excluded from llms generation entirely (no llms frontmatter in blog files).

**Manifest:** `llms.config.ts` — project-level metadata (title, summary, key facts, base URL). Edit when project description or key facts change.

**Generator:** `.vitepress/llms.ts` — builds `llms.txt`, `llms-full.txt`, and per-page `.md` files during `buildEnd`. Only scans `docs/` directory.

**Frontmatter fields (English `docs/` pages only, not `ru/` or `blog/`):**

```yaml
---
llms: true              # default — included in "Docs" section
llms: "optional"        # included in "Optional" section (secondary content)
llms: false             # excluded from llms.txt
llms_description: "Technical description of what LLM learns from this page"
---
```

- `llms` — controls inclusion. Default is `true` (can be omitted). `"optional"` for secondary content, `false` to exclude
- `llms_description` — brief, informative note helping an LLM understand what the page covers. Required for all included pages

**Guidelines for `llms_description` (per [llmstxt.org](https://llmstxt.org) spec):**
- Start with the page's purpose ("How to ...", "Parameterized tests with ..."), then mention key entities in context
- Use concise, clear natural language — not a raw comma-separated list of class names
- Include specific classes/attributes/methods, but woven into a readable sentence
- Example: `"How to run code before/after tests. #[BeforeTest], #[AfterTest], #[BeforeClass], #[AfterClass] lifecycle hooks, execution order, priority, class instantiation behavior"`
- NOT: `"Learn about test lifecycle management"` (too vague, no entities)
- NOT: `"BeforeTest, AfterTest, BeforeClass, AfterClass, priority"` (raw list, no context)

**When adding new doc pages:** add `llms_description` to the English version frontmatter. Do NOT add llms frontmatter to blog posts.

## FAQ (`::: question`)

Questions can be written anywhere in the article using `::: question` blocks. At build time, they are extracted from their original positions and grouped into collapsible FAQ accordions.

**Syntax:**
```md
::: question Can I run tests without config?
Yes, Testo looks for tests in the `tests` folder by default.
:::
```

**Frontmatter `faqLevel`** controls where questions are rendered:

```yaml
---
faqLevel: 1       # default — end of each h1 section (= end of page for most docs)
faqLevel: 2       # end of each h2 section
faqLevel: 0       # end of page (ignores headings)
faqLevel: false   # no collection — questions stay in place as inline spoilers
---
```

**Plugin:** `.vitepress/faq.ts` — markdown-it block rule + core rule, no external dependencies.

**Styles:** `.vitepress/theme/style.css` — `.faq-section`, `.faq-item` classes.

## API Signatures (`<signature>`)

For documenting methods, functions, and PHP attributes in API reference pages. Renders a highlighted PHP signature box with description, parameters, and examples.

**Plugin:** `.vitepress/func-block.ts` — markdown-it block rule, Shiki highlighting.

**Styles:** `.vitepress/theme/style.css` — `.func-block`, `.func-sig` classes.

**Full syntax (function):**
```html
<signature h="3" name="\Testo\Assert::same(mixed $actual, mixed $expected, string $message = ''): void">
<short>Checks strict equality of two values.</short>
<description>Uses `===` comparison. Unlike `equals()`, does not perform type coercion.</description>
<param name="$actual">The value being checked.</param>
<param name="$expected">The expected value.</param>
<example>
```php
Assert::same($user->role, 'admin');
```
</example>
</signature>
```

**Attribute signature syntax:**
```html
<signature h="2" name="#[\Testo\Retry(int $maxAttempts = 3, bool $markFlaky = true)]">
<short>Declares a retry policy for a test on failure.</short>
</signature>
```

Attribute signatures are detected by the `#[` prefix in `name`. The `#[...]` wrapper is preserved in the rendered signature box. Headings display as `#[ShortName]` (e.g., `#[Retry]`). The inner FQN (without `#[...]`) is used for registry lookup and `<attr>` cross-references.

**Attributes:**
- `name` (required) — full signature. For functions: FQN with types and return type (`\Testo\Assert::method`). For attributes: `#[\Namespace\AttrName(params)]`. Namespace is stripped for display.
- `h` — heading level for auto-generated heading (`"3"` → `<h3>Assert::same</h3>` or `<h2>#[Retry]</h2>`). Default: `"0"` (bold text, no heading).
- `compact` — compact rendering mode: signature + short + description inline, no card/sections. Good for simple methods in lists.

**Inner tags (all optional):**
- `<short>...</short>` — one-liner rendered between heading and signature box. Super brief summary of the method.
- `<description>...</description>` — detailed method description, supports full markdown (paragraphs, lists, code blocks, etc.). Rendered below the signature box.
- `<param name="$foo">...</param>` — parameter description (inline markdown). Rendered under localized "Parameters:" / "Параметры:" label.
- `<example>...</example>` — full markdown block (code fences, text, etc.). Multiple allowed. Rendered under localized "Examples:" / "Примеры:" label.

**Minimal usage (no description, no params):**
```html
<signature name="Assert::true(mixed $actual): void">
</signature>
```

## Inline References (`<func>`)

For cross-referencing methods inline within text. Renders as Shiki-highlighted code with a hover tooltip showing the full signature and description.

**Plugin:** `.vitepress/func-block.ts` — markdown-it inline rule. **Registry:** `.vitepress/func-registry.ts` — pre-scans all `.md` files at startup.

**Syntax:**
```html
<func>\Testo\Assert::blank()</func>
```

Renders as `Assert::blank()` with syntax highlighting. On hover, shows a tooltip with the full signature and `<short>` description from the corresponding `<signature>` block.

**Behavior:**
- If the referenced `<signature>` has `h > 0` (navigable anchor), the reference is a clickable link
- If `h="0"` or no `h`, the reference shows tooltip only (no link)
- If FQN is not found in any `<signature>` block, renders as plain `<code>`
- Locale-aware: EN pages reference EN signatures, RU pages reference RU signatures

**Registry:** All `<signature>` blocks with FQN names (starting with `\`) are collected at build startup. The `<func>` tag content is matched by stripping arguments: `\Testo\Assert::blank()` matches `\Testo\Assert::blank(mixed $actual, string $message = ''): void`.

## Attribute References (`<attr>`)

For cross-referencing PHP attributes inline within text. Renders as `#[ShortName]` with Shiki highlighting and a hover tooltip showing the full signature and description.

**Plugin:** `.vitepress/func-block.ts` — markdown-it inline + block rules. **Registry:** `.vitepress/func-registry.ts` — separate attribute registry (parallel to function registry).

**Syntax:**
```html
<attr>\Testo\Retry</attr>
```

Takes the plain FQN (without `#[...]`) and renders as `#[Retry]` with syntax highlighting. On hover, shows a tooltip with the full attribute signature and `<short>` description from the corresponding `<signature>` block.

**Behavior:**
- Same linking/tooltip rules as `<func>`: link if `h > 0`, tooltip-only otherwise, plain `<code>` if not found
- The `#[...]` wrapping is added automatically — always pass plain FQN in the tag
- Locale-aware: EN pages reference EN signatures, RU pages reference RU signatures
- Uses a separate registry from `<func>` to avoid FQN collisions

## Class References (`<class>`)

For referencing PHP classes inline. Renders the short class name (without namespace) with a hover tooltip showing the full FQN.

**Plugin:** `.vitepress/func-block.ts` — inline + block rules.

**Syntax:**
```html
<class>\Testo\Assert</class>
```

Renders as `Assert` styled as inline code. On hover, shows a tooltip with the full class name `\Testo\Assert`.

**Behavior:**
- Works both inline (inside text) and at the start of a line (block rule wraps in paragraph)
- Namespace is stripped for display: `\Testo\Assert\AssertPlugin` → `AssertPlugin`
- Styled as inline `<code>` with `var(--vp-code-color)` and `var(--vp-code-bg)`

**Styles:** `.vitepress/theme/style.css` — `.class-ref` class.

## Plugin References (`<plugin>`)

For linking to plugin documentation pages by name. Renders as a clickable link to the plugin's page.

**Plugin:** `.vitepress/func-block.ts` — inline + block rules. **Registry:** `.vitepress/plugin-block.ts` — collects `<plugin-info>` blocks.

**Syntax:**
```html
<plugin>Assert</plugin>
```

Renders as a link to the Assert plugin page. The name is matched case-insensitively against `<plugin-info>` blocks.

**Behavior:**
- Lookup by `name` attribute from `<plugin-info>` tags (case-insensitive)
- If no match found, renders as plain text
- Locale-aware: EN pages link to EN plugin pages, RU to RU

## Plugin Info Card (`<plugin-info>`)

Block-level tag for plugin documentation pages. Renders a styled info card with plugin class, inclusion status, and optional links. Also registers the plugin in the registry for `<plugin>` cross-references.

**Plugin:** `.vitepress/plugin-block.ts` — markdown-it block rule + registry with pre-scan.

**Syntax:**
```html
<plugin-info class="\Testo\Assert\AssertPlugin" name="Assert" included="\Testo\Application\Config\Plugin\SuitePlugins" />
<plugin-info class="\Testo\Convention\ConventionPlugin" name="Convention" />
<plugin-info class="\Testo\Filter\FilterPlugin" name="Filter" included="\Testo\Application\Config\Plugin\ApplicationPlugins" github="https://..." />
```

**Attributes:**
- `class` (required) — FQN of the plugin class. Rendered as `<class>` with tooltip.
- `name` (required) — human-readable plugin name. Used for `<plugin>` cross-references.
- `included` — FQN of the plugin set (e.g. `\Testo\Application\Config\Plugin\SuitePlugins`). Rendered as `<class>` with tooltip. Omit if the plugin must be registered manually.
- `github` — URL to plugin's GitHub page (optional).

## VitePress Commands

```bash
npm run docs:dev      # Dev server at localhost:5173
npm run docs:build    # Build to .vitepress/dist/
npm run docs:preview  # Preview build
```

## Configuration

**File:** `.vitepress/config.mts`

- `locales`: root (EN) + `ru` (RU) with separate nav/sidebar
- `cleanUrls: true`, `lastUpdated: true`, `search.provider: 'local'`
- Nav and Sidebar defined in `themeConfig` for each locale
- Sidebar sections: Introduction, Guide, Customization

---

# Гайдлайн по переводу документации на Русский язык

## Основные принципы

1. **Естественность важнее дословности**
   - Перевод должен звучать так, как говорят русские разработчики
   - Избегать кальки с английского, если это звучит неестественно

2. **Сохранять технические термины**
   - Не переводить названия классов, методов, атрибутов, пакетов
   - Оставлять код примеры без изменений

## Терминология

### Устоявшиеся термины

| Английский | ❌ Неправильно | ✅ Правильно | Примечание |
|------------|----------------|--------------|------------|
| test | — | тест | Один метод теста или InlineTest |
| test case | тестовый случай | Test Case / тест-кейс / тестовый класс / класс тестов / набор тестов | Класс/файл с тестами. Выбор зависит от контекста |
| test suite | тестовый набор | Test Suite / комплект тестов | Глобальная группа (Unit, Feature). Предпочтительно без перевода |
| data provider | поставщик данных | провайдер данных | |
| dataset | — | датасет / набор данных | Оба допустимы |
| callable | вызываемый | вызываемый объект | В контексте |
| closure | закрытие | замыкание | |

### Иерархия Testo

Важно понимать правильную иерархию компонентов:

1. **Test Suite** (комплект тестов) - Unit, Integration, Feature
   - События: `TestSuite*` (TestSuiteStarting, TestSuiteFinished)
2. **Test Case** (тестовый класс) - UserTest, OrderTest
   - События: `TestCase*` (TestCaseStarting, TestCaseFinished)
3. **Test** (тестовый метод или функция) - testLogin(), testCreate()
   - События: `Test*` (TestStarting, TestFinished, TestBatchStarting)

### Специфичные фразы

| Английский | ❌ Неправильно | ✅ Правильно |
|------------|----------------|--------------|
| Simple as that | Просто как это | Вот так просто |
| right on the method | прямо на методе | непосредственно над методом |

## Стилистика

1. **Избегать канцеляризмов**
   - Вместо "тестовый случай" → "тест"
   - Вместо "осуществить проверку" → "проверить"

2. **Сохранять тон оригинала**
   - Если оригинал неформальный и дружелюбный — перевод тоже
   - Технические термины оставлять точными

3. **Порядок слов**
   - Использовать естественный русский порядок слов
   - Не копировать английскую структуру предложения

4. **Термин + конкретное значение**
   - При упоминании технического термина с конкретным значением использовать дефис для разделения
   - Примеры:
     - ✅ "Test Suite - Unit" (не "Test Suite Unit")
     - ✅ "комплект тестов Unit" (альтернатива)
     - ✅ "провайдер данных - UserDataProvider"

## Проверка качества

Перед финализацией перевода задать вопросы:
- Так ли говорят русские разработчики?
- Звучит ли фраза естественно при чтении вслух?
- Сохранен ли технический смысл оригинала?
