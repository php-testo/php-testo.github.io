---
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

To customize the configuration, create a `testo.php` file in the root of your project:

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
            location: new FinderConfig(
                include: ['tests/Unit'],
            ),
        ),
    ],
);
```

## Writing Your First Test

Create a test class in the configured test directory (e.g., `tests/CalculatorTest.php`):

```php
<?php

declare(strict_types=1);

namespace Tests;

use Testo\Assert;
use Testo\Assert\ExpectException;
use Testo\Application\Attribute\Test;
use Testo\Retry\RetryPolicy;

final class CalculatorTest
{
    #[Test]
    public function dividesNumbers(): void
    {
        $result = 10 / 2;

        Assert::same(5.0, $result);
        Assert::notSame(5, $result); // Types matter!
    }

    #[Test]
    #[RetryPolicy(maxAttempts: 3)]
    public function flakyApiCall(): void
    {
        // Retries up to 3 times if test fails
        $response = $this->makeExternalApiCall();

        Assert::same(200, $response->status);
    }

    #[Test]
    #[ExpectException(\RuntimeException::class)]
    public function throwsException(): void
    {
        throw new \RuntimeException('Expected error');
    }
}
```

### Key Points

- The `#[Test]` attribute marks test methods, and test classes don't need to inherit from a base class. See [Writing Tests](./writing-tests) for more options.
- Use the `Assert` facade for assertions and `Expect` for expectations.
- Testo provides multiple attributes to extend testing capabilities (retry policies, exception handling, and more).

## Running Tests

To run your tests, execute:

```bash
vendor/bin/testo
```

You should see output showing the test results with detailed information about passed and failed tests.

## IDE Support

Testo comes with an official [IDEA plugin](https://plugins.jetbrains.com/plugin/28842-testo) for PhpStorm and IntelliJ IDEA.

The plugin provides:
- Running tests directly from the IDE
- Navigation between test and implementation code
- Test result visualization
- Debugging support
