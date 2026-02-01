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
