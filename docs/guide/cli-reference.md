---
llms_description: "How to run Testo from the command line. Available flags: --config, --teamcity, --json, --log-json, --log-junit, --suite, --path, --filter, --type, --group. Filter combination logic (OR within type, AND across types), type and group include/exclude selection (leading ! excludes), JSON output for agents and CI, exit codes."
---

# Command Line Interface

This document describes the command line interface for Testo.

::: info Binary Path
If Testo is installed via Composer, the binary path will be `vendor/bin/testo`. The examples below use just `testo` for brevity, but in real projects use `vendor/bin/testo` or set up an alias in your environment.
:::

## Commands

### `testo run`

Execute test suites with optional filtering and output formatting.

This is the default command and can be omitted when using flags.

```bash
testo run [options]
testo [options]  # run is optional
```

**Examples:**
```bash
# Explicit run command
testo run
testo run --suite=Unit

# Implicit run command (default)
testo
testo --suite=Unit
```

## Common Configuration Flags

### `--config`

Specify path to configuration file.

**Default:** `./testo.php`

**Examples:**
```bash
testo run --config=./custom-testo.php
testo run --suite=Integration --config=./ci-testo.php
```

## Running Tests

### Output Formatting

#### `--teamcity`

Enable TeamCity service message format for JetBrains IDE integration.

Used by the [Testo plugin](https://plugins.jetbrains.com/plugin/28842-testo) for PHPStorm/IntelliJ IDEA and TeamCity CI server.

**Examples:**
```bash
testo --teamcity
testo --suite=Unit --teamcity
```

#### `--json`

Render the whole run as a single minimalistic JSON object on stdout — and nothing else. The JSON report is meant for machine consumers: AI agents and CI scripts that need to parse results instead of scraping the ANSI output.

The report contains only what's needed to act on a failing run: the overall `status`, `duration`, per-status `totals`, and a flat `failures[]` list. Each failure carries the test FQN, exception type, message, file and line, a trimmed stack trace, the chain of previous exceptions (`causedBy`), and any captured output.

`--json` is mutually exclusive with `--teamcity` — both render to stdout. To get JSON alongside a human-readable run, use `--log-json` instead.

```bash
testo --json
testo --suite=Unit --json
```

#### `--log-json`

Write the JSON report to a file while keeping the regular terminal output active. Mirrors `--log-junit`.

```bash
testo --log-json=runtime/report.json
testo --suite=Unit --log-json=runtime/report.json
```

#### `--log-junit`

Write a JUnit XML report to the given path (overrides the JUnit plugin config). Keeps the terminal output active.

```bash
testo --log-junit=runtime/junit.xml
```

### Filtering

Testo provides several filters that can be combined to selectively run tests.

**Filter Combination Logic:**
- Same type filters use OR logic: `--filter=test1 --filter=test2` → test1 OR test2
- Different type filters use AND logic: `--filter=test1 --suite=Unit` → test1 AND Unit
- Formula: `AND(OR(filters), OR(paths), OR(suites), OR(type), NOT OR(notType), OR(groups), NOT OR(excludeGroups))`

For detailed information about filtering behavior, see [Filtering](../plugins/filter.md).

#### `--suite`

Filter tests by test suite name. Suites are defined in configuration.

**Repeatable:** Yes (OR logic)

**Examples:**
```bash
# Single suite
testo run --suite=Unit

# Multiple suites
testo run --suite=Unit --suite=Integration
```

#### `--path`

Filter test files by glob patterns. Supports wildcards: `*`, `?`, `[abc]`

**Repeatable:** Yes (OR logic)

**Note:** Asterisk `*` is automatically appended if the path doesn't end with a wildcard.
- `tests/Unit` becomes `tests/Unit*`
- `tests/Unit/` becomes `tests/Unit/*`

**Examples:**
```bash
# Matches tests/Unit*
testo run --path="tests/Unit"

# Matches tests/Unit/*Test.php
testo run --path="tests/Unit/*Test.php"

# Multiple paths
testo run --path="tests/Unit" --path="tests/Integration"

# Nested directories
testo run --path="tests/*/Security/*Test.php"
```

#### `--filter`

Filter tests by class, method, or function names.

**Repeatable:** Yes (OR logic)

**Supported Formats:**
- **Method**: `ClassName::methodName` or `Namespace\ClassName::methodName`
- **FQN**: `Namespace\ClassName` or `Namespace\functionName`
- **Fragment**: `methodName`, `functionName`, or `ShortClassName`

**Examples:**
```bash
# Specific method
testo run --filter=UserTest::testLogin

# Entire class
testo run --filter=UserTest

# By FQN
testo run --filter=Tests\Unit\UserTest

# Method name across all classes
testo run --filter=testLogin

# Multiple filters (OR)
testo run --filter=UserTest::testCreate --filter=UserTest::testUpdate

# Combine with other filters (AND)
testo run --filter=testAuthentication --suite=Unit
testo run --filter=UserTest --path="tests/Unit"
```

**Filter Behavior:** See [Filtering](../plugins/filter.md) for details.

#### `--type`

Filter tests by type.

**Repeatable:** Yes (OR logic)

**Possible values:**
- `test` — regular tests (methods in classes)
- `inline` — [inline tests](../plugins/inline.md) (tests via <attr>\Testo\Inline\TestInline</attr>)
- `bench` — [benchmarks](../plugins/bench.md)

- A plain name **includes** a type: `--type=bench`. Multiple values combine with OR.
- A leading `!` **excludes** a type: `--type=!bench`. Exclusion wins over inclusion.

**Examples:**
```bash
# Regular tests only
testo run --type=test

# Regular tests OR inline tests
testo run --type=test --type=inline

# Benchmarks only
testo run --type=bench

# Everything except benchmarks
testo run --type=!bench

# Combine with other filters (AND)
testo run --type=test --suite=Unit
testo run --type=inline --filter=testLogin
```

::: info Middleware and test types
The type filter works at the pipeline level: middleware (and test locators) bound to a specific type are excluded from the pipeline when their type doesn't pass the filter. See [Filtering by Type](/docs/plugins/filter.md#filtering-by-type) for details.
:::

#### `--group`

Filter tests by group. Groups are flat labels attached to tests with the <attr>\Testo\Filter\Group</attr> attribute.

**Repeatable:** Yes (OR logic)

- A plain name **includes** a group: `--group=database`.
- A `!` prefix **excludes** a group: `--group=!slow`. Exclusion wins over inclusion.

**Examples:**
```bash
# Only tests in the "database" group
testo run --group=database

# Tests in "database" OR "integration"
testo run --group=database --group=integration

# Everything except the "slow" group
testo run --group=!slow

# Combine with a name filter (AND)
testo run --group=database --filter=UserTest
```

See [Filtering by Groups](../plugins/filter.md#filtering-by-groups) for inheritance rules.

### Combining Filters

**Examples:**
```bash
# Name AND suite
testo run --filter=testLogin --suite=Unit

# Name AND path
testo run --filter=UserTest --path="tests/Unit"

# All three types (AND)
testo run --filter=testImportant --path="tests/Unit" --suite=Critical

# Multiple values with multiple types
testo run \
  --filter=testCreate --filter=testUpdate \
  --path="tests/Unit" --path="tests/Integration" \
  --suite=Critical
```

## Exit Codes

- `0` (SUCCESS): All tests passed
- `1` (FAILURE): One or more tests failed
- `2` (INVALID): Invalid command or configuration
