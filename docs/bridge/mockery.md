---
outline: [2, 3]
llms: true
llms_description: "Integration with Mockery mocking library: installation, setup at application and suite levels, automatic mock expectation verification after each test, status mapping (Passed, Risky, Failed)."
---

# Mockery

[Mockery](https://github.com/mockery/mockery) is a popular PHP mocking library with an expressive API (`Mockery::mock()`, `expects()`, `spy()`). The `testo/bridge-mockery` package integrates it with Testo.

<plugin-info name="Mockery" class="\Testo\Bridge\Mockery\MockeryPlugin" />

## Installation

```bash
composer require --dev mockery/mockery testo/bridge-mockery
```

## Setup

Register the <class>\Testo\Bridge\Mockery\MockeryPlugin</class> in the `plugins` section — either at the application level (for all suites) or for a specific Test Suite (for a particular set of tests).

::: code-group
```php [Application level]
use Testo\Application\Config\ApplicationConfig;
use Testo\Bridge\Mockery\MockeryPlugin;

return new ApplicationConfig(
    src: ['src'],
    suites: [ /** Suites **/ ],
    plugins: [
        new MockeryPlugin(),
    ],
);
```

```php [Suite level]
use Testo\Application\Config\SuiteConfig;
use Testo\Bridge\Mockery\MockeryPlugin;

new SuiteConfig(
    name: 'Unit',
    location: ['tests/Unit'],
    plugins: [
        new MockeryPlugin(),
    ],
);
```
:::

## Mock Expectation Verification

The bridge automatically verifies mock expectations after each test and maps the result to Testo statuses — manual teardown is not required. The rule is straightforward: **if you declare an expectation and fulfill it, the test passes; if you don't, it fails.**

- **A fulfilled expectation** counts as an assertion. So a test whose only check is a mock stays <enum>\Testo\Core\Value\Status::Passed</enum> rather than <enum>\Testo\Core\Value\Status::Risky</enum> (Testo marks a passing test with no assertions as risky — a safeguard against forgotten assertions, see <plugin>Assert</plugin>).
- **An unfulfilled expectation** fails the test (**Failed**) and shows up in the assertion history as a failure.

::: code-group
```php [Passed]
#[Test]
public function notifies(): void
{
    $mailer = Mockery::mock(Mailer::class);
    $mailer->expects('send')->once();       // expectation — and an assertion at that

    (new Notifier($mailer))->notify('hi');  // send() is called once, fulfilling the expectation
}
```

```php [Risky]
#[Test]
public function notifies(): void
{
    $mailer = Mockery::spy(Mailer::class);

    (new Notifier($mailer))->notify('hi');
    // no expectations, no assertions — nothing to check → Risky
}
```

```php [Failed]
#[Test]
public function notifies(): void
{
    $mailer = Mockery::mock(Mailer::class);
    $mailer->expects('send')->once();       // expect exactly one send() call

    // …but notify() was never called → expectation unfulfilled → Failed
}
```
:::

::: info
The plugin only works with regular tests (for example, those marked with the <attr>\Testo\Test</attr> attribute). In inline tests, benchmarks, and other test types, mocks are not verified or cleaned up automatically — you'll need to handle that yourself, directly through Mockery.
:::
