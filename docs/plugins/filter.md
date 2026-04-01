---
llms_description: "How to filter which tests run. Filter class with name/path/suite/type filters, OR/AND combination logic, 5-stage filtering pipeline from files to DataProvider indices."
---

# Test Filtering

This document describes the internal logic of the filtering plugin: the algorithm, pipeline stages, and criteria combination. If you just need to filter tests when running — see the [CLI reference](../cli-reference.md).

<plugin-info name="Filter" class="\Testo\Filter\FilterPlugin" included="\Testo\Application\Config\Plugin\ApplicationPlugins" />

## Overview

Testo provides a flexible filtering system that operates in multiple stages to progressively narrow down the test set. Filtering can be controlled programmatically via the <class>\Testo\Filter</class> class or automatically from CLI arguments.

<signature h="2" name="new \Testo\Filter(array $suites = [], array $names = [], array $paths = [], ?string $type = null)">
<short>Immutable DTO containing test filtering criteria.</short>
<param name="$suites">Test suite names to filter by.</param>
<param name="$names">Class, method, or function names. Formats: `ClassName::methodName`, `Namespace\ClassName`, fragment `methodName`. Optional DataProvider indices via colon: `name:providerIndex:datasetIndex`.</param>
<param name="$paths">File or directory paths. Supports glob patterns: `*`, `?`, `[abc]`.</param>
<param name="$type">Test type: `test`, `inline`, `bench`, or other custom type. If not specified — all types are run.</param>
<example>
```php
$filter = new Filter(
    suites: ['Unit', 'Integration'],
    names: ['UserTest::testLogin', 'testAuthentication'],
    paths: ['tests/Unit/*', 'tests/Integration/*'],
    type: 'test',
);
```
</example>
</signature>

### Usage

**Via CLI options** — when creating via `Application::createFromInput()`, the plugin automatically creates <class>\Testo\Filter</class> from command options: `--filter`, `--path`, `--suite`, `--type`:

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
- `names: ['test1'], type: 'inline'` → matches if name is test1 **AND** type is inline

**Formula**: `AND(OR(names), OR(paths), OR(suites), type)`

**Example:**
```php
$filter = new Filter(
    names: ['test1', 'test2'],        // test1 OR test2
    paths: ['path1', 'path2'],        // path1 OR path2
    suites: ['Unit', 'Critical'],     // Unit OR Critical
    type: 'test',                     // regular tests only
);
// Result: (test1 OR test2) AND (path1 OR path2) AND (Unit OR Critical) AND type=test
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
