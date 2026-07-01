---
llms_description: "How to filter which tests run. Filter class with name/path/suite/type/group filters, #[Group] attribute with inheritance, --group include/exclude (! prefix) selection, OR/AND combination logic, 5-stage filtering pipeline from files to DataProvider indices."
---

# Test Filtering

This document describes the internal logic of the filtering plugin: the algorithm, pipeline stages, and criteria combination. If you just need to filter tests when running — see the [CLI reference](../guide/cli-reference.md).

<plugin-info name="Filter" class="\Testo\Filter\FilterPlugin" included="\Testo\Application\Config\Plugin\ApplicationPlugins" />

## Overview

Testo provides a flexible filtering system that operates in multiple stages to progressively narrow down the test set. Filtering can be controlled programmatically via the <class>\Testo\Filter</class> class or automatically from CLI arguments.

<signature h="2" name="new \Testo\Filter(array $suites = [], array $names = [], array $paths = [], array $type = [], array $notType = [], array $groups = [], array $excludeGroups = [])">
<short>Immutable DTO containing test filtering criteria.</short>
<param name="$suites">Test suite names to filter by.</param>
<param name="$names">Class, method, or function names. Formats: `ClassName::methodName`, `Namespace\ClassName`, fragment `methodName`. Optional DataProvider indices via colon: `name:providerIndex:datasetIndex`.</param>
<param name="$paths">File or directory paths. Supports glob patterns: `*`, `?`, `[abc]`.</param>
<param name="$type">Test types to include (OR logic): `test`, `inline`, `bench`, or custom. An empty list runs all types. See <attr>\Testo\Core\Value\TestType</attr>.</param>
<param name="$notType">Test types to exclude. A test of such a type is skipped — exclusion wins over inclusion.</param>
<param name="$groups">Group names to include (OR logic). A test matches if it belongs to any of these groups. See <attr>\Testo\Filter\Group</attr>.</param>
<param name="$excludeGroups">Group names to exclude. A test in any of these groups is skipped — exclusion wins over inclusion.</param>
<example>
```php
$filter = new Filter(
    suites: ['Unit', 'Integration'],
    names: ['UserTest::testLogin', 'testAuthentication'],
    paths: ['tests/Unit/*', 'tests/Integration/*'],
    type: ['test'],
    notType: ['bench'],
    groups: ['database'],
    excludeGroups: ['slow'],
);
```
</example>
</signature>

### Usage

**Via CLI options** — when creating via `Application::createFromInput()`, the plugin automatically creates <class>\Testo\Filter</class> from command options: `--filter`, `--path`, `--suite`, `--type`, `--group`:

```php
$app = Application::createFromInput(
    inputOptions: ['filter' => ['UserTest'], 'suite' => ['Unit']],
);
$result = $app->run();
```

**Via container** — register the <class>\Testo\Filter</class> object directly:

```php
$app = Application::createFromConfig($config);

$app->getContainer()->set(Filter::class, new Filter(
    suites: ['Unit'],
    names: ['UserTest'],
));

$result = $app->run();
```

When running from CLI, the <class>\Testo\Common\Filter</class> is populated automatically from command arguments via `Filter::fromScope()`.

## Filter Combination Logic

### Same Type: OR Logic

Multiple values within the same filter type are combined with OR logic:

- `names: ['test1', 'test2']` → matches if name is test1 **OR** test2
- `paths: ['path1', 'path2']` → matches if path is path1 **OR** path2
- `suites: ['Unit', 'Integration']` → matches if suite is Unit **OR** Integration

### Different Types: AND Logic

Different filter types are combined with AND logic:

