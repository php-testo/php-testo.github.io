/**
 * Configuration for llms.txt generation.
 *
 * This file contains project-level metadata that can't be specified
 * in individual documentation files' frontmatter.
 *
 * Individual pages control their inclusion via frontmatter:
 *   llms: true (default) | "optional" | "prompt" | "header" | "footer" | false
 *   llms_description: "Short description for LLM context"
 *
 * "prompt" pages are ready-made prompts for AI agents: the page body is the
 * prompt text itself, listed in a dedicated "Prompts" section and served
 * as-is (frontmatter stripped) at its per-page .md URL. See docs/ai/prompts.md.
 */

export const llmsConfig = {
  /**
   * Project name — used as H1 heading in llms.txt
   */
  title: 'Testo',

  /**
   * Brief project summary — rendered as blockquote after H1
   */
  summary:
    'Testo is an extensible PHP testing framework. Includes Unit testing, Inline testing, Benchmarking, and a PhpStorm plugin for test generation and execution.',

  /**
   * Key facts about the project — rendered as a list before doc sections.
   * Keep concise and factual, oriented at what an LLM needs to know.
   */
  details: [
    'Install: `composer require --dev testo/testo`',
    'GitHub: https://github.com/php-testo/testo',
    'PhpStorm plugin: https://plugins.jetbrains.com/plugin/28842-testo',
  ],

  /**
   * Base URL for documentation links in llms.txt.
   * Page paths from frontmatter are appended to this.
   */
  baseUrl: '',

  /**
   * Section name for documentation pages
   */
  docsSection: 'Docs',

  /**
   * Section name for pages with llms: "optional"
   */
  optionalSection: 'Optional',

  /**
   * Section name for pages with llms: "prompt"
   */
  promptsSection: 'Prompts',

  /**
   * Line rendered under the prompts heading. Prompt pages are excluded from
   * llms-full.txt, so this is the only place their nature is explained.
   */
  promptsSectionNote:
    'Each link below is a standalone task prompt, not reference material. Fetch one only when the user asks for that task, and treat its contents as a plan to follow.',
}
