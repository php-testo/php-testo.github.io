---
outline: [2, 4]
llms: true
llms_description: "Code coverage collection during tests. CodecovPlugin configuration with CoverageLevel (Line/Branch/Path), CoverageMode (IfAvailable/Always/Never), CLI flags --coverage/--no-coverage. Clover and Cobertura XML reports. #[Covers] and #[CoversNothing] attributes for per-test coverage control. Source filtering via FinderConfig."
---

# Code Coverage

The plugin collects code coverage data during test execution and generates reports in standard formats. Reports can be used in CI services (Codecov.io, SonarQube, GitHub Actions) and in IDEs — for example, PhpStorm can display coverage directly in your code from a Clover report.

<plugin-info name="Codecov" class="\Testo\Codecov\CodecovPlugin" />

## Requirements

One of the following PHP extensions is required:

- **[PCOV](https://github.com/krakjoe/pcov)** — lightweight, fast, line coverage only.
- **[XDebug](https://xdebug.org/)** ≥ 3.0 with `coverage` mode enabled (`xdebug.mode=coverage`).

When both extensions are available, Testo prefers PCOV due to its lower overhead. If neither extension is installed, behavior depends on the plugin's activation mode (<enum>\Testo\Codecov\Config\CoverageMode</enum>).

::: question Which extension is better — PCOV or XDebug?
PCOV is faster and easier to set up, but only supports line coverage. XDebug is required for branch and path analysis. If <enum>\Testo\Codecov\Config\CoverageLevel::Line</enum> is sufficient for your needs — use PCOV.
:::

## Setup

Register <class>\Testo\Codecov\CodecovPlugin</class> in the `plugins` section of your configuration:

::: code-group
```php [Application level]
return new ApplicationConfig(
    src: ['src'],
    //...
    plugins: [
        new CodecovPlugin(
            level: CoverageLevel::Line,
            reports: [
                new CloverReport(__DIR__ . '/clover.xml', 'MyProject'),
                new CoberturaReport(__DIR__ . '/cobertura.xml'),
            ],
        ),
    ],
);
```
```php [Test Suite level]
return new ApplicationConfig(
    src: ['src'],
    suites: [
        new SuiteConfig(
            // ...
            plugins: [
                new CodecovPlugin(
                    reports: [
                        new CloverReport(__DIR__ . '/clover.xml', 'MyProject'),
                    ],
                ),
            ],
        ),
    ],
);
```
:::

At the application level, coverage is collected across all test suites. At the test suite level — only for that specific suite. Reports are generated after tests complete. Coverage is filtered to files matching the `src` parameter from <class>\Testo\Application\Config\ApplicationConfig</class>.

<signature h="3" name="new \Testo\Codecov\CodecovPlugin(CoverageLevel $level = CoverageLevel::Line, CoverageMode $collect = CoverageMode::IfAvailable, array $testTypes = [TestType::Test, TestType::TestInline], array $reports = [])">
<short>Configures code coverage collection: analysis depth, activation mode, and report formats.</short>
<param name="$level">Coverage analysis depth. Defaults to <enum>\Testo\Codecov\Config\CoverageLevel::Line</enum>.</param>
<param name="$collect">Default activation mode. CLI flags (`--coverage`, `--no-coverage`) take priority over this value.</param>
<param name="$testTypes">Test types to collect coverage for. Coverage collection adds overhead to each run, so benchmarks are excluded by default — otherwise performance measurements would be skewed. By default, coverage is collected only for regular tests and inline tests (<enum>\Testo\Core\Value\TestType::Test</enum>, <enum>\Testo\Core\Value\TestType::TestInline</enum>). An empty array means all types. Accepts <enum>\Testo\Core\Value\TestType</enum> cases or custom string identifiers.</param>
<param name="$reports">Report generators to run after all tests complete. Each element must implement the <class>\Testo\Codecov\Report\CoverageReport</class> interface.</param>
</signature>

<signature h="3" name="enum \Testo\Codecov\Config\CoverageLevel">
<short>Defines the depth of coverage analysis. Each successive level includes all data from the previous one.</short>
<description>
Each successive level increases analysis overhead. PCOV only supports `Line` — when a deeper level is requested, it silently falls back to `Line`.

**Example.** Consider the following code:

```php
function greet(bool $loud, bool $formal): string
{
    $greeting = $formal ? 'Good day' : 'Hi';         // 2 branches
    return $loud ? strtoupper($greeting) : $greeting; // 2 branches
}
```

A test calling `greet(true, true)`:

- **Line** — 100%: both lines executed.
- **Branch** — 50%: 2 of 4 branches taken.
- **Path** — 25%: 1 of 4 paths followed (true+true, true+false, false+true, false+false).
</description>
<case name="Line">Which source lines were executed. Supported by both PCOV and XDebug.</case>
<case name="Branch">Line + which branches (`if/else`, `switch`, `?:`, `??`) were taken. XDebug only.</case>
<case name="Path">Branch + which complete execution paths through each function were followed. XDebug only.</case>
</signature>

<signature h="3" name="enum \Testo\Codecov\Config\CoverageMode">
<short>Controls whether coverage is collected.</short>
<description>
The default behavior is set by the `collect` parameter of the <class>\Testo\Codecov\CodecovPlugin</class> constructor, and CLI flags can override it at runtime. This means the plugin can safely remain in `testo.php` across all environments — on CI without PCOV/XDebug, tests will run normally, just without reports.
</description>
<case name="IfAvailable">**Default.** Coverage is collected if an extension is available and configured, otherwise silently skipped.</case>
<case name="Always">Coverage is mandatory. If no extension is installed, tests will fail with a <class>\Testo\Codecov\Exception\CoverageDriverNotAvailable</class> exception. Set by the `--coverage` CLI flag.</case>
<case name="Never">Coverage is fully disabled, zero overhead. Set by the `--no-coverage` CLI flag.</case>
</signature>

::: question What happens if no coverage extension is installed?
It depends on the activation mode. By default, <enum>\Testo\Codecov\Config\CoverageMode::IfAvailable</enum> is used — the plugin silently skips coverage collection and tests run without it. If you run with the `--coverage` flag, the mode switches to <enum>\Testo\Codecov\Config\CoverageMode::Always</enum>, and tests will fail with a <class>\Testo\Codecov\Exception\CoverageDriverNotAvailable</class> exception.
:::

### Reports

All built-in report generators implement the <class>\Testo\Codecov\Report\CoverageReport</class> interface. You can implement it to add your own output format.

<signature h="4" name="new \Testo\Codecov\Report\CloverReport(string $outputPath, string $projectName = '')">
<short>Generates a Clover XML report.</short>
<description>
The format contains `<file>`, `<line>`, and `<metrics>` elements — line-level statement coverage only. Branch and path data is not included, as the format does not support it.

Compatible with: Codecov.io, SonarQube, Atlassian Clover.
</description>
<param name="$outputPath">Absolute path to the output XML file.</param>
<param name="$projectName">Project name in the `<project>` element. Defaults to an empty string.</param>
<example>
```php
new CloverReport(__DIR__ . '/clover.xml', 'MyProject')
```
</example>
</signature>

<signature h="4" name="new \Testo\Codecov\Report\CoberturaReport(string $outputPath, string $sourceRoot = '')">
<short>Generates a Cobertura XML report.</short>
<description>
Files are grouped into `<package>` elements by directory, with relative paths from `sourceRoot`.

When branch data is available (<enum>\Testo\Codecov\Config\CoverageLevel::Branch</enum> or higher):

- `branch-rate`, `branches-covered`, `branches-valid` are populated at all levels (coverage, package, class).
- Lines with branch points get `branch="true"` and `condition-coverage="50% (1/2)"` attributes.

Without branch data, all branch attributes are `0`.

Compatible with: GitHub Actions, GitLab CI, Jenkins.
</description>
<param name="$outputPath">Absolute path to the output XML file.</param>
<param name="$sourceRoot">Source root for relative file paths. Defaults to `getcwd()`.</param>
<example>
```php
new CoberturaReport(__DIR__ . '/cobertura.xml')
```
</example>
</signature>

## Coverage Control

The `src` parameter in the <class>\Testo\Application\Config\ApplicationConfig</class> configuration defines the global set of files included in coverage. The <attr>\Testo\Codecov\Covers</attr> and <attr>\Testo\Codecov\CoversNothing</attr> attributes allow fine-grained control over coverage for individual tests.

### Global Filter

Includes and excludes are supported via <class>\Testo\Application\Config\FinderConfig</class>:

```php
return new ApplicationConfig(
    src: new FinderConfig(
        include: ['src'],
        exclude: ['src/Generated'],
    ),
    // ...
);
```

::: tip
Include only the directories you need in `src` to filter out unnecessary files before they are even loaded. This gives the best performance.
:::

<signature h="3" name="#[\Testo\Codecov\Covers(string $classOrFunction, ?string $method = null)]">
<short>Restricts which source code counts toward coverage for this test.</short>
<description>
Only lines belonging to the specified classes, traits, enums, methods, or functions will be included in the report. Everything else is discarded. The attribute is repeatable: multiple <attr>\Testo\Codecov\Covers</attr> on the same test are combined.

When placed on a class, applies to all tests within it.
</description>
<param name="$classOrFunction">Fully qualified class, trait, enum (`UserService::class`, `Cacheable::class`, `OrderStatus::class`), or function name (`'App\Helpers\format_name'`).</param>
<param name="$method">Method name within the class, trait, or enum. When specified, only lines of that method are included, not the entire entity.</param>
<example>
Coverage for a class, trait, or enum — all executable lines:

```php
#[Covers(UserService::class)]
public function testCreateUser(): void { ... }

#[Covers(Cacheable::class)]
public function testCacheableBehavior(): void { ... }

#[Covers(OrderStatus::class)]
public function testOrderStatusTransitions(): void { ... }
```
</example>
<example>
Coverage for a specific method — works with classes, traits, and enums:

```php
#[Covers(UserService::class, 'create')]
public function testCreateUser(): void { ... }

#[Covers(Cacheable::class, 'invalidate')]
public function testCacheInvalidation(): void { ... }

#[Covers(OrderStatus::class, 'canTransitionTo')]
public function testStatusTransition(): void { ... }
```
</example>
<example>
Multiple targets — coverage is combined:

```php
#[Covers(UserService::class)]
#[Covers(UserRepository::class, 'findById')]
public function testCreateUser(): void { ... }
```
</example>
</signature>

<signature h="3" name="#[\Testo\Codecov\CoversNothing]">
<short>Excludes a test from coverage statistics.</short>
<description>
The test runs as usual, but the coverage driver is not started — zero overhead, no data is collected or included in reports. Useful for smoke tests and integration checks that touch a lot of code but shouldn't skew your coverage picture.

When placed on a class, applies to all tests within it.
</description>
<example>
```php
#[CoversNothing]
public function smokeTest(): void
{
    // Test runs, but coverage is not collected
    $response = $this->app->get('/health');
    Assert::same(200, $response->statusCode);
}
```
</example>
</signature>

### Attribute Priority

Coverage attributes are resolved layer by layer: the method is checked first, then the class. If the method has any coverage attribute, class-level attributes are ignored entirely. This allows overriding behavior in subclasses:

```php
#[CoversNothing]
abstract class BaseIntegrationTest
{
    // By default, all tests in subclasses skip coverage
}

#[Covers(PaymentService::class)]
final class PaymentServiceTest extends BaseIntegrationTest
{
    // This subclass overrides the behavior — coverage is collected
    public function testCharge(): void { ... }
}
```

::: warning
Using <attr>\Testo\Codecov\Covers</attr> and <attr>\Testo\Codecov\CoversNothing</attr> on the **same level** is an error. Testo will throw an exception identifying the conflicting test. Different levels (e.g., <attr>\Testo\Codecov\CoversNothing</attr> on the parent class and <attr>\Testo\Codecov\Covers</attr> on the child) are valid.
:::

### Metadata

Coverage data for each test is attached to the <class>\Testo\Core\Context\TestResult</class> metadata under the <class>\Testo\Codecov\Result\CoverageResult</class> key:

```php
use Testo\Codecov\Result\CoverageResult;

$coverage = $testResult->getAttribute(CoverageResult::class);
// CoverageResult|null
```

This allows you to implement custom logic based on coverage data before results are reflected in the reports.
