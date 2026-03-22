---
faqLevel: 2
llms_description: "Installation via Composer, testo.php configuration, writing first test class, running tests, IDE plugin setup"
---

# Getting Started

## Installation

Install Testo via Composer:

```bash
composer require --dev testo/testo
```

<p style="display: flex; gap: 8px;">
  <a href="https://packagist.org/packages/testo/testo"><img src="https://img.shields.io/packagist/php-v/testo/testo.svg?style=flat-square&logo=php" alt="PHP" style="display: inline-block;"></a>
  <a href="https://packagist.org/packages/testo/testo"><img src="https://img.shields.io/packagist/v/testo/testo.svg?style=flat-square&logo=packagist" alt="Latest Version on Packagist" style="display: inline-block;"></a>
  <a href="https://github.com/php-testo/testo/blob/1.x/LICENSE.md"><img src="https://img.shields.io/packagist/l/testo/testo.svg?style=flat-square" alt="License" style="display: inline-block;"></a>
  <a href="https://packagist.org/packages/testo/testo/stats"><img src="https://img.shields.io/packagist/dt/testo/testo.svg?style=flat-square" alt="Total Downloads" style="display: inline-block;"></a>
</p>

## Configuration

By default, if no configuration file is provided, Testo will run tests from the `tests` folder.

To configure Testo, create a `testo.php` file in the root of your project:

```php
<?php

declare(strict_types=1);

use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;
use Testo\Application\Config\FinderConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: ['tests/Unit'],
        ),
        new SuiteConfig(
            name: 'Sources',
            location: ['src'],
        ),
    ],
);
```

In this example we defined two test suites: `Unit` for unit tests located in `tests/Unit`, and `Sources` for [inline tests](plugins/inline.md) and [benchmarks](plugins/bench.md) right in the project source code, in the `src` folder.

To learn more about configuration, visit the [Configuration](configuration.md) section.

## Writing Your First Test

Create a test class in the configured directory (e.g., `tests/Unit/MyFirstTest.php`) and add a method with the <attr>\Testo\Test</attr> attribute:

```php
final class MyFirstTest
{
    #[Test]
    public function dividesNumbers(): void
    {
        $result = 10 / 2;

        Assert::same($result, 5.0);
        Assert::notSame($result, 5); // Types matter
    }
}
```

The <attr>\Testo\Test</attr> attribute marks the method as a test, and the <class>\Testo\Assert</class> facade checks assertions. More about test approaches, attributes, and conventions — in [Writing Tests](writing-tests.md).

## Running Tests

To run your tests, execute:

```bash
vendor/bin/testo
```

You should see output showing the test results with detailed information about passed and failed tests.

## IDE Support

Testo comes with an official IDEA plugin for PhpStorm and IntelliJ IDEA.

<JetBrainsPlugin />

The plugin provides:
- Running tests directly from the IDE
- Navigation between test and implementation code
- Test result visualization
- Debugging support
