# Жизненный цикл

Атрибуты жизненного цикла определяют методы setup и teardown, которые автоматически выполняются в определённые моменты во время запуска тестов.

## Инстанциирование класса

По умолчанию Testo создаёт экземпляр тестового класса **один раз на тестовый класс**, а не на каждый тест. Это значит:

- Свойства экземпляра сохраняются между тестами в одном классе
- Конструктор выполняется лениво — непосредственно перед первым вызовом нестатического метода
- Если все методы статические, класс не инстанциируется

```php
final class ServiceTest
{
    private Client $client;
    private int $counter = 0;

    public function __construct()
    {
        // Выполняется один раз — естественное место для дорогой инициализации
        $this->client = new Client();
    }

    #[Test]
    public function firstTest(): void
    {
        $this->counter++;
        // $this->counter теперь 1
    }

    #[Test]
    public function secondTest(): void
    {
        $this->counter++;
        // $this->counter теперь 2 — состояние сохраняется между тестами
        // $this->client — всё тот же экземпляр
    }
}
```

Для контроля состояния между тестами используйте атрибуты жизненного цикла, описанные ниже.

## Атрибуты

| Атрибут | Когда выполняется | Как часто |
|---------|-------------------|-----------|
| `#[BeforeEach]` | Перед каждым тестовым методом | Один раз на тест |
| `#[AfterEach]` | После каждого тестового метода | Один раз на тест |
| `#[BeforeAll]` | Перед всеми тестами в классе | Один раз на тестовый класс |
| `#[AfterAll]` | После всех тестов в классе | Один раз на тестовый класс |

## Порядок выполнения

```
BeforeAll (один раз)
├── BeforeEach
│   └── Тест 1
│   └── AfterEach
├── BeforeEach
│   └── Тест 2
│   └── AfterEach
└── ...
AfterAll (один раз)
```

## Базовый пример

```php
use Testo\Attribute\Test;
use Testo\Attribute\BeforeEach;
use Testo\Attribute\AfterEach;
use Testo\Attribute\BeforeAll;
use Testo\Attribute\AfterAll;

final class DatabaseTest
{
    private static Connection $connection;
    private Transaction $transaction;

    #[BeforeAll]
    public static function connect(): void
    {
        self::$connection = new Connection();
    }

    #[AfterAll]
    public static function disconnect(): void
    {
        self::$connection->close();
    }

    #[BeforeEach]
    public function beginTransaction(): void
    {
        $this->transaction = self::$connection->beginTransaction();
    }

    #[AfterEach]
    public function rollback(): void
    {
        $this->transaction->rollback();
    }

    #[Test]
    public function insertsRecord(): void
    {
        self::$connection->insert('users', ['name' => 'John']);
        Assert::same(1, self::$connection->count('users'));
    }
}
```

## Приоритет

Когда у вас несколько методов с одинаковым атрибутом жизненного цикла, используйте `priority` для управления порядком выполнения:

```php
#[BeforeEach(priority: 100)]
public function initializeConfig(): void
{
    // Выполняется первым (наивысший приоритет)
}

#[BeforeEach(priority: 50)]
public function initializeLogger(): void
{
    // Выполняется вторым
}

#[BeforeEach] // priority: 0 (по умолчанию)
public function initializeService(): void
{
    // Выполняется последним
}
```

Большие значения выполняются первыми. Приоритет по умолчанию — `0`.

## Обработка ошибок

- Исключение в `BeforeEach` — тест прерывается
- Исключение в `AfterEach` — перехватывается, но результат теста сохраняется
- Исключение в `BeforeAll` — все тесты в классе прерываются
- Исключение в `AfterAll` — перехватывается после завершения всех тестов
