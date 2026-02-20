/**
 * Configuration for llms.txt generation.
 *
 * This file contains project-level metadata that can't be specified
 * in individual documentation files' frontmatter.
 *
 * Individual pages control their inclusion via frontmatter:
 *   llms: true (default) | "optional" | false
 *   llms_description: "Short description for LLM context"
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
}
