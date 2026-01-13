# Модуль Sample

Модуль Sample предоставляет атрибуты для параметризованного тестирования — запуска одной и той же логики теста с разными входными данными. Это позволяет тестировать функции в различных сценариях без написания повторяющегося кода тестов.

В настоящее время включает:
- **DataProvider** — для динамических, сложных наборов данных
- **[TestInline](./inline-tests)** — для простых, статических тестов прямо на методе

## Провайдер данных

`DataProvider` позволяет указать метод или вызываемый объект, который возвращает тестовые данные. Каждый набор данных от провайдера запускается как отдельный тест:

```php
use Testo\Attribute\Test;
use Testo\Sample\DataProvider;

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

### Метки и описания

Каждый набор данных может быть помечен строковым ключом. Эти метки отображаются в отчетах о тестах, упрощая определение того, какой сценарий не прошел:

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

Используйте `DataProvider`, когда:
- У вас много тестов (10+)
- Данные генерируются динамически или загружаются из внешних файлов
- Тестам нужны метки или описания для ясности
- Требуется сложная логика настройки для тестовых данных

**Примечание:** `DataProvider` является дополнением к обычным тестам (методам, помеченным `#[Test]`). Он предоставляет данные существующим тестовым методам.
