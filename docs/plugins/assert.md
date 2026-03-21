---
outline: [2, 3]
llms_description: "How to write assertions in Testo tests. Two facades: Assert for immediate checks (same, equals, true, null, blank, fail), typed assertion chains (string, int, float, array, iterable, object, json) with fluent API; Expect for post-test expectations (exception with message/code/previous matching, memory leak detection). Start here to understand assertion syntax and available checks."
---

# Assert

The plugin provides assertion functionality in tests through the <class>\Testo\Assert</class> and <class>\Testo\Expect</class> facades.

<plugin-info class="\Testo\Assert\AssertPlugin" name="Assert" included="\Testo\Application\Config\Plugin\SuitePlugins" />

## Assert vs Expect

The difference between the facades is **when** the check happens:

- **<class>\Testo\Assert</class>** — assertions. Checked immediately, right on the same line: "check and forget".
- **<class>\Testo\Expect</class>** — expectations. Registered during the test, but verified after the test finishes: "remember now, check later".

This separation removes naming dissonance. When you see <func>\Testo\Expect::exception()</func> in a test, it's immediately clear that the check will happen later — after the test completes. While <func>\Testo\Assert::same()</func> fires right on that line.

## Basic Assertions

::: warning
Note that Testo uses a more intuitive argument order: `$actual` (the value being checked) comes first, then `$expected` (the expected value). This differs from the legacy xUnit approach.
:::

For most checks, these methods are all you need:

