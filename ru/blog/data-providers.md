---
title: "Data Providers"
date: 2026-02-01
description: "Гибкие провайдеры данных в Testo: от простого DataSet до мощных комбинаций с DataZip, DataCross и DataUnion."
image: /blog/data-providers/preview.jpg
author: Алексей Гагарин
outline: deep
---

# Data Providers

В Unit-тестах мы привыкли к провайдерам данных, задача которых — выдавать наборы аргументов (датасеты) для тестовой функции.

## На примере PHPUnit

В PHPUnit провайдеры данных объявляются атрибутами. Например, атрибут `#[DataProvider]` принимает имя публичного статического метода текущего класса, из которого и будут извлечены датасеты.

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
    # датасеты могут быть именованными:
    yield 'second dataset' => [1, 2, 3];
}
```

Функция провайдера данных может находиться в методе другого класса, тогда в PHPUnit просто используется другой атрибут: `#[DataProviderExternal(External::class, 'dataMethod')]`.

Если функционал провайдера данных избыточен, можно отправлять датасеты поштучно через атрибут `#[TestWith]`:

```php
#[TestWith([1, 1, 2])]
#[TestWith([1, 2, 3], 'second dataset')]
public function testSum(int $a, int $b, int $c): void { ... }
```

Больше про провайдеры данных в PHPUnit сказать нечего ¯\\\_(ツ)\_/¯

## Что в Testo?

Что-ж, этой статьи не было бы, если бы сказать было нечего.

**Во-первых**, мне в PHPUnit не понравилось название атрибута `#[TestWith]`. Оно неплохо передаёт намерение (*протестировать с "этим"*), но что насчёт консистентности? Я бы так и не узнал об этом атрибуте, если бы не случайность (а вы знаете о нём?).

::: tip ☝️ Было бы лучше, если бы такой атрибут вылезал в подсказках IDE при вводе слова "Data": рядом с <attr>\Testo\Data\DataProvider</attr>.
:::

Поэтому в Testo этот атрибут назван: <attr>\Testo\Data\DataSet</attr>.

**Во-вторых**, в Testo нет отдельного атрибута `#[DataProviderExternal]`: надобность в нём просто исчезает, поскольку в <attr>\Testo\Data\DataProvider</attr> можно просто передать любой `callable`.

**И в-третьих**, датасеты в Testo могут мержиться не только вертикально, но и горизонтально, и по-диагонали.

Обо всём по порядку.

### DataSet

Тупо отдельный датасет для теста:

```php
#[DataSet([1, 1, 2])]
#[DataSet([1, 2, 3], 'second dataset')]
public function testSum(int $a, int $b, int $c): void { ... }
```

Второй аргумент — метка, которая отображается в отчётах. Полезно, когда тест падает и хочется сразу понять какой сценарий сломался.

### DataProvider

Также как и PHPUnit, Testo ожидает, что провайдеры данных возвращают перечисления датасетов: `iterable<array>`. Атрибут принимает `non-empty-string|callable` в качестве указателя на провайдер данных.

1. Если указана строка, то сначала ищется метод в этом же классе. Если метода нет, то проверяется на `callable` (это может быть функция или `callable-string` вида `Class::method`).

    ```php
    // Метод текущего класса
    #[DataProvider('dataSum')]

    // callable-string
    #[DataProvider('AnyClass::method')]
    ```

2. Ещё один пример `callable` — это `callable-array`:

    ```php
    // Метод другого класса
    #[DataProvider([AnyClass::class, 'method'])]
    ```

3. Вспомним и про Invokeable-классы, в которых есть метод `__invoke()`:

    ```php
    // Класс с методом __invoke()
    #[DataProvider(new FileReader('sum-args.txt'))]
    ```

    С запросом на такую фичу обратился Валентин Удальцов, ещё не зная, что она уже реализована.

    ![Telegram](/blog/data-providers/telegram.png)
    _Спасибо за юзкейс._

