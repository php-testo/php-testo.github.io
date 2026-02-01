# Test Filtering

This document describes the business logic of test filtering in Testo.

## Overview

Testo provides a flexible filtering system that operates in multiple stages to progressively narrow down the test set. Filtering can be controlled programmatically via the `Filter` class or automatically from CLI arguments.

## Filter Class

The `Testo\Common\Filter` class is an immutable DTO containing test filtering criteria:

```php
$filter = new Filter(
    suites: ['Unit', 'Integration'],
    names: ['UserTest::testLogin', 'testAuthentication'],
    paths: ['tests/Unit/*', 'tests/Integration/*'],
);
```

### Properties

**`testSuites`**: `list<non-empty-string>`
- Test suite names to filter by
- Used in Stage 1 to determine which configuration scopes to load

**`names`**: `list<non-empty-string>`
- Class, method, or function names to filter by
- Supports three formats:
  - Method: `ClassName::methodName` or `Namespace\ClassName::methodName`
  - FQN: `Namespace\ClassName` or `Namespace\functionName`
  - Fragment: `methodName`, `functionName`, or `ShortClassName`
- Optional DataProvider indices: `name:providerIndex:datasetIndex`
  - Provides indices for data provider module
  - Indices are 0-based and independent of dataset labels
  - `datasetIndex` is optional (omit to pass only provider index)
  - Examples: `UserTest::testLogin:0`, `testAuth:1:3`, `UserTest:0`

**`paths`**: `list<non-empty-string>`
- File or directory paths to filter by
- Supports glob patterns: `*`, `?`, `[abc]`

### Usage with Application

The `Filter` object can be passed to `Application::run()`:

```php
$app = Application::createFromInput(/* ... */);

$filter = new Filter(
    suites: ['Unit'],
    names: ['UserTest'],
);

$result = $app->run($filter);
```

When running from CLI, the `Filter` is populated automatically from command arguments via `Filter::fromScope()`.

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

**Formula**: `AND(OR(names), OR(paths), OR(suites))`

**Example:**
```php
$filter = new Filter(
    names: ['test1', 'test2'],        // test1 OR test2
    paths: ['path1', 'path2'],        // path1 OR path2
    suites: ['Unit', 'Critical'], // Unit OR Critical
);
// Result: (test1 OR test2) AND (path1 OR path2) AND (Unit OR Critical)
```

## Name Filter Behavior

The behavior of name filtering is implemented in `FilterInterceptor` and depends on the name format:

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

### DataProvider Indices

When tests use data providers, names can include provider and dataset indices using colon separator. These indices become available to the data provider module.

**Format:** `name:providerIndex:datasetIndex`

- Indices are 0-based integers, independent of dataset labels
- `datasetIndex` is optional - omit to pass only provider index
- Works with all name formats (Method, FQN, Fragment)

**Examples:**
```php
// Pass provider #0 index
$filter = new Filter(names: ['UserTest::testLogin:0']);

// Pass provider #0 and dataset #1 indices
$filter = new Filter(names: ['UserTest::testLogin:0:1']);

// Pass provider #1 and dataset #3 indices, matching any test named 'testAuth'
$filter = new Filter(names: ['testAuth:1:3']);

// Pass provider #0 index for entire UserTest class
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

`FilterInterceptor` uses whole-word boundary matching with regex:

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
