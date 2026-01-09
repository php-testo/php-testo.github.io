# Command Line Interface

This document describes the command line interface for Testo.

## Commands

### `run`

Execute test suites with optional filtering and output formatting.

This is the default command and can be omitted when using flags.

```bash
./bin/testo run [options]
./bin/testo [options]  # run is optional
```

**Examples:**
```bash
# Explicit run command
./bin/testo run
./bin/testo run --suite=Unit

# Implicit run command (default)
./bin/testo
./bin/testo --suite=Unit
```

## Common Configuration Flags

### `--config`

Specify path to configuration file.

**Default:** `./testo.php`

**Examples:**
```bash
./bin/testo run --config=./custom-testo.php
./bin/testo run --suite=Integration --config=./ci-testo.php
```

## Running Tests

### Output Formatting

#### `--teamcity`

Enable TeamCity service message format for JetBrains IDE integration.

Used by the [Testo plugin](https://plugins.jetbrains.com/plugin/28842-testo) for PHPStorm/IntelliJ IDEA and TeamCity CI server.

**Examples:**
```bash
./bin/testo --teamcity
./bin/testo --suite=Unit --teamcity
```

### Filtering

Testo provides three types of filters that can be combined to selectively run tests.

**Filter Combination Logic:**
- Same type filters use OR logic: `--filter=test1 --filter=test2` → test1 OR test2
- Different type filters use AND logic: `--filter=test1 --suite=Unit` → test1 AND Unit
- Formula: `AND(OR(filters), OR(paths), OR(suites))`

For detailed information about filtering behavior, see [Filtering](/docs/filtering).

#### `--suite`

Filter tests by test suite name. Suites are defined in configuration.

**Repeatable:** Yes (OR logic)

**Examples:**
```bash
# Single suite
./bin/testo run --suite=Unit

# Multiple suites
./bin/testo run --suite=Unit --suite=Integration
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
./bin/testo run --path="tests/Unit"

# Matches tests/Unit/*Test.php
./bin/testo run --path="tests/Unit/*Test.php"

# Multiple paths
./bin/testo run --path="tests/Unit" --path="tests/Integration"

# Nested directories
./bin/testo run --path="tests/*/Security/*Test.php"
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
./bin/testo run --filter=UserTest::testLogin

# Entire class
./bin/testo run --filter=UserTest

# By FQN
./bin/testo run --filter=Tests\Unit\UserTest

# Method name across all classes
./bin/testo run --filter=testLogin

# Multiple filters (OR)
./bin/testo run --filter=UserTest::testCreate --filter=UserTest::testUpdate

# Combine with other filters (AND)
./bin/testo run --filter=testAuthentication --suite=Unit
./bin/testo run --filter=UserTest --path="tests/Unit"
```

**Filter Behavior:** See [Filtering](/docs/filtering) for details.

### Combining Filters

**Examples:**
```bash
# Name AND suite
./bin/testo run --filter=testLogin --suite=Unit

# Name AND path
./bin/testo run --filter=UserTest --path="tests/Unit"

# All three types (AND)
./bin/testo run --filter=testImportant --path="tests/Unit" --suite=Critical

# Multiple values with multiple types
./bin/testo run \
  --filter=testCreate --filter=testUpdate \
  --path="tests/Unit" --path="tests/Integration" \
  --suite=Critical
```

## Exit Codes

- `0` (SUCCESS): All tests passed
- `1` (FAILURE): One or more tests failed
- `2` (INVALID): Invalid command or configuration
