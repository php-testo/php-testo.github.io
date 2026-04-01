---
llms_description: "How to test methods in-place with #[TestInline] attribute. Supports private methods, custom assertion closures, and named arguments. Good for pure functions where a separate test file is overkill."
---

# Inline Tests

Inline tests let you write tests directly on the method being tested using the <attr>\Testo\Inline\TestInline</attr> attribute. No separate test function needed.

<plugin-info name="Inline" class="\Testo\Inline\InlineTestPlugin" included="\Testo\Application\Config\Plugin\SuitePlugins" />

## Configuration

It's recommended to create a separate Test Suite for inline tests, pointing to the `src` folder: you'll most likely embed tests in your application code, not in `tests/`.

<signature h="2" name="#[\Testo\Inline\TestInline(array $arguments, mixed $result = null)]">
<short>Declares an inline test on a method or function.</short>
<description>
Can be used multiple times — each attribute creates a separate test.

Inline tests work well for:
- **Simple pure functions** where a dedicated test file would be excessive.
- **Private helper methods** that you want to test without changing visibility.
- **Prototyping** when you need immediate validation without switching context.

For larger test suites (10+ cases) or tests that need explanation, consider writing separate tests using providers from the <plugin>Data</plugin> plugin.
</description>
<param name="$arguments">Array of values passed to the method. Named arguments are supported.</param>
<param name="$result">Expected return value.
Can accept a <class>\Closure(mixed $result)</class>, in which case an arbitrary check inside the closure will be performed instead of comparing against a specific value.
</param>
<example>
Works with public and private methods, as well as functions:

::: code-group
```php [Private method]
#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
private static function sum(int $a, int $b): int
{
    return $a + $b;
}
```
```php [Function]
#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
function sum(int $a, int $b): int
{
    return $a + $b;
}
```
:::
</example>
<example>
Use named arguments for better readability:

```php
#[TestInline(['price' => 100.0, 'discount' => 0.1, 'tax' => 0.2], 108.0)]
#[TestInline(['price' => 50.0, 'discount' => 0.0, 'tax' => 0.1], 55.0)]
private static function calculateFinalPrice(
    float $price,
    float $discount,
    float $tax
): float {
    return $price * (1 - $discount) * (1 + $tax);
}
```
</example>
</signature>

## Custom Assertions

*Available in PHP 8.5+ (closures in attributes)*

For complex checks, pass a closure as the second parameter, where you can perform any assertions on the result, which will be passed as an argument:

```php
#[TestInline(
    arguments: ['john.doe@example.com'],
    result: function (User $user) {
        Assert::same('john.doe@example.com', $user->email);
        Assert::true($user->isActive);
        Assert::notNull($user->createdAt);
    }
)]
public function createUser(string $email): User
{
    // ...
}
```

In PHP 8.6 this becomes even more elegant with [partial application](https://wiki.php.net/rfc/partial_function_application_v2):

```php
#[TestInline([10, 3], Assert::greaterThan(3, ?))]
public function divide(int $a, int $b): float
{
    return $a / $b;
}
```
