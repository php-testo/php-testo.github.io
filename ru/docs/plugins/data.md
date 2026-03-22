---
outline: [2, 3]
---

# Провайдеры данных

Провайдеры данных позволяют запускать один тест с разными наборами входных данных. Каждый набор — отдельный запуск теста.

<plugin-info name="Data" />

<signature h="2" name="#[\Testo\Data\DataSet(array $arguments, ?string $name = null)]">
<short>Объявляет набор аргументов для параметризованного теста. Можно использовать многократно — каждый атрибут создаёт отдельный запуск.</short>
<param name="$arguments">Массив значений, передаваемых в тестовый метод.</param>
<param name="$name">Метка для отображения в отчётах. Помогает понять, какой сценарий упал.</param>
<example>
```php
#[Test]
#[DataSet([1, 1, 2])]
#[DataSet([2, 3, 5])]
#[DataSet([0, 0, 0])]
public function testSum(int $a, int $b, int $expected): void
{
    Assert::same($expected, $a + $b);
}
```
</example>
<example>
С метками:

```php
#[DataSet([1, 1, 2], 'positive numbers')]
#[DataSet([-1, -1, -2], 'negative numbers')]
#[DataSet([0, 0, 0], 'zeros')]
public function testSum(int $a, int $b, int $expected): void { ... }
```
</example>
</signature>

<signature h="2" name="#[\Testo\Data\DataProvider(callable|string $provider)]">
<short>Предоставляет данные для параметризованного теста из метода или вызываемого объекта.</short>
<param name="$provider">Источник данных: имя метода (`'method'`), callable (`[Class::class, 'method']`), замыкание или вызываемый объект. Должен возвращать `iterable`. Строковые ключи элементов становятся метками датасетов в отчётах.</param>
<example>
```php
#[Test]
#[DataProvider('userDataProvider')]
public function testUserValidation(string $email, bool $expected): void
{
    $isValid = $this->validator->validate($email);
    Assert::same($expected, $isValid);
}

public function userDataProvider(): iterable
{
    yield ['valid@example.com', true];
    yield ['invalid', false];
    yield ['test@domain.co.uk', true];
}
```
</example>
</signature>

### Гибкие источники провайдеров

<attr>\Testo\Data\DataProvider</attr> принимает различные типы вызываемых объектов:

**Имя метода из того же класса:**
```php
#[DataProvider('dataProvider')]
public function testSomething($data): void { ... }
```

**Метод из другого класса:**
```php
#[DataProvider([DataSets::class, 'userScenarios'])]
public function testUser($data): void { ... }
```

**Замыкание непосредственно в атрибуте (PHP 8.5+):**
```php
#[DataProvider(fn() => [
    [1, 2, 3],
    [5, 5, 10],
])]
public function testAddition(int $a, int $b, int $expected): void { ... }
```

**Вызываемый объект:**
```php
#[DataProvider(new UserDataProvider())]
public function testUser($data): void { ... }
```

Вызываемые объекты особенно полезны для разделения логики загрузки данных. Например, загрузка тестов из JSON/CSV файлов в выделенный класс позволяет сохранить код тестов чистым.

### Метки датасетов

Метки задаются через строковые ключи массива:
в
```php
public function userDataProvider(): array
{
    return [
        'valid email' => ['test@example.com', true],
        'invalid format' => ['not-an-email', false],
        'empty string' => ['', false],
    ];
}
```

<signature h="2" name="#[\Testo\Data\DataZip(DataProviderAttribute ...$providers)]">
<short>Объединяет провайдеры попарно по индексу.</short>
<description>
Первый элемент из первого провайдера соединяется с первым из второго, второй со вторым, и так далее. Аргументы из всех провайдеров объединяются в один вызов теста.
</description>
<param name="$providers">Провайдеры данных для попарного объединения.</param>
<example>
```php
#[DataZip(
    new DataProvider('credentials'),
    new DataProvider('expectedPermissions'),
)]
public function testUserPermissions(string $login, string $password, array $permissions): void
{
    $user = $this->auth->login($login, $password);
    Assert::same($permissions, $user->getPermissions());
}

// credentials: [['admin', 'secret'], ['guest', '1234']]
// expectedPermissions: [[['read', 'write', 'delete']], [['read']]]
//
// Тест запустится 2 раза:
// 1. admin/secret → ['read', 'write', 'delete']
// 2. guest/1234 → ['read']
```
</example>
</signature>

### Провайдеры разной длины

Если провайдеры имеют разную длину, количество датасетов определяется самым коротким провайдером:

