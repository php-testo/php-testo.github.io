---
outline: [2, 3]
llms_description: "How to run Infection mutation testing with Testo. Install the testo/bridge-infection adapter (or use the Infection Phar, which already bundles it). Configure infection.json with testFramework: testo and tmpDir. Register CodecovPlugin in testo.php with a PhpUnitXmlReport pointing at <tmpDir>/infection/coverage-xml. Reuse existing coverage with Infection's --coverage flag."
---

# Infection

[Infection](https://infection.github.io/) is a [mutation testing](/docs/theory/mutation-testing.md) tool for PHP. Testo connects to it through a dedicated adapter, `testo/bridge-infection`.

::: info Package
`testo/bridge-infection` — Infection extension. Auto-registers via Composer. No plugin needs to be added to `testo.php`.
:::

## Installation

Install Infection and the integration package as dev dependencies:

```bash
composer require --dev infection/infection testo/bridge-infection
```

::: warning
If you use the [Phar archive of Infection](https://infection.github.io/guide/installation.html#Phar), you don't need to install the adapter separately — it is already bundled inside the Phar.
:::

## Configuration

Infection requires two reports from Testo:

- **Coverage XML** — a directory of XML files in PHPUnit's coverage format. Tells Infection which tests cover which lines, so it can run only the relevant subset for each mutant. **Required**.
- **JUnit XML** — a single test-results file. Helps Infection quickly map a test to the file it lives in, so Testo's filters can be used more efficiently. **Optional**, but strongly recommended.

Infection looks for both reports in a fixed layout:

```
└── <tmpDir>/
    └── infection/
        ├── coverage-xml/*.xml
        └── junit.xml
```

::: danger Important:
`tmpDir` has to be set in Infection's configuration, and the path to `coverage-xml` — in `testo.php`.
:::

### infection.json

In Infection's configuration (usually `infection.json`), declare that you're using Testo and set the temporary directory:

```json
{
    "$schema": "vendor/infection/infection/resources/schema.json",
    "source": {
        "directories": ["src"]
    },
    "testFramework": "testo",
    "tmpDir": "runtime",
    "logs": {
        "text": "runtime/infection.log",
        "html": "runtime/infection.html"
    }
}
```

### testo.php

Register the <plugin>Codecov</plugin> plugin with a <class>\Testo\Codecov\Report\PhpUnitXmlReport</class> entry pointing at `<tmpDir>/infection/coverage-xml`:

```php
use Testo\Application\Config\ApplicationConfig;
use Testo\Codecov\CodecovPlugin;
use Testo\Codecov\Report\PhpUnitXmlReport;

return new ApplicationConfig(
    src: ['src'],
    plugins: [
        new CodecovPlugin(
            reports: [
                new PhpUnitXmlReport(__DIR__ . '/runtime/infection/coverage-xml'),
            ],
        ),
    ],
);
```

::: info
Coverage requires the PCOV or XDebug extension. See the <plugin>Codecov</plugin> page for setup details and the trade-offs between the two.
:::

## Running

```bash
XDEBUG_MODE=coverage vendor/bin/infection
```

PCOV works too — driver requirements come from <plugin>Codecov</plugin>, not from Infection.

Infection runs Testo twice:

1. **Initial run** — executes the full test suite against the original source, collecting coverage and a JUnit log. This is the slow phase: every test runs and the coverage driver is active.
2. **Mutant runs** — for each mutant, Infection picks only the tests that touch the mutated lines and runs them. Coverage is not collected here, so each mutant runs quickly.

### Reusing existing coverage

If a coverage report has already been generated — for example, in an earlier CI step — you can hand it to Infection instead of triggering a fresh Testo run via the [`--coverage` flag](https://infection.github.io/guide/command-line-options.html#coverage):

```bash
vendor/bin/infection --coverage=runtime/infection
```

In this mode Infection skips its own initial run, and the supplied directory must already contain the reports.

To produce them, run Testo with `--coverage --log-junit=<tmpDir>/infection/junit.xml` — the same flags the adapter uses for the initial run. The folder structure and file names must match what Infection expects.
