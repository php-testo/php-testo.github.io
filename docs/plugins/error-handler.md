---
outline: [2, 3]
llms_description: "How Testo handles PHP warnings, notices and deprecations raised during a test with the error-handler plugin (enabled by default): errors are forwarded to the previously installed handler and written to the stderr channel; ErrorHandlerPlugin(failOnError: true) fails tests on errors. The plugin's handler is always on the stack during a test, so set_error_handler() always returns a previous handler. Tests that leave handlers behind become Risky unless marked #[ExpectErrorHandlerChange]; #[WithoutErrorHandler] and SuitePlugins::without(ErrorHandlerPlugin::class) opt out."
---

# Error Handler — PHP errors in tests

PHP warnings, notices and deprecations don't stop execution: the test passes and the error gets lost somewhere in the runner's output. This plugin catches such errors in every test and writes them to the `stderr` channel next to the test that raised them. If you want, any such error can fail the test.

The plugin ships with `testo/testo` and is enabled in every Test Suite by default.

<plugin-info class="\Testo\ErrorHandler\ErrorHandlerPlugin" name="Error Handler" included="\Testo\Application\Config\Plugin\SuitePlugins" />

## How errors are caught

Before a test starts, the plugin installs its own error handler and removes it when the test ends. A handler that was installed earlier, for example by the application bootstrap, keeps working: every error reaches it first. Errors silenced with `@` or excluded by `error_reporting()` are left alone.

Errors from `#[BeforeTest]` and `#[AfterTest]` hooks belong to the test just like errors from its body. `#[BeforeClass]` and `#[AfterClass]` hooks run outside any test, and the plugin does not catch their errors.

## Failing a test on errors

<signature name="\Testo\ErrorHandler\ErrorHandlerPlugin::__construct(bool $failOnError = false)">
<short>Catches PHP errors in every test of the Test Suite.</short>
<description>
By default errors are only reported and the test status doesn't change. With `failOnError: true` a passing test that raised an error gets <enum>\Testo\Core\Value\Status::Failed</enum>, with the first error as the failure.
</description>
<param name="$failOnError">Fail a passing test if it raised at least one PHP error.</param>
<example>
```php
use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;
use Testo\ErrorHandler\ErrorHandlerPlugin;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: ['tests/Unit'],
            plugins: [new ErrorHandlerPlugin(failOnError: true)],
        ),
    ],
);
```
</example>
</signature>

## The plugin's handler is always on the stack

While a test runs, the plugin's handler is installed, so `set_error_handler()` inside a test **always** returns a previous handler, even if the application never installed one.

::: warning
Code that decides from the result of `set_error_handler()` whether a handler already exists behaves differently under the plugin than in production: its "no previous handler" branch never runs in a test. If a test covers exactly that branch, opt it out of the plugin with <attr>\Testo\ErrorHandler\WithoutErrorHandler</attr>.
:::

## Tests that change the handler stack

After each test the plugin puts the handler stack back as it was, so a handler one test forgot doesn't catch errors of the tests after it. A test that leaves its own handler on the stack or removes someone else's is marked <enum>\Testo\Core\Value\Status::Risky</enum>. A test that removes the handler it installed doesn't need to declare anything.

<signature h="3" name="#[\Testo\ErrorHandler\ExpectErrorHandlerChange]">
<short>Declares that the test changes the error handler stack on purpose.</short>
<description>
For tests that check how an error handler gets installed, such as the application bootstrap. With the attribute such a test is not marked <enum>\Testo\Core\Value\Status::Risky</enum>. If a marked test leaves the stack unchanged, it fails: the declaration no longer matches what the test does.

The attribute goes on a method, a function or a class.
</description>
<example>
```php
use Testo\ErrorHandler\ExpectErrorHandlerChange;

#[Test]
#[ExpectErrorHandlerChange]
public function registersTheApplicationHandler(): void
{
    $app->registerErrorHandler();

    // ...
}
```
</example>
</signature>

## Turning the plugin off

<signature h="3" name="#[\Testo\ErrorHandler\WithoutErrorHandler]">
<short>Takes the test out of the plugin's reach.</short>
<description>
The plugin installs no handler for a marked test and checks nothing: the test sees error handling exactly as the process has it, and `set_error_handler()` returns `null` if no handler was installed before the test.

The attribute goes on a method, a function or a class. Whatever such a test leaves on the stack is inherited by the tests after it, so it has to clean up after itself.
</description>
<example>
```php
use Testo\ErrorHandler\WithoutErrorHandler;

#[Test]
#[WithoutErrorHandler]
public function fallsBackWithoutPreviousHandler(): void
{
    // ...
}
```
</example>
</signature>

To turn the plugin off for a whole Test Suite, remove it from the default set in `testo.php`:

```php
use Testo\Application\Config\Plugin\SuitePlugins;
use Testo\Application\Config\SuiteConfig;
use Testo\ErrorHandler\ErrorHandlerPlugin;

new SuiteConfig(
    name: 'Legacy',
    location: ['tests/Legacy'],
    plugins: SuitePlugins::without(ErrorHandlerPlugin::class),
),
```