```php
#[DataZip(
    new DataProvider('inputs'),   // 3 элемента
    new DataProvider('outputs'),  // 2 элемента
)]
public function testTransform(string $input, string $output): void { ... }

// inputs:  [['a'], ['b'], ['c']]
// outputs: [['x'], ['y']]
//
// Запустится 2 раза (по длине outputs):
// 1. 'a', 'x'
// 2. 'b', 'y'
// Третий элемент inputs ('c') игнорируется
```

::: tip Ключи в отчётах
Метки датасетов соединяются через `|`. Если датасеты называются `admin` и `full-access`, в отчёте будет `admin|full-access`.
:::

<signature h="2" name="#[\Testo\Data\DataCross(DataProviderAttribute ...$providers)]">
<short>Создаёт все возможные комбинации из провайдеров (декартово произведение).</short>
<param name="$providers">Провайдеры данных для комбинирования.</param>
<example>
```php
#[DataCross(
    new DataProvider('browsers'),
    new DataProvider('screenSizes'),
)]
public function testResponsiveLayout(string $browser, int $width, int $height): void
{
    $this->driver->setBrowser($browser);
    $this->driver->setViewport($width, $height);

    Assert::true($this->page->isLayoutCorrect());
}

// browsers: [['chrome'], ['firefox'], ['safari']]
// screenSizes: [[1920, 1080], [768, 1024], [375, 667]]
//
// Запустится 9 раз — каждый браузер с каждым разрешением:
// chrome × 1920×1080, chrome × 768×1024, chrome × 375×667,
// firefox × 1920×1080, ...
```
</example>
</signature>

::: warning Следите за количеством комбинаций
Число тестов растёт мультипликативно. Три провайдера по 5 элементов — это уже 125 тестов. Используйте <attr>\Testo\Data\DataCross</attr> осознанно.
:::

::: tip Ключи в отчётах
Метки соединяются через `×`. Датасеты `chrome` и `mobile` дадут ключ `chrome×mobile`.
:::

<signature h="2" name="#[\Testo\Data\DataUnion(DataProviderAttribute ...$providers)]">
<short>Объединяет данные из нескольких провайдеров в один последовательный набор.</short>
<description>
Для объединения данных обычно достаточно перечислить несколько <attr>\Testo\Data\DataProvider</attr> или <attr>\Testo\Data\DataSet</attr> над методом. <attr>\Testo\Data\DataUnion</attr> нужен, когда объединение должно произойти внутри другого атрибута — например, внутри <attr>\Testo\Data\DataCross</attr> или <attr>\Testo\Data\DataZip</attr>.
</description>
<param name="$providers">Провайдеры данных для объединения в один набор.</param>
<example>
```php
#[DataCross(
    new DataUnion(
        new DataProvider('legacyFormats'),
        new DataProvider('modernFormats'),
    ),
    new DataProvider('compressionLevels'),
)]
public function testExport(string $format, int $compression): void
{
    // Все форматы (legacy + modern) скрещиваются с каждым уровнем сжатия
}
```
</example>
</signature>

## Комбинирование провайдеров

Внутри <attr>\Testo\Data\DataZip</attr>, <attr>\Testo\Data\DataCross</attr> и <attr>\Testo\Data\DataUnion</attr> можно использовать любые провайдеры данных — <attr>\Testo\Data\DataProvider</attr>, <attr>\Testo\Data\DataSet</attr>, а также вкладывать их друг в друга.

### Смешивание типов

Удобно, когда часть параметров фиксирована, а часть приходит из провайдера:

```php
#[DataCross(
    new DataSet(['mysql'], 'mysql'),
    new DataSet(['pgsql'], 'pgsql'),
    new DataProvider('migrationScenarios'),
)]
public function testMigration(string $driver, array $scenario): void { ... }
```

Или компактнее через <attr>\Testo\Data\DataProvider</attr> для драйверов:

```php
#[DataCross(
    new DataProvider('databaseDrivers'),
    new DataProvider('migrationScenarios'),
)]
public function testMigration(string $driver, array $scenario): void { ... }
```

### Вложенные комбинации

Для сложных сценариев провайдеры можно вкладывать:

```php
#[DataZip(
    new DataCross(
        new DataProvider('users'),
        new DataProvider('roles'),
    ),
    new DataProvider('expectedResults'),
)]
public function testAccessControl(string $user, string $role, bool $expected): void
{
    $this->actAs($user)->withRole($role);
    Assert::same($expected, $this->canAccess('/admin'));
}

// users × roles даёт все комбинации пользователь-роль,
// затем они попарно соединяются с ожидаемыми результатами
```