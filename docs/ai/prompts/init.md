---
title: "Initialize Testo"
llms: prompt
llms_description: "Install Testo via Composer and make sure the latest release fits (`composer why-not`, resolving blockers with the user), generate testo.php with `vendor/bin/testo init`, verify the run, add a GitHub Actions or GitLab CI job, and wire up llm/skills for skill syncing."
prompt_category: "Setup"
---

# Initialize Testo

Set up the [Testo](https://github.com/php-testo/testo) PHP testing framework in this project. Work through the steps in order and report what you did at the end.

## 0. Read the docs first

Fetch `https://php-testo.github.io/llms.txt` before writing any config or test. Testo is **not** PHPUnit: assertions, discovery and lifecycle differ, and guessing the API from class names produces code that does not run. Escalate to `https://php-testo.github.io/llms-full.txt` when the short index does not answer a question.

## 1. Install

```bash
composer require --dev testo/testo
```

Composer quietly settles for an older release when the project's constraints rule the latest one out, so check that the newest Testo actually fits. Look up the latest version (`composer show --available testo/testo`, the first entry under `versions` that is not a `-dev` branch) and ask Composer what stands in its way:

```bash
composer why-not testo/testo <latest-version>
```

If nothing blocks it and an older version got installed anyway, rerun `composer require --dev testo/testo:^<latest-version>`. If something blocks it, try to remove the cause: usually a package pinned too tightly in `composer.json` or a conflicting dependency that needs an update. Such fixes are rarely free — updating a package, loosening a constraint, or raising the PHP requirement touches the whole project — so lay out the options and let the user choose before changing anything. If the user decides to stay on the older release, carry on with it and mention that in the report.

## 2. Generate the config

```bash
vendor/bin/testo init
```

The command creates `testo.php` in the project root, detects suite folders under `tests/` (`Unit`, `Integration`, `Functional`, `Acceptance`, `Feature`, `E2E`, `Contract`), creates `tests/Unit/` if nothing is there, and adds a `composer test` script plus one `composer test:<suite>` per detected suite.

Notes:

- In a monorepo or sub-app layout, pass the sub-app root: `vendor/bin/testo init --path=app`. Every path baked into the generated config is resolved relative to that root.
- An existing `testo.php` survives: `init` asks before overwriting it, and leaves it alone under `--no-interaction`.
- `--no-interaction` also expects `<path>/src` to exist already.

Then read `testo.php` and check `src` and the suite locations against the real layout.

## 3. Verify the run

```bash
vendor/bin/testo --json
```

`--json` prints the whole run as a single JSON object on stdout and nothing else — parse that instead of the human-readable output. Exit codes: `0` everything passed, `1` one or more tests failed, `2` invalid command or configuration.

If the project has no tests yet, write one small `#[Test]` class under `tests/Unit` so the run has something to report, and make sure it passes.

## 4. Set up CI

Ask which CI the project uses and add the single job for it. When a pipeline config already exists, add the Testo step to it and keep the caching and service containers already there.

If the existing job calls a shared reusable workflow (`uses: <org>/<repo>/.github/workflows/...`), ask the user before replacing it with a job of your own: the shared workflow is usually how the whole organization keeps CI uniform. Check whether it accepts a custom test command — if so, passing it the Testo run may be all that is needed.

### GitHub Actions — `.github/workflows/tests.yml`

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  tests:
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        php: [ '8.2', '8.3', '8.4' ]

    name: PHP ${{ matrix.php }}

    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          coverage: none

      - name: Install Composer dependencies
        uses: ramsey/composer-install@v3

      - name: Run Tests
        run: vendor/bin/testo --log-junit=runtime/junit.xml

      - name: Upload JUnit report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: junit-php${{ matrix.php }}
          path: runtime/junit.xml
```

### GitLab CI — `.gitlab-ci.yml`

```yaml
stages:
  - test

tests:
  stage: test
  image: php:8.3-cli
  before_script:
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --no-interaction --prefer-dist --no-progress
  script:
    - vendor/bin/testo --log-junit=runtime/junit.xml
  artifacts:
    when: always
    reports:
      junit: runtime/junit.xml
```

Align the PHP versions with the constraint in `composer.json`. Testo needs PHP 8.2 or newer. When the project still declares support for an older version, every supported version should stay covered by CI, so ask the user how to handle it and offer the options:

- raise the project's minimum PHP version to 8.2;
- keep a separate PHPUnit job for the older versions until the transition is over;
- knowingly accept that the older version goes untested, and say so in the report.

## 5. Offer skill syncing

Testo ships AI-agent skills (writing tests, data providers, benchmarks, coverage, migration) inside the package, and the [`llm/skills`](https://packagist.org/packages/llm/skills) Composer plugin lays them out where agents look. Offer to set it up — it is `composer require --dev "llm/skills:^1.13"` plus one `composer skills:init` — and if the offer is taken, follow <https://php-testo.github.io/docs/ai/prompts/skills.md>.

## 6. Report

Report what was installed (and, if it is not the latest Testo release, what holds it back), which suites `testo.php` declares, how the verification run ended, which CI file was added and which PHP versions it covers, and whether skill syncing was set up — and flag anything you had to guess about the project layout.