- `names: ['test1'], suites: ['Unit']` → matches if name is test1 **AND** suite is Unit
- `names: ['UserTest'], paths: ['tests/Unit/*']` → matches if name is UserTest **AND** path matches tests/Unit/*
- `names: ['test1'], type: ['inline']` → matches if name is test1 **AND** type is inline

**Formula**: `AND(OR(names), OR(paths), OR(suites), OR(type), NOT OR(notType), OR(groups), NOT OR(excludeGroups))`

**Example:**
```php
$filter = new Filter(
    names: ['test1', 'test2'],        // test1 OR test2
    paths: ['path1', 'path2'],        // path1 OR path2
    suites: ['Unit', 'Critical'],     // Unit OR Critical
    type: ['test'],                   // regular tests only
);
// Result: (test1 OR test2) AND (path1 OR path2) AND (Unit OR Critical) AND type=test
```

## Filtering by Type

A type is the kind of test: `test` (regular `#[Test]`), `inline` (<attr>\Testo\Inline\TestInline</attr>), `bench` (<attr>\Testo\Bench\Bench</attr>), or custom. See <attr>\Testo\Core\Value\TestType</attr>.

Unlike groups, the type filter does **not** work per individual test — it works at the pipeline level: it selects which locator interceptors (and other middleware) take part in the pipeline based on their declared type (<attr>\Testo\Pipeline\Attribute\InterceptorOptions</attr>, the `testType` parameter). Every locator that produces tests of a given type declares that type; universal middleware (no `testType`) always runs.

Selection is done via the `--type` CLI flag (or the `$type` / `$notType` properties of the <class>\Testo\Filter</class> DTO):

- **Inclusion** — `--type=bench` keeps only the `bench` type. Multiple `--type` values combine with OR.
- **Exclusion** — a leading `!` means exclusion: `--type=!bench` runs everything except benches. Exclusion always wins over inclusion.
- Type filters combine with name, path, Test Suite, and group filters using AND.

```bash
# Benchmarks only
testo run --type=bench

# Regular tests OR inline tests
testo run --type=test --type=inline

# Everything except benches
testo run --type=!bench
```

::: tip A type passes when
A type `t` passes when it is in the include list (or the include list is empty) **and** it is not in the exclude list. An interceptor stays in the pipeline when it is universal (no `testType`) or at least one of its declared types passes.
:::

## Filtering by Groups

Groups are flat string labels you attach to tests with the <attr>\Testo\Filter\Group</attr> attribute. Unlike names and paths, they don't depend on how a test is named or where it lives — you mark tests by category (`db`, `slow`, `integration`) and then run or skip whole categories at once.

<signature h="2" name="#[\Testo\Filter\Group(string ...$names)]">
<short>Labels a class, method, or function with one or more group names for selective filtering.</short>
<description>
The attribute is variadic — pass several group names at once. Groups have no key/value semantics; they're plain string labels.

The effective group set of a test is the **union** of all groups reachable from it: the test method (including any parent method it overrides), the test class, its parent classes, and traits. So a group declared on a class is inherited by every test in it.
</description>
<param name="$names">Group labels to assign.</param>
<example>
```php
#[Test]
#[Group('integration')]
final class OrderTest
{
    public function createsOrder(): void {}            // groups: integration

    #[Group('slow')]
    public function importsLargeDataset(): void {}     // groups: integration, slow
}
```
</example>
</signature>

Selection happens through the `--group` CLI flag (or the `$groups` / `$excludeGroups` properties of the <class>\Testo\Filter</class> DTO):

- **Include** — `--group=db` runs only tests in group `db`. Multiple `--group` values use OR logic.
- **Exclude** — the `!` prefix marks an exclusion: `--group=!slow` skips tests in group `slow`. Exclusion always wins over inclusion.
- Group filters combine with name, path, suite, and type filters using AND logic.

```bash
# Only tests in the "database" group
testo run --group=database

# Tests in "database" OR "unit"
testo run --group=database --group=unit

# Everything except the "slow" group
testo run --group=!slow

# Combine with a name filter (AND)
testo run --group=database --filter=UserTest
```

## Name Filter Behavior

The behavior of name filtering is implemented in <class>\Testo\Filter\Internal\FilterInterceptor</class> and depends on the name format:

### Method Format (`ClassName::methodName`)

When using method format with `::` separator:
- Only the specified method is matched
- Other methods in the same class are excluded
- Result: Test case with **only the specified method**

**Example:**
```php
$filter = new Filter(names: ['UserTest::testLogin']);
// Result: UserTest class with only testLogin method
```

### FQN or Fragment Format

When using FQN (with `\`) or simple fragment (no separators):

**Case 1: Class name matches**
- Result: **Entire test case with all methods**

**Case 2: Class name doesn't match**
- System checks individual methods/functions
- Result: Test case with **only matched methods**
- If no methods match: Test case is skipped

**Examples:**
```php
// FQN - matches entire class
$filter = new Filter(names: ['Tests\Unit\UserTest']);
// Result: UserTest class with all methods

// Fragment - matches entire class
$filter = new Filter(names: ['UserTest']);
// Result: UserTest class with all methods

// Fragment - matches method in any class
$filter = new Filter(names: ['testLogin']);
// Result: All classes with testLogin method, each with only that method
```

### Narrowing by DataProvider and DataSet

After the name, you can narrow down to a specific DataProvider via colon, and further to a specific DataSet within it via another colon.

**Format:** `name:providerIndex:datasetIndex`

- The format maps to <class>\Testo\Filter\DataPointer</class> and is passed to the data provider module.
- "Provider" here means any attribute that spawns a separate test: <attr>\Testo\Data\DataProvider</attr>, <attr>\Testo\Data\DataSet</attr>, <attr>\Testo\Inline\TestInline</attr>, <attr>\Testo\Bench\Bench</attr>, etc.
- Indices are 0-based, independent of dataset labels.
- `datasetIndex` is optional — you can specify only the provider.
- Works with all name formats (method, FQN, fragment).

**Examples:**
```php
// First provider
$filter = new Filter(names: ['UserTest::testLogin:0']);

// First provider, second dataset
$filter = new Filter(names: ['UserTest::testLogin:0:1']);

// Second provider, fourth dataset — for any test named testAuth
$filter = new Filter(names: ['testAuth:1:3']);

// First provider — for entire UserTest class
$filter = new Filter(names: ['UserTest:0']);
```

## Filtering Pipeline

Filtering operates in five stages:

### Stage 1: Suite Filter (Configuration Level)

**Input:** `Filter::$suites`

- Filters configuration scopes based on suite names
- Each suite defines file scanning locations and patterns
- Determines initial set of directories to scan
- Multiple suites use OR logic

### Stage 2: Path Filter (Finder Level)

**Input:** `Filter::$paths`

- Applied at file finder level during directory scanning
- Uses glob patterns to match file paths
- Supports wildcards: `*`, `?`, `[abc]`
- Multiple paths use OR logic
- Returns list of files to be processed

### Stage 3: File Filter (Tokenizer Level)

**Input:** `Filter::$names`
**Implementation:** `FilterInterceptor::locateFile()`

- Pre-filters test files before loading for reflection
- Uses lightweight tokenization instead of full reflection
- Checks if file contains any matching classes, methods, or functions
- Skips files that don't match any patterns
- Multiple names use OR logic

### Stage 4: Test Filter (Reflection Level)

**Input:** `Filter::$names`
**Implementation:** `FilterInterceptor::locateTestCases()`

- Filters individual test cases and methods after reflection
- Implements hierarchical filtering:
  - For method format (`::`) - filters specific methods only
  - For FQN/fragment format - checks class name first, then methods
- Extracts DataProvider indices and associates them with matched tests
- Returns filtered test case definitions ready for execution

### Stage 5: DataProvider Injection (Execution Level)

**Input:** DataProvider indices from Stage 4
**Implementation:** `FilterInterceptor::runTest()`

- Injects `DataPointer` into test metadata before execution
- Makes `DataPointer` available to other interceptors
- If no indices specified: no `DataPointer` is injected

## Pattern Matching

<class>\Testo\Filter\Internal\FilterInterceptor</class> uses whole-word boundary matching with regex:

```php
private static function has(string $needle, string $haystack): bool
{
    return \preg_match('/\\b' . \preg_quote($needle, '/') . '\\b$/', $haystack) === 1;
}
```

**Behavior:**
- `User` matches `App\User` ✓
- `User` does NOT match `App\UserManager` ✗
- `test` matches `testMethod` ✓
- `test` does NOT match `latestMethod` ✗
