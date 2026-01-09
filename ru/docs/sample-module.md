# Модуль Sample

Модуль Sample предоставляет атрибуты для параметризованного тестирования — запуска одной и той же логики теста с разными входными данными. Это позволяет тестировать функции в различных сценариях без написания повторяющегося кода тестов.

В настоящее время включает:
- **DataProvider** — для динамических, сложных наборов данных
- **TestInline** — для простых, статических тестовых случаев прямо на методе

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

Вызываемые объекты особенно полезны для разделения логики загрузки данных. Например, загрузка тестовых случаев из JSON/CSV файлов в выделенный класс позволяет сохранить код тестов чистым.

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
- У вас много тестовых случаев (10+)
- Данные генерируются динамически или загружаются из внешних файлов
- Тестовым случаям нужны метки или описания для ясности
- Требуется сложная логика настройки для тестовых данных

**Примечание:** `DataProvider` является дополнением к обычным тестам (методам, помеченным `#[Test]`). Он предоставляет данные существующим тестовым методам.

## Встроенные тесты

`TestInline` использует другой подход — он объявляет тестовые случаи как атрибуты непосредственно на тестируемом методе, без необходимости отдельного тестового класса.

Это может быть полезно для простых чистых функций, где отдельный тестовый файл был бы избыточным. Также хорошо работает для тестирования приватных вспомогательных методов — вы можете тестировать их напрямую без изменения видимости. При прототипировании `TestInline` дает вам немедленную валидацию без переключения контекста на тестовый файл.

### Основы

Сигнатура атрибута:
```php
TestInline(array $arguments, mixed $result = null)
```

Объявите тестовые случаи прямо на методе:

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

Каждый атрибут `TestInline` запускает метод с заданными аргументами и проверяет результат. Просто как это.

`TestInline` работает лучше всего с 2-10 статическими тестовыми случаями, где ожидаемое поведение очевидно из пар входных/выходных данных. Для больших наборов тестов или случаев, требующих пояснений, рассмотрите написание отдельного теста в директории `tests/` с использованием `DataProvider`.

### Тестирование приватных методов

Здесь `TestInline` действительно показывает свою ценность. Нужно протестировать приватный вспомогательный метод? Просто добавьте атрибут:

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

Метод остается приватным — вам не нужно раскрывать его или писать код рефлексии самостоятельно. Testo справляется с этим.

### Именованные аргументы

Используйте именованные аргументы для лучшей читаемости:

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

### Пользовательские утверждения с замыканиями

*Доступно в PHP 8.5+ (замыкания в атрибутах)*

Для более сложных проверок передайте замыкание в качестве второго параметра:

```php
use Testo\Assert;

#[TestInline([10, 3], fn($r) => Assert::greaterThan(3, $r))]
public function divide(int $a, int $b): float
{
    return $a / $b;
}
```

Замыкание получает фактический результат и может выполнять любые утверждения:

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
