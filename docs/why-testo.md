---
llms: false
---

# Why Testo?

Testo (pronounced [test-oh], meaning "dough" in many languages) is an extensible testing framework for PHP. Built for scenarios requiring complete customization of the testing process: SDKs, framework tools, complex integrations.

Unlike other testing frameworks, Testo provides everything at once: familiar and convenient PHP syntax, unprecedented extensibility and customizability, and a simple yet powerful architecture based on a minimal core and middleware system.

You can mold it into any testing infrastructure you need.

## History

Testo was born from the need for an extensible testing framework that could adapt to the complex requirements of modern PHP projects. In brief:

- Previously, to wrap test execution with custom logic, we relied on overriding the `TestCase::runTest()` method, which, although marked with `@internal` annotation, had existed for many years without semantic changes. It was a perfect extension point.
- However, in versions [10.5.46](https://github.com/sebastianbergmann/phpunit/commit/8f0f8205e3a38675392da55afc573c6bb6a43f4e), [11](https://github.com/sebastianbergmann/phpunit/issues/5254), and 12, this method became `private`.
- Appeals to maintainers [don't work](https://github.com/sebastianbergmann/phpunit/issues/6389). [Even these ones](https://github.com/sebastianbergmann/phpunit/issues/6381).
- PEST also faced this problem. What did they do? Simply [overrode some PHPUnit classes in their own namespace](https://github.com/pestphp/pest/tree/bc57a84e77afd4544ff9643a6858f68d05aeab96/overrides). But this is a fragile solution, so PEST additionally [set conflicts in composer.json](https://github.com/pestphp/pest/blob/bc57a84e77afd4544ff9643a6858f68d05aeab96/composer.json#L33) to prevent breaking PHPUnit updates.

## Testo Philosophy

### Developer's Full Control

From Testo's perspective, **tests are the developer's property, not the framework's**. All metadata and operational data needed by the framework are stored and processed separately.

Therefore:
- Test classes **don't need to extend** `TestCase`
- Test cases don't run themselves and don't even know their name in the test environment
- You can use the constructor however you want
- Tests can even be ordinary functions!

```php
#[Test]
function simpleTest(): void
{
    Assert::true(true);
}
```

### Extensibility

Testo is built on a simple idea: **a small core with a set of DTOs and contracts, and all functionality is built on top of middleware and event system**.

The core simply builds several pipelines from middleware, and then do whatever you want. Every framework feature is middleware or event handlers:
- Attributes in general
- Data providers
- Inline testing
- Assertion system (`Assert`, `Expect`)
- CLI rendering and TeamCity

### Well-Designed API

Instead of a bloated `Assert` facade with ~2300 lines (as in PHPUnit), Testo provides:
- **`Assert`** — for assertions (checked here and now)
- **`Expect`** — for expectations (checked after test completion)
- **Pipe assertions** — grouping by types for cleaner code:

```php
// Strings
Assert::string($string)->contains("str");

// Files
Assert::file("foo.txt")->notExists();

// Exceptions
Expect::exception(Failure::class)
    ->fromMethod(Service::class, 'process')
    ->withMessage("foo bar");
```

Testo comes with a [PhpStorm/IntelliJ IDEA plugin](https://plugins.jetbrains.com/plugin/28842-testo) that provides all the familiar functionality including test running, navigation, and debugging.

## Who Is Testo For?

Testo is built for those who:
- Develop **frameworks** and need deep test integration.
- Create **SDKs** with specific testing requirements.
- Build **complex systems** where PHPUnit doesn't provide the needed flexibility.
- Want **full control** over testing infrastructure.
- Prefer PHP syntax over JS.

## What's Next?

Testo is in active development and moving toward version 1.0.0. We're open to ideas and suggestions from the community.

Join the development on [GitHub](https://github.com/php-testo/testo).

---

> We believe developers should have full control over their testing environment, and Testo delivers exactly that.
