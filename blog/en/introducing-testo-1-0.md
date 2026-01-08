# Introducing Testo 1.0

We are excited to announce the first stable release of Testo - a modern PHP testing framework designed for simplicity and speed.

## Why Testo?

PHP testing has come a long way, but we felt there was room for something new. Testo was built with these goals in mind:

- **Developer Experience First** - Writing tests should feel natural and enjoyable
- **Speed** - Parallel execution out of the box for faster feedback loops
- **Modern PHP** - Built for PHP 8.1+ with full support for attributes and fibers

## Key Features

### Simple Test Syntax

```php
test('user can be created', function () {
    $user = new User('John');

    expect($user->name)->toBe('John');
    expect($user->isActive())->toBeTrue();
});
```

### Rich Assertions

Testo comes with a comprehensive assertion library:

```php
expect($value)->toBe(42);
expect($array)->toContain('item');
expect($string)->toMatch('/pattern/');
expect($callable)->toThrow(Exception::class);
```

### Parallel Execution

Run tests in parallel to speed up your test suite:

```bash
vendor/bin/testo --parallel
```

## Getting Started

Install Testo via Composer:

```bash
composer require --dev php-testo/testo
```

Check out the [Getting Started](/docs/en/getting-started) guide for more details.

## What's Next?

This is just the beginning. We have exciting features planned:

- IDE plugins for PHPStorm and VS Code
- Code coverage reporting
- Snapshot testing
- And much more!

Join us on [GitHub](https://github.com/php-testo/testo) and be part of the journey.
