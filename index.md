---
layout: home

hero:
  name:
  text: |
    The PHP Testing
    Framework with a
    Taste for Khinkali
  tagline: |
    Built for developers, who crave
    bread-and-butter tests
    with juicy environment control.
  image:
    src: https://github.com/php-testo/.github/blob/1.x/resources/logo-full.svg?raw=true
    alt: Testo Logo
  actions:
    - theme: brand
      text: Get Started
      link: /docs/getting-started
    - theme: alt
      text: Why Testo?
      link: /docs/why-testo
    - theme: alt
      text: GitHub
      link: https://github.com/php-testo/testo

features:
  - title: Familiar OOP
    details: Tests are classes without TestCase inheritance or functions. Code stays clean.

  - title: IDE Integration
    details: PhpStorm/IntelliJ IDEA plugin with test running, navigation, debugging, and all the workflow you expect.

  - title: Small Core
    details: Everything else is middleware and event dispatchers with unlimited customization.

  - title: Well-Designed API
    details: Separate Assert (now) and Expect (later) facades with pipe assertions for type-safe checks.
---

<script setup>
const assertTabs = [
  { name: 'Assert.php', slot: 'assert', icon: 'testo' },
  { name: 'Expect.php', slot: 'expect', icon: 'testo' },
  { name: 'Exception.php', slot: 'expectException', icon: 'testo' },
  { name: 'Attributes.php', slot: 'expectAttr', icon: 'testo-class' },
]
</script>

<div class="home-feature">

## Well-Designed Assertion API

<div class="home-feature-row">
<div class="home-feature-text">

Assertion functions are split into semantic groups:

- `Assert::` facade — assertions, executed immediately
- `Expect::` facade — expectations, deferred until test completion

Pipe syntax with type grouping keeps code concise and type-safe.

</div>
<div class="home-feature-code">
<CodeTabs :tabs="assertTabs">

<template #assert>

```php
use Testo\Assert;

// Pipe assertions — grouped by type
Assert::string($email)->contains('@');
Assert::int($age)->greaterThan(18);
Assert::file('config.php')->exists();

Assert::array($order->items)
    ->allOf(Item::class)
    ->hasCount(3);
```

</template>

<template #expect>

```php
use Testo\Expect;

// ORM should stay in memory
Expect::leaks($orm);

// Test fails if entities are not cleaned up
Expect::notLeaks(...$entities);

// Output validation
Expect::output()->contains('Done');
```

</template>

<template #expectException>

```php
// Have you seen this anywhere else?
Expect::exception(ValidationException::class)
    ->fromMethod(Service::class, 'validateInput')
    ->withMessage('Invalid input')
    ->withPrevious(
        WrongTypeException::class,
        static fn (ExpectedException $e) => $e
            ->withCode(42)
            ->withMessage('Field "age" must be integer.'),
    );
```

</template>

<template #expectAttr>

```php
/**
 * You can use attributes for exception expectations
 */
#[ExpectException(ValidationException::class)]
public function testInvalidInput(): void
{
    $input = ['age' => 'twenty'];

    $this->service->validateInput($input);
}
```

</template>

</CodeTabs>
</div>
</div>
</div>

<div class="sponsors-section">
  <h2 class="sponsors-title">Sponsored by</h2>
  <div class="sponsors-grid">
    <a href="https://buhta.com" class="sponsor-card sponsor-logo" target="_blank" rel="noopener">
      <img src="/logo-buhta.svg" alt="Buhta" class="sponsor-image">
    </a>
  </div>
  <div class="sponsor-cta-link">
    <a href="/sponsor">Become a Sponsor</a>
    <span class="separator">|</span>
    <a href="https://github.com/php-testo/testo" target="_blank" rel="noopener">Star on GitHub</a>
  </div>
</div>
