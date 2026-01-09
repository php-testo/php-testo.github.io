# Getting Started

Testo is an extensible testing framework built on a lightweight core with a middleware system.
It gives you full control over your testing environment while keeping the familiar PHP syntax you already know.

## Installation

Install Testo via Composer:

```bash
composer require --dev testo/testo
```

::: tip Requirements
PHP 8.3 or higher
:::

## Configuration

By default, if no configuration file is provided, Testo will run tests from the `tests` folder.

To customize the configuration, create a `testo.php` file in the root of your project:

```php
<?php

declare(strict_types=1);

use Testo\Config\ApplicationConfig;
use Testo\Config\SuiteConfig;
use Testo\Config\FinderConfig;

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
use Testo\Attribute\Test;
use Testo\Attribute\RetryPolicy;
use Testo\Attribute\ExpectException;

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

- Use the `#[Test]` attribute to mark test methods
- Test classes don't need to extend any base class
- Use `Assert` class for assertions (`same`, `true`, `false`, `null`, `contains`, `instanceOf`, etc.)
- Testo provides multiple attributes to extend testing capabilities (retry policies, exception handling, and more)

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

## Next Steps

- Learn about [CLI options](/docs/cli-reference) for filtering and running tests
- Explore [Events system](/docs/events) for extending test behavior
- Understand [Test filtering](/docs/filtering) capabilities
- Try the [Sample module](/docs/sample-module) for parameterized testing with data providers
