---
outline: [2, 3]
llms_description: "How to skip a test declaratively with #[Skip]: the test is reported as Skipped with its reason before anything runs, so #[BeforeTest]/#[AfterTest], data providers, #[Retry]/#[Repeat] and coverage never engage, and a fully skipped class runs no #[BeforeClass]/#[AfterClass]. Class-level skip and inheritance, where the reason shows up in reports, the SkipTest exception for skipping at run time, and when to use #[Skip], SkipTest or a #[Group] filter."
---

# Skip

The plugin provides the <attr>\Testo\Skip</attr> attribute and an interceptor that mark a test as skipped before it ever starts. The test is reported as <enum>\Testo\Core\Value\Status::Skipped</enum> and counted in the totals, and an optional reason explains why it was skipped. Skip a test when it cannot run yet but it is too early to delete it: it reproduces a bug nobody has fixed yet, it is broken by a rework still in progress, or it was written ahead of the feature it checks. The attribute can be placed on a method, function, or an entire class — in the latter case, every test in the class is skipped.

<plugin-info class="\Testo\Skip\SkipPlugin" name="Skip" included="\Testo\Application\Config\Plugin\SuitePlugins" />

<signature h="2" name="#[\Testo\Skip(string $reason = '')]">
<short>Marks a test, a test class or a test function as skipped without running it.</short>
<description>
Can be placed on a method, a free function, or a class — on a class every test of the case is skipped. The attribute is inherited from parent classes, traits and overridden methods. When both a method and its class carry `#[Skip]`, the method's attribute takes precedence and its reason replaces the class one. The attribute can be placed only once per target.

The attribute applies to plain tests only: on a non-test method it does nothing, and a <attr>\Testo\Bench</attr> or <attr>\Testo\Inline\TestInline</attr> target runs as usual. Close in spirit to JUnit's `@Disabled` and Rust's `#[ignore]`.
</description>
<param name="$reason">Why the test is skipped. No reason by default. A given reason is appended to the result message and shows up in the JUnit, TeamCity and HTML reports.</param>
<example>
Skip a single test:

```php
use Testo\Skip;
use Testo\Test;

final class PricingTest
{
    #[Test]
    #[Skip('broken by the pricing rework')]
    public function calculatesTotal(): void
    {
        // never runs — reported as Skipped with the reason above
    }

    #[Test]
    public function createsOrder(): void { /* runs as usual */ }
}
```
</example>
<example>
On a class — every test of the case is skipped, and a method may state its own reason:

```php
#[Skip('the billing sandbox is down')]
final class BillingTest
{
    #[Test]
    public function chargesCard(): void { /* ... */ }

    #[Test]
    #[Skip('flaky since the gateway upgrade')] // this reason replaces the class one
    public function refundsCard(): void { /* ... */ }
}
```
</example>
</signature>

## What never runs

The skip is decided before the test starts, and the test is reported right where its own run would begin. Nothing that prepares, wraps or repeats a test body gets a chance to engage:

- <attr>\Testo\Lifecycle\BeforeTest</attr> and <attr>\Testo\Lifecycle\AfterTest</attr> hooks are not called.
- Data providers such as <attr>\Testo\Data\DataProvider</attr> are not called: a data-driven test yields a **single** <enum>\Testo\Core\Value\Status::Skipped</enum> entry, not one per data set.
- <attr>\Testo\Retry</attr> and <attr>\Testo\Repeat</attr> never start their loop.
- <attr>\Testo\Fiber\RunInFiber</attr> doesn't start a fiber for it, and no coverage is collected.

```php
final class OrderTest
{
    #[BeforeTest]
    public function startTransaction(): void
    {
        // not called for calculatesTotal() — there is no body to prepare for
    }

    #[Test]
    #[Skip('broken by the pricing rework')]
    public function calculatesTotal(): void { /* ... */ }

    #[Test]
    public function createsOrder(): void
    {
        // startTransaction() runs for this one as usual
    }
}
```

