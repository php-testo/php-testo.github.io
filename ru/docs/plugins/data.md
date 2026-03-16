# Провайдеры данных

Провайдеры данных позволяют запускать один тест с разными наборами входных данных. Каждый набор — отдельный запуск теста.

## DataSet

Самый простой способ — указать данные прямо над методом:

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

Каждый `DataSet` — массив аргументов, которые передаются в тестовый метод. Тест запустится три раза с разными значениями.

### Метки датасетов

Второй аргумент — опциональная метка. Отображается в отчётах и помогает понять, какой именно сценарий упал:

```php
#[DataSet([1, 1, 2], 'positive numbers')]
#[DataSet([-1, -1, -2], 'negative numbers')]
#[DataSet([0, 0, 0], 'zeros')]
public function testSum(int $a, int $b, int $expected): void { ... }
```

## DataProvider

Для большого количества данных или динамической генерации используйте `DataProvider`. Он принимает метод или вызываемый объект, который возвращает тестовые данные:

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
    // ... 50 more cases
}
```

### Гибкие источники провайдеров

`DataProvider` принимает различные типы вызываемых объектов:

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

## DataZip

Объединяет несколько провайдеров попарно. Первый элемент из первого провайдера соединяется с первым элементом из второго, второй со вторым, и так далее.

Типичный сценарий — тестирование связанных данных, где каждая пара образует осмысленный тест-кейс:

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

Аргументы из всех провайдеров объединяются в один вызов теста. В примере выше `credentials` даёт два аргумента (`$login`, `$password`), а `expectedPermissions` — один (`$permissions`).

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

## DataCross

Создаёт все возможные комбинации значений из провайдеров (декартово произведение). Полезно для тестирования независимых параметров, которые могут сочетаться произвольным образом.

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

::: warning Следите за количеством комбинаций
Число тестов растёт мультипликативно. Три провайдера по 5 элементов — это уже 125 тестов. Используйте `DataCross` осознанно.
:::

::: tip Ключи в отчётах
Метки соединяются через `×`. Датасеты `chrome` и `mobile` дадут ключ `chrome×mobile`.
:::

## DataUnion

Для объединения данных из нескольких источников обычно достаточно перечислить атрибуты над методом:

```php
#[DataProvider('adminUsers')]
#[DataProvider('regularUsers')]
#[DataSet(['guest'], 'guest')]
public function testUserCanLogin(string $username): void
{
    // Запустится для всех: adminUsers, затем regularUsers, затем guest
}
```

`DataUnion` нужен, когда объединение должно произойти внутри другого атрибута — например, внутри `DataCross` или `DataZip`:

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

Без `DataUnion` пришлось бы либо создавать отдельный провайдер, объединяющий форматы, либо дублировать `DataCross` для каждого источника форматов.

## Комбинирование провайдеров

Внутри `DataZip`, `DataCross` и `DataUnion` можно использовать любые провайдеры данных — `DataProvider`, `DataSet`, а также вкладывать их друг в друга.

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

Или компактнее через `DataProvider` для драйверов:

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