<signature compact h="4" name="\Testo\Assert::same(mixed $actual, mixed $expected, string $message = ''): void">
<short>Strict comparison of two values (`===`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::notSame(mixed $actual, mixed $expected, string $message = ''): void">
<short>Checks that two values are not identical (`!==`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::equals(mixed $actual, mixed $expected, string $message = ''): void">
<short>Loose comparison of two values (`==`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::notEquals(mixed $actual, mixed $expected, string $message = ''): void">
<short>Checks that two values are not equal (`!=`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::true(mixed $actual, string $message = ''): void">
<short>Checks that the value is strictly `true`.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::false(mixed $actual, string $message = ''): void">
<short>Checks that the value is strictly `false`.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::null(mixed $actual, string $message = ''): void">
<short>Checks that the value is `null`.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::contains(iterable $haystack, mixed $needle, string $message = ''): void">
<short>Checks that the collection contains the given value.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::count(Countable|iterable $actual, int $expected, string $message = ''): void">
<short>Checks the number of elements in a collection.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::instanceOf(mixed $actual, string $expected, string $message = ''): ObjectType">
<short>Checks that the object is an instance of the given class. Shortcut for `Assert::object($obj)->instanceOf($class)`.</short>
</signature>

<signature compact h="3" name="\Testo\Assert::blank(mixed $actual, string $message = ''): void">
<short>Checks for absence of data.</short>
<description>Unlike PHP's `empty()`, does not consider `false`, `0`, and `"0"` as blank values, because they carry real data. Blank values are: `null`, empty string `''`, empty array `[]`, and `Countable` objects with zero elements.</description>
</signature>

<signature compact h="3" name="\Testo\Assert::fail(string $message = ''): never">
<short>Forcefully fails the test.</short>
<description>Useful for lines of code that execution should never reach.</description>
<param name="$message">Reason for the test failure.</param>
<example>
```php
foreach ($users as $user) {
    if ($user->isAdmin()) {
        Assert::same($user->role, 'admin');
        return;
    }
}
Assert::fail('There should be at least one admin in the list');
```
</example>
</signature>

### Custom Messages

Most methods accept an optional `$message` parameter. This is a custom description of what is being checked — it will appear in the report if the assertion fails. Works in both basic assertions (<func>\Testo\Assert::same()</func>, <func>\Testo\Assert::blank()</func>) and assertion chains:

```php
Assert::same($user->role, 'admin', 'User should have admin role');
```

## Assertion Chains

Instead of dozens of individual methods like `assertStringContains()`, `assertArrayHasKey()`, and twenty more with the `string*` prefix, Testo groups assertions into typed chains.

The idea is simple: the method at the start of the chain verifies that the value has the expected type, then opens access to type-specific checks. Methods can be called one after another:

```php
Assert::string($email)->contains('@');

Assert::int($age)->greaterThan(0)->lessThan(150);

Assert::array($items)
    ->hasKeys('id', 'name')
    ->isList()
    ->notEmpty();

Assert::object($dto)->instanceOf(UserDto::class)->hasProperty('email');

Assert::iterable($collection)
    ->allOf('int')
    ->contains(42)
    ->hasCount(10);
```

<signature h="3" name="\Testo\Assert::string(mixed $actual): StringType">
<short>Checks that the value is a string and opens string-specific assertions.</short>
<example>
```php
Assert::string($html)
    ->contains('<div>')
    ->notContains('<script>');
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\StringType::contains(string $needle, string $message = ''): static">
<short>Checks that the string contains the given substring.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\StringType::notContains(string $needle, string $message = ''): static">
<short>Checks that the string does not contain the given substring.</short>
</signature>

### Numeric Types

There are three entry points for numeric values. They only differ in the type check at the start — the chain methods are the same for all:

<signature compact h="4" name="\Testo\Assert::int(mixed $actual): IntType">
<short>Checks that the value is an integer and opens numeric assertions.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::float(mixed $actual): FloatType">
<short>Checks that the value is a floating-point number.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::numeric(mixed $actual): NumericType">
<short>Checks that the value is numeric (`int`, `float`, or numeric string).</short>
</signature>

Shared chain methods:

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::greaterThan(int|float $min, string $message = ''): static">
<short>Checks that the value is strictly greater than the given one.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::greaterThanOrEqual(int|float $min, string $message = ''): static">
<short>Checks that the value is greater than or equal to the given one.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::lessThan(int|float $max, string $message = ''): static">
<short>Checks that the value is strictly less than the given one.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::lessThanOrEqual(int|float $max, string $message = ''): static">
<short>Checks that the value is less than or equal to the given one.</short>
</signature>

```php
Assert::int(15)->greaterThan(10);
Assert::float(3.14)->lessThan(4.0);
Assert::numeric('42.5')->greaterThanOrEqual(0);
```

<signature h="3" name="\Testo\Assert::iterable(mixed $actual): IterableType">
<short>Checks that the value is iterable and opens collection assertions.</short>
<description>
Works with arrays and objects implementing `Traversable`.

::: warning
If you pass a generator into the chain, it will be consumed — generators in PHP can only be iterated once.
:::
</description>
<example>
```php
Assert::iterable($users)
    ->notEmpty()
    ->allOf(User::class)
    ->every(fn(User $u) => $u->isActive());
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::notEmpty(string $message = ''): static">
<short>Checks that the collection contains at least one element.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::contains(mixed $needle, string $message = ''): static">
<short>Checks that the collection contains the given value.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::sameSizeAs(iterable $expected, string $message = ''): static">
<short>Checks that the number of elements matches another collection.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::hasCount(int $expected): static">
<short>Checks that the collection contains exactly the given number of elements.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::allOf(string $type, string $message = ''): static">
<short>Checks that all elements are of the given type (`get_debug_type()`: `'int'`, `'string'`, class name).</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::every(callable $callback, string $message = ''): static">
<short>Checks that every element satisfies the given predicate.</short>
</signature>

<signature h="3" name="\Testo\Assert::array(mixed $actual): ArrayType">
<short>Checks that the value is an array and opens array-specific assertions.</short>
<description>Inherits all methods from <func>\Testo\Assert::iterable()</func> and adds array-specific checks.</description>
<example>
```php
Assert::array($config)
    ->hasKeys('host', 'port')
    ->doesNotHaveKeys('password');

Assert::array([1, 2, 3])->isList()->allOf('int')->sameSizeAs([4, 5, 6]);
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ArrayType::hasKeys(int|string ...$keys): static">
<short>Checks that the array contains all listed keys.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ArrayType::doesNotHaveKeys(int|string ...$keys): static">
<short>Checks that the array does not contain any of the listed keys.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ArrayType::isList(string $message = ''): static">
<short>Checks that the array is a list (sequential integer keys starting from 0).</short>
</signature>

<signature h="3" name="\Testo\Assert::object(mixed $actual): ObjectType">
<short>Checks that the value is an object and opens object-specific assertions.</short>
<example>
```php
Assert::object($event)
    ->instanceOf(OrderCreated::class)
    ->hasProperty('orderId');
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ObjectType::instanceOf(string $expected, string $message = ''): static">
<short>Checks that the object is an instance of the given class or interface.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ObjectType::hasProperty(string $propertyName, string $message = ''): static">
<short>Checks that the object has the given property.</short>
</signature>

<signature h="3" name="\Testo\Assert::json(string $actual): JsonAbstract">
<short>Checks that the string contains valid JSON and opens structure assertions.</short>
</signature>

You can determine the type of the JSON value at the start, after which type-specific checks become available:

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isObject(): JsonObject">
<short>Checks that the JSON represents an object.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isArray(): JsonArray">
<short>Checks that the JSON represents an array.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isPrimitive(): JsonCommon">
<short>Checks that the JSON represents a primitive value (string, number, boolean, null).</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isStructure(): JsonStructure">
<short>Checks that the JSON represents a structure (object or array).</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::maxDepth(int $expected): static">
<short>Checks that the JSON nesting depth does not exceed the given limit.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::empty(): JsonCommon">
<short>Checks that the JSON object or array is empty.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonStructure::count(int $count, string $message = ''): static">
<short>Checks the number of elements in a JSON array or object.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonObject::hasKeys(array|string $keys, string $message = ''): JsonObject">
<short>Checks that the JSON object contains the given keys.</short>
</signature>

<signature h="4" name="\Testo\Assert\Api\Json\JsonStructure::assertPath(string $path, callable $callback): static">
<short>Checks a nested value at the given path.</short>
<description>The callback receives a `JsonAbstract` for the value at the specified path, allowing you to build nested assertion chains.</description>
</signature>

<signature h="4" name="\Testo\Assert\Api\Json\JsonCommon::matchesType(string $type): static">
<short>Validates the JSON structure against a Psalm type.</short>
<description>Accepts an extended Psalm type annotation — for example, `'array{foo: bool, bar?: non-empty-string}'` or `'list<array{id: positive-int}>'`.</description>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonCommon::matchesSchema(string $schema): static">
<short>Validates the JSON structure against a JSON Schema.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonCommon::decode(): mixed">
<short>Returns the decoded JSON value.</short>
</signature>

```php
// Type check and structure validation
Assert::json($string)->isObject()->hasKeys('id', 'name');
Assert::json($string)->isArray()->count(5);

// Check nested values by path
Assert::json($response->body())
    ->isObject()
    ->assertPath('data.users', fn(JsonAbstract $json) =>
        $json->isArray()->count(10)
    );

// Validate against a Psalm type
Assert::json('{"foo": true, "bar": "test"}')
    ->matchesType('array{foo: bool, bar?: non-empty-string}');

// Validate against a JSON Schema
Assert::json($string)->matchesSchema($schemaJson);

// Get the decoded value
$data = Assert::json($string)->isObject()->decode();
```

## Expectations (Expect)

Unlike assertions, expectations are registered during test execution and verified **after the test finishes**. This is useful when the result needs to be evaluated by a side effect — for example, a thrown exception or a memory state.

<signature h="3" name="\Testo\Expect::exception(string|\Throwable $classOrObject): ExpectedException">
<short>Expects the test to throw the given exception.</short>
<description>If the test finishes without an exception or with a different one, it will be considered failed. You can pass a specific exception object instead of a class name.</description>
<param name="$classOrObject">Class, interface, or object of the expected exception.</param>
<example>
```php
use Testo\Expect;

#[Test]
public function throwsOnInvalidInput(): void
{
    Expect::exception(\InvalidArgumentException::class);

    $service->process(null);
}
```
</example>
</signature>

You can narrow down the expected exception using chain methods:

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::fromMethod(string $class, string $method): self">
<short>Checks that the specified method is present in the exception's call stack.</short>
<description>
Can be called multiple times to require several methods in the call chain.

::: info
The call stack in an exception is captured at the moment of its creation, not when it is thrown. So this checks where the exception was created, not where it was rethrown via `throw`.
:::
</description>
<example>
```php
// Make sure the exception originated in validation,
// not rethrown from somewhere else
Expect::exception(ValidationException::class)
    ->fromMethod(UserValidator::class, 'validate');
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withMessage(string $message): self">
<short>Checks the exact exception message.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withMessagePattern(string $pattern): self">
<short>Checks that the message matches a regular expression.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withMessageContaining(string $substring): self">
<short>Checks that the message contains the given substring.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withCode(int|array $code): self">
<short>Checks the exception code. You can pass a single value or an array of acceptable codes.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withoutPrevious(): self">
<short>Checks that the exception has no previous exception.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withPrevious(string|\Throwable $classOrObject, ?callable $assertion = null): self">
<short>Checks for a previous exception of the given type.</short>
<param name="$assertion">Optional callback that receives an `ExpectedException` for the previous exception — this allows building nested checks with the same API: verify the message, code, or even its own `withPrevious()`.</param>
<example>
```php
Expect::exception(PaymentException::class)
    ->withPrevious(
        GatewayException::class,
        fn (ExpectedException $previous) => $previous
            ->withCode(503)
            ->withMessageContaining('connection refused'),
    );
```
</example>
</signature>

All chain methods can be combined in any order, building a precise description of the expected exception:

```php
Expect::exception(PaymentException::class)
    ->fromMethod(PaymentGateway::class, 'charge')
    ->withMessageContaining('insufficient funds')
    ->withCode([402, 422])
    ->withPrevious(GatewayException::class);
```

<signature h="3" name="\Testo\Expect::notLeaks(object ...$objects): NotLeaks">
<short>Expects the objects to be released from memory after the test finishes.</short>
<description>Useful when you need to make sure a service properly releases its resources.</description>
<example>
```php
#[Test]
public function serviceReleasesResources(): void
{
    $connection = new Connection();
    $service = new Service($connection);

    Expect::notLeaks($connection, $service);

    $service->process();
    // After the test, Testo will verify that $connection and $service are no longer held in memory
}
```
</example>
</signature>

<signature h="3" name="\Testo\Expect::leaks(object ...$objects): Leaks">
<short>Expects the objects to remain in memory after the test finishes.</short>
<description>
Useful for verifying that a cache or another mechanism actually retains objects.

::: warning
PHP may not collect objects if the test finishes with a thrown exception. There are also known issues with garbage collection on macOS.
:::
</description>
<example>
```php
#[Test]
public function cachePersistsObjects(): void
{
    $entity = new User();
    $cache->store($entity);

    Expect::leaks($entity);
    // After the test, Testo will verify that $entity is still held in memory (by the cache)
}
```
</example>
</signature>