The class-level hooks follow the case, not the test: <attr>\Testo\Lifecycle\BeforeClass</attr> and <attr>\Testo\Lifecycle\AfterClass</attr> still run while the case has at least one test left to run. When every test of the case is skipped, they are not called and the class is never constructed.

A run consisting only of skipped tests is a success: <enum>\Testo\Core\Value\Status::Skipped</enum> is neither a failure nor an error, so the exit code is `0`.

## Where the reason shows up

The test's result carries a message built from its qualified name — `Class::method`, or the fully qualified function name for a function test — and the marker `is skipped via #[Skip]`, extended with the reason when one is given:

```
Tests\Unit\PricingTest::calculatesTotal is skipped via #[Skip] ==> broken by the pricing rework
```

- The JUnit ([`--log-junit`](../guide/cli-reference.md#log-junit)), TeamCity ([`--teamcity`](../guide/cli-reference.md#teamcity)) and HTML reports show that message.
- The terminal prints the skipped line without it.
- The compact [`--json`](../guide/cli-reference.md#json) report counts the test in its totals.

## Skipping at runtime

Sometimes the skip cannot be decided ahead of time: the test has to look around first and skip itself on what it finds — a missing extension, an unreachable service, a fixture that turned out empty. For that, throw <class>\Testo\Core\Exception\SkipTest</class> from the test body. The test is reported as <enum>\Testo\Core\Value\Status::Skipped</enum> with the exception message.

```php
use Testo\Core\Exception\SkipTest;

#[Test]
public function requiresPdoMysql(): void
{
    if (!\extension_loaded('pdo_mysql')) {
        throw new SkipTest('pdo_mysql required');
    }

    // ...
}
```

The two mechanisms reach the same status by different roads, and that is the point to keep in mind. The exception is thrown once the test is already running: <attr>\Testo\Lifecycle\BeforeTest</attr> has done its work, the arguments are ready (from a data provider, if the test has one), and the test class has been instantiated if the method needs an instance. <attr>\Testo\Skip</attr> is declared ahead of time and never reaches any of that. In reports the two are easy to tell apart: a declared skip carries the `is skipped via #[Skip]` marker in its message.

::: warning
Throw <class>\Testo\Core\Exception\SkipTest</class> from the test body only. Thrown from an interceptor it leaves the pipeline and the test lands as <enum>\Testo\Core\Value\Status::Aborted</enum>, not <enum>\Testo\Core\Value\Status::Skipped</enum>.
:::

## Skip, SkipTest or a group filter

All three keep a test from running, but they differ in when the decision is made and whether the test stays in the report:

- Use <attr>\Testo\Skip</attr> when **the test must not run for now**, and that decision should be visible both in the code and in the report.
- Throw <class>\Testo\Core\Exception\SkipTest</class> when **only the test itself can decide**, based on what it finds at run time.
- Use <attr>\Testo\Filter\Group</attr> with `--group=!slow` when **the test is fine**, it just doesn't need to run every time — for example, because it is slow.

| Tool | Decided | In the report |
|------|---------|---------------|
| `#[Skip('…')]` | in code, ahead of the run | <enum>\Testo\Core\Value\Status::Skipped</enum>, with the reason |
| `throw new SkipTest('…')` | inside the test, while it runs | <enum>\Testo\Core\Value\Status::Skipped</enum>, with the message |
| <attr>\Testo\Filter\Group</attr> + `--group=!slow` | at the runner invocation | not at all |

::: question Do I need to register the plugin?
No. `SkipPlugin` is part of the default suite plugins, and the attribute wires its own interceptor. In a suite configured without the plugin the test is still reported as <enum>\Testo\Core\Value\Status::Skipped</enum>, and its <attr>\Testo\Lifecycle\BeforeTest</attr>/<attr>\Testo\Lifecycle\AfterTest</attr> hooks are still not called. What is lost is the class-level decision: a class whose tests are all skipped then runs its <attr>\Testo\Lifecycle\BeforeClass</attr>/<attr>\Testo\Lifecycle\AfterClass</attr> hooks, and a non-static hook constructs the class.
:::