4. И самый сок: просто замыкание в атрибуте. У меня пока нет идей, зачем кому-то это понадобится, но если PHP 8.5 позволяет это сделать, то почему бы и да?

    ```php
    // Просто замыкание (PHP 8.5)
    #[DataProvider(static function(): iterable {
        yield from Source::fromFile();
        yield from Source::fromCache(\getenv('CACHE_KEY'));
    })]
    // Или
    #[DataProvider(SomeClass::method(...))]
    ```

### Комбинирование провайдеров

Вы, наверное, догадываетесь, что если Data-атрибуты (<attr>\Testo\Data\DataSet</attr> и <attr>\Testo\Data\DataProvider</attr>) повесить на функцию несколько раз, то это приведёт к увеличению коллекции датасетов подобно UNION запросу в SQL.

```php
#[DataSet([1, 1, 2])]
#[DataProvider('dataSum')]
#[DataProvider(SomeClass::method(...))]
public function testSum(int $a, int $b, int $c): void { ... }
```

Тест запустится для всех датасетов последовательно: сначала `[1, 1, 2]` из <attr>\Testo\Data\DataSet</attr>, затем все из `dataSum`, затем все из `SomeClass::method()`.

::: info 🤔 Но что, если хочется соединить датасеты как-то поинтереснее?
:::

### DataZip

![DataZip](/blog/data-providers/zip.png)

Соединяет провайдеры попарно: первый элемент с первым, второй со вторым.

Удобно, когда провайдер уже используется в других тестах:

```php
// Провайдер users уже используется в testLogin, testLogout, testProfile...
#[DataProvider('users')]
public function testLogin(string $user): void { ... }

// А тут мы хотим добавить ожидаемые права для каждого юзера
#[DataZip(
    new DataProvider('users'),       // admin, guest, bot
    new DataProvider('canDelete'),   // true, false, false
)]
public function testDeletePermission(string $user, bool $expected): void { ... }
```

Результат: `admin` → `true`, `guest` → `false`, `bot` → `false`.

### DataCross

![DataCross](/blog/data-providers/cross.png)

Декартово произведение — все возможные комбинации. Полезно, когда параметры независимы друг от друга и нужно проверить каждую пару.

```php
#[DataCross(
    new DataProvider('browsers'),    // chrome, firefox, safari
    new DataProvider('screenSizes'), // desktop, tablet, mobile
)]
public function testResponsiveLayout(string $browser, int $width, int $height): void { ... }
```

3 браузера × 3 разрешения = 9 тестов. Три провайдера по 5 элементов — уже 125 тестов. <attr>\Testo\Data\DataCross</attr> растёт быстро, используйте осознанно.

### DataUnion

![DataUnion](/blog/data-providers/union.png)

Атрибут <attr>\Testo\Data\DataUnion</attr> объединяет несколько провайдеров в один — просто склеивает датасеты в общую коллекцию наравне с тем, как если бы несколько <attr>\Testo\Data\DataProvider</attr> были повешены на тест.

::: info 🫤 Стоп, а зачем отдельный атрибут?
::: 

<attr>\Testo\Data\DataUnion</attr> нужен **внутри** <attr>\Testo\Data\DataCross</attr> или <attr>\Testo\Data\DataZip</attr>:

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

Все форматы (legacy + modern) скрещиваются с каждым уровнем сжатия.

### Вложенность

Провайдеры можно вкладывать на любую глубину:

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

Здесь `users × roles` даёт 4 комбинации, которые зипуются с 4 ожидаемыми результатами, и всё это скрещивается с 3 документами (1 из DataSet + 2 из DataProvider) = 12 тестов.

## А в PHPUnit так можно?

Из коробки — нет. Но есть пакет [t-regx/phpunit-data-provider](https://github.com/t-regx/phpunit-data-provider), который добавляет `cross()`, `zip()`, `join()` и другие методы.

Вот как выглядит аналогичный код:

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

Работает, но требует промежуточный метод-обёртку. В Testo композиция происходит декларативно — прямо в атрибутах над тестом.

::: tip Пишите меньше, тестируйте больше
:::

