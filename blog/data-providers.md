---
title: "Data Providers"
date: 2026-02-01
description: "Flexible data providers in Testo: from simple DataSet to powerful combinations with DataZip, DataCross, and DataUnion."
image: /blog/data-providers/preview.jpg
author: Aleksei Gagarin
outline: deep
---

# Data Providers

In unit tests, we're used to data providers — their job is to supply argument sets (datasets) for test functions.

## PHPUnit Example

In PHPUnit, data providers are declared with attributes. For example, the `#[DataProvider]` attribute takes the name of a public static method in the current class, from which datasets will be extracted.

```php
#[DataProvider('dataSum')]
public function testSum(int $a, int $b, int $c): void
{
    $result = Helper::sum($a, $b);

    self::assertSame($c, $result);
}

public static function dataSum(): iterable
{
    yield [1, 1, 2];
    # datasets can be named:
    yield 'second dataset' => [1, 2, 3];
}
```

The data provider function can be in another class — PHPUnit simply uses a different attribute: `#[DataProviderExternal(External::class, 'dataMethod')]`.

If full data provider functionality is overkill, you can send datasets one at a time via the `#[TestWith]` attribute:

```php
#[TestWith([1, 1, 2])]
#[TestWith([1, 2, 3], 'second dataset')]
public function testSum(int $a, int $b, int $c): void { ... }
```

That's about all there is to say about data providers in PHPUnit ¯\\\_(ツ)\_/¯

## What's in Testo?

Well, this article wouldn't exist if there was nothing to say.

**First**, I didn't like the `#[TestWith]` attribute name in PHPUnit. It conveys the intent well (*test with "this"*), but what about consistency? I wouldn't have known about this attribute if not by chance (do you know about it?).

::: tip ☝️ It would be better if this attribute appeared in IDE suggestions when typing "Data": next to `DataProvider`.
:::

That's why in Testo this attribute is named: `#[DataSet]`.

**Second**, Testo has no separate `#[DataProviderExternal]` attribute: the need for it simply disappears, since you can pass any `callable` to `#[DataProvider]`.

**And third**, datasets in Testo can merge not only vertically, but also horizontally and diagonally.

Let's go through everything in order.

### DataSet

Simply a standalone dataset for a test:

```php
#[DataSet([1, 1, 2])]
#[DataSet([1, 2, 3], 'second dataset')]
public function testSum(int $a, int $b, int $c): void { ... }
```

The second argument is a label that appears in reports. Useful when a test fails and you want to immediately see which scenario broke.

### DataProvider

Like PHPUnit, Testo expects data providers to return dataset collections: `iterable<array>`. The attribute accepts `non-empty-string|callable` as a pointer to the provider.

1. If a string is provided, Testo first looks for a method in the same class. If not found, it checks if it's a `callable` (a function or `callable-string` like `Class::method`).

    ```php
    // Method in current class
    #[DataProvider('dataSum')]

    // callable-string
    #[DataProvider('AnyClass::method')]
    ```

2. Another `callable` example is `callable-array`:

    ```php
    // Method from another class
    #[DataProvider([AnyClass::class, 'method'])]
    ```

3. Don't forget about invokable classes with `__invoke()` method:

    ```php
    // Class with __invoke() method
    #[DataProvider(new FileReader('sum-args.txt'))]
    ```

    Valentin Udaltsov reached out with a request for this feature, not knowing it was already implemented.

    ![Telegram](/blog/data-providers/telegram.png)
    _Thanks for the use case._

4. And the best part: closures directly in attributes. I don't have ideas why someone would need this, but if PHP 8.5 allows it, why not?

    ```php
    // Just a closure (PHP 8.5)
    #[DataProvider(static function(): iterable {
        yield from Source::fromFile();
        yield from Source::fromCache(\getenv('CACHE_KEY'));
    })]
    // Or
    #[DataProvider(SomeClass::method(...))]
    ```

### Combining Providers

