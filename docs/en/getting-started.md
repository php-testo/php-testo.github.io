# Getting Started

This guide will help you get started with Testo in your PHP project.

## Installation

Install Testo via Composer:

```bash
composer require --dev php-testo/testo
```

## Writing Your First Test

Create a test file in your `tests` directory:

```php
<?php

use function Testo\{test, expect};

test('basic math works', function () {
    expect(1 + 1)->toBe(2);
});

test('strings can be concatenated', function () {
    $greeting = 'Hello, ' . 'World!';
    expect($greeting)->toBe('Hello, World!');
});
```

## Running Tests

Run your tests using the Testo CLI:

```bash
vendor/bin/testo
```

You should see output like:

```
PASS  tests/ExampleTest.php
  ✓ basic math works
  ✓ strings can be concatenated

Tests: 2 passed
Time:  0.05s
```

## Next Steps

- Learn about [Assertions](/docs/en/assertions)
- Explore [Test Organization](/docs/en/organizing-tests)
- Configure [Parallel Execution](/docs/en/parallel)
