# Inline Tests

Inline tests let you write test cases directly on the method being tested using the `#[TestInline]` attribute. No separate test class needed.

```php
use Testo\Sample\TestInline;

#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
public function sum(int $a, int $b): int
{
    return $a + $b;
}
```

Each attribute runs the method with the given arguments and verifies the result.

## When to Use

Inline tests work well for:
- **Simple pure functions** where a dedicated test file would be excessive
- **Private helper methods** that you want to test without changing visibility
- **Prototyping** when you need immediate validation without switching context

For larger test suites (10+ cases) or tests that need explanation, consider writing separate tests with [DataProvider](./sample-module).

## Configuration

It's recommended to create a separate Test Suite for inline tests. Since inline tests live in your application code (not in `tests/`), you don't need other test finders there — only `TestInlineFinder`.

## Attribute Signature

```php
TestInline(array $arguments, mixed $result = null)
```

- `$arguments` — array of values passed to the method
- `$result` — expected return value (or a closure for custom assertions)

## Testing Private Methods

Need to test a private helper? Just add the attribute:

```php
#[TestInline(['password123'], false)]  // too short
#[TestInline(['Password123!'], true)]  // valid
#[TestInline(['pass'], false)]  // no number
private function isStrongPassword(string $password): bool
{
    return strlen($password) >= 8
        && preg_match('/[A-Z]/', $password)
        && preg_match('/[0-9]/', $password)
        && preg_match('/[^A-Za-z0-9]/', $password);
}
```

The method stays private — Testo handles the reflection internally.

## Named Arguments

Use named arguments for better readability:

```php
#[TestInline(['price' => 100.0, 'discount' => 0.1, 'tax' => 0.2], 108.0)]
#[TestInline(['price' => 50.0, 'discount' => 0.0, 'tax' => 0.1], 55.0)]
private function calculateFinalPrice(
    float $price,
    float $discount,
    float $tax
): float {
    return $price * (1 - $discount) * (1 + $tax);
}
```

## Custom Assertions

*Available in PHP 8.5+ (closures in attributes)*

For complex checks, pass a closure as the second parameter:

```php
use Testo\Assert;

#[TestInline([10, 3], fn($r) => Assert::greaterThan(3, $r))]
public function divide(int $a, int $b): float
{
    return $a / $b;
}
```

The closure receives the actual result and can perform any assertions:

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