You probably guessed that stacking multiple Data-attributes (`#[DataSet]` and `#[DataProvider]`) on a function will grow the dataset collection, similar to a UNION query in SQL.

```php
#[DataSet([1, 1, 2])]
#[DataProvider('dataSum')]
#[DataProvider(SomeClass::method(...))]
public function testSum(int $a, int $b, int $c): void { ... }
```

The test runs for all datasets sequentially: first `[1, 1, 2]` from `DataSet`, then all from `dataSum`, then all from `SomeClass::method()`.

::: info 🤔 But what if you want to combine datasets in more interesting ways?
:::

### DataZip

![DataZip](/blog/data-providers/zip.png)

Pairs providers element by element: first with first, second with second.

Useful when a provider is already used in other tests:

```php
// Provider 'users' is already used in testLogin, testLogout, testProfile...
#[DataProvider('users')]
public function testLogin(string $user): void { ... }

// Here we want to add expected permissions for each user
#[DataZip(
    new DataProvider('users'),       // admin, guest, bot
    new DataProvider('canDelete'),   // true, false, false
)]
public function testDeletePermission(string $user, bool $expected): void { ... }
```

Result: `admin` → `true`, `guest` → `false`, `bot` → `false`.

### DataCross

![DataCross](/blog/data-providers/cross.png)

Cartesian product — all possible combinations. Useful when parameters are independent and you need to test every pair.

```php
#[DataCross(
    new DataProvider('browsers'),    // chrome, firefox, safari
    new DataProvider('screenSizes'), // desktop, tablet, mobile
)]
public function testResponsiveLayout(string $browser, int $width, int $height): void { ... }
```

3 browsers × 3 screen sizes = 9 tests. Three providers with 5 elements each — already 125 tests. `DataCross` grows fast, use wisely.

### DataUnion

![DataUnion](/blog/data-providers/union.png)

The `#[DataUnion]` attribute merges multiple providers into one — simply concatenates datasets into a single collection, just like stacking multiple `#[DataProvider]` attributes on a test.

::: info 🫤 Wait, why a separate attribute?
:::

`DataUnion` is needed **inside** `DataCross` or `DataZip`:

```php
#[DataCross(
    new DataUnion(
        new DataProvider('legacyFormats'),
        new DataProvider('modernFormats'),
    ),
    new DataProvider('compressionLevels'),
)]
public function testExport(string $format, int $compression): void { ... }
```

All formats (legacy + modern) are crossed with each compression level.

### Nesting

Providers can be nested to any depth:

```php
#[DataCross(
    new DataZip(
        new DataCross(
            new DataProvider('users'),      // alice, bob
            new DataProvider('roles'),      // admin, viewer
        ),
        new DataProvider('canEdit'),        // true, false, true, false
    ),
    new DataUnion(
        new DataSet([new Document('readme.md')], 'readme'),
        new DataProvider('documents'),      // doc1, doc2
    ),
)]
public function testDocumentAccess(
    string $user,
    string $role,
    bool $canEdit,
    Document $doc
): void { ... }
```

Here `users × roles` produces 4 combinations, which are zipped with 4 expected results, and all of that is crossed with 3 documents (1 from DataSet + 2 from DataProvider) = 12 tests.

## Can PHPUnit do this?

Not out of the box. But there's [t-regx/phpunit-data-provider](https://github.com/t-regx/phpunit-data-provider) package that adds `cross()`, `zip()`, `join()` and other methods.

Here's what similar code looks like:

```php
#[DataProvider('usersWithPermissions')]
public function testDeletePermission(string $user, bool $expected): void { ... }

public function usersWithPermissions(): DataProvider
{
    return DataProvider::zip(
        DataProvider::list('admin', 'guest', 'bot'),
        DataProvider::list(true, false, false)
    );
}
```

It works, but requires an intermediate wrapper method. In Testo, composition happens declaratively — right in the attributes above the test.

::: tip Write less, test more
:::
