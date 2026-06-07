---
outline: [2, 3]
llms_description: "How to run Infection mutation testing with Testo. Install the testo/bridge-infection adapter (or use the Infection Phar, which already bundles it). Configure infection.json with just testFramework: testo. No coverage wiring is needed in testo.php — the adapter passes --coverage-xml and --log-junit itself, activating the default (shadow) CodecovPlugin. Reuse existing coverage with Infection's --coverage flag."
---

# Infection

[Infection](https://infection.github.io/) is a [mutation testing](/docs/theory/mutation-testing.md) tool for PHP. Testo connects to it through a dedicated adapter, `testo/bridge-infection`.

::: info Package
`testo/bridge-infection` — Infection extension. Auto-registers via Composer. No plugin needs to be added to `testo.php`.
:::

## Setup

Install Infection and the integration package as dev dependencies:

```bash
composer require --dev infection/infection testo/bridge-infection
```

::: warning
If you use the [Phar archive of Infection](https://infection.github.io/guide/installation.html#Phar), you don't need to install the adapter separately — it is already bundled inside the Phar.
:::

In Infection's configuration (usually `infection.json`), just declare that tests run through Testo:

```json
{
    "$schema": "vendor/infection/infection/resources/schema.json",
    "source": {
        "directories": ["src"]
    },
    "testFramework": "testo"
}
```

Coverage requires the PCOV or XDebug extension. See the <plugin>Codecov</plugin> page for setup details and the trade-offs between the two.

Then run mutation testing as usual — through the [JetBrains IDE plugin](https://plugins.jetbrains.com/plugin/28650-infection) or from the console:

```bash
vendor/bin/infection
```

## How it works

This section is for the curious. For everyday use, the setup above is all you need.

### The reports Infection needs

Infection takes two reports from Testo:

- **Coverage XML** — a directory of XML files in PHPUnit's coverage format. Tells Infection which tests cover which lines, so it can run only the relevant subset for each mutant. **Required**.
- **JUnit XML** — a single test-results file. Helps Infection quickly map a test to the file it lives in, so Testo's filters can be used more efficiently. **Optional**, but recommended.

The adapter requests both reports from Testo automatically: on the initial run it passes `--coverage`, `--coverage-xml=<tmpDir>/infection/coverage-xml`, and `--log-junit=<tmpDir>/infection/junit.xml`. These flags activate the default (shadow) <plugin>Codecov</plugin> plugin, so the reports are produced even when `testo.php` declares no coverage plugin at all.

Infection looks for the reports in a fixed layout relative to its `tmpDir`:

```
└── <tmpDir>/
    └── infection/
        ├── coverage-xml/*.xml
        └── junit.xml
```

`tmpDir` is an option in Infection's config (`infection.json`); by default it's the system temp directory. Infection itself appends the `infection/` subdirectory inside it, and the adapter passes Testo the ready-made paths.

### The two-phase run

Infection runs Testo twice:

1. **Initial run** — executes the full test suite against the original source, collecting coverage and a JUnit log. This is the slow phase: every test runs and the coverage driver is active.
2. **Mutant runs** — for each mutant, Infection picks only the tests that touch the mutated lines and runs them. Coverage is not collected here, so each mutant runs quickly.

### Reusing existing coverage

If a coverage report has already been generated — for example, in an earlier CI step — you can hand it to Infection instead of triggering a fresh Testo run via the [`--coverage` flag](https://infection.github.io/guide/command-line-options.html#coverage):

```bash
vendor/bin/infection --coverage=runtime/infection
```

In this mode Infection skips its own initial run, and the supplied directory must already contain the reports.

To produce them, run Testo with the same flags the adapter uses for the initial run:

```bash
vendor/bin/testo run --coverage \
    --coverage-xml=runtime/infection/coverage-xml \
    --log-junit=runtime/infection/junit.xml
```

The folder structure and file names must match what Infection expects.

### Extra reports

If you also want other reports beyond mutation testing (e.g. Clover for Codecov.io), add your own <class>\Testo\Codecov\CodecovPlugin</class> with the desired generators. It does not conflict with the adapter's flags — both sets of reports are merged into a single coverage collection (see the [CLI activation](/docs/plugins/codecov.md) section of the Codecov plugin):

```php
use Testo\Application\Config\ApplicationConfig;
use Testo\Codecov\CodecovPlugin;
use Testo\Codecov\Report\CloverReport;

return new ApplicationConfig(
    src: ['src'],
    plugins: [
        new CodecovPlugin(
            reports: [
                new CloverReport(__DIR__ . '/runtime/clover.xml', 'MyProject'),
            ],
        ),
    ],
);
```
