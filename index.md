---
layout: home
title: Testo — Modern PHP Testing Framework
description: PHP testing framework without TestCase inheritance. Clean OOP, middleware architecture, PSR-14 events, Assert/Expect facades.
image: /images/og-image.jpg
llms: false

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
    src: /logo-full.svg
    alt: Testo Logo
  actions:
    - theme: brand
      text: Get Started
      link: /docs/getting-started
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
import { data as jbPlugin } from './.vitepress/theme/jetbrains-plugin.data'

const ideScreenshot = {
  light: '/images/ide-screenshot-light.jpg',
  dark: '/images/ide-screenshot-dark.jpg'
}

const assertTabs = [
  { name: 'Assert.php', slot: 'assert', icon: 'testo' },
  { name: 'Expect.php', slot: 'expect', icon: 'testo' },
  { name: 'Exception.php', slot: 'expectException', icon: 'testo' },
  { name: 'Attributes.php', slot: 'expectAttr', icon: 'testo-class' },
]

const declareTabs = [
  { name: 'Class', slot: 'declare-class', icon: 'testo-class' },
  { name: 'Function', slot: 'declare-function', icon: 'testo-function' },
  { name: 'Convention', slot: 'declare-convention', icon: 'testo-class' },
  { name: 'Inline', slot: 'declare-inline', icon: 'class' },
]
</script>

<div style="max-width: 700px; margin: 48px auto 0;">

::: warning 🚧 Work in Progress
Testo is still under active development and not ready for production use.
Feel free to explore and experiment, but don't rely on it for real projects yet.

Want to support the project? [Star the repo](https://github.com/php-testo/testo) or [become a sponsor](/sponsor).
:::

</div>

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

<div class="home-feature">

## Multiple Ways to Declare Tests

<div class="home-feature-row">
<div class="home-feature-text">

Write tests the way that fits your style.

- Tests can be classes, functions, or even attributes right in production code (Inline Tests).
- Classes don't need to inherit from a base test class. Code stays clean.
- Test discovery by naming conventions or explicit attributes.

</div>
<div class="home-feature-code">
<CodeTabs :tabs="declareTabs">

<template #declare-class>

```php
// Explicit test declaration with #[Test] attribute

final class OrderTest
{
    #[Test]
    public function createsOrderWithItems(): void
    {
        $order = new Order();
        $order->addItem(new Product('Bread'));

        Assert::int($order->itemCount())->equals(1);
    }
}
```

</template>

<template #declare-function>

```php
// Explicit test with #[Test] attribute
// or "test" prefix in function name

#[Test]
function validates_email_format(): void
{
    $validator = new EmailValidator();

    Assert::true($validator->isValid('user@example.com'));
    Assert::false($validator->isValid('invalid'));
}

function testEmailValidator(): void { ... }
```

</template>

<template #declare-convention>

```php
// "Test" suffix on class and "test" prefix on methods

final class UserServiceTest
{
    public function testCreatesUser(): void
    {
        $user = $this->service->create('john@example.com');

        Assert::string($user->email)->contains('@');
    }

    public function testDeletesUser(): void { /* ... */ }
}
```

</template>

<template #declare-inline>

```php
// Test the method right in your code
// Convenient for simple cases

final class Calculator
{
    #[TestInline([1, 1], 2)]
    #[TestInline([40, 2], 42)]
    #[TestInline([-5, 5], 0)]
    public function sum(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

</template>

</CodeTabs>
</div>
</div>
</div>

<div class="home-feature">

## First-Class IDE Integration

<div class="home-feature-row">
<div
  class="home-feature-bg-image"
  :style="{ '--bg-image-light': `url(${ideScreenshot.light})`, '--bg-image-dark': `url(${ideScreenshot.dark})` }"
></div>
<div class="home-feature-text">

Native plugin for PhpStorm and IntelliJ IDEA.

Full-featured workflow: run and re-run from gutter icons, navigation between tests and code, debugging with breakpoints, test generation, results tree.

<JetBrainsPluginButton :pluginId="jbPlugin.pluginId" :downloads="jbPlugin.downloads" :rating="jbPlugin.rating" />

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
