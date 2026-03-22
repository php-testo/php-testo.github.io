---
outline: [2, 3]
---

# Жизненный цикл

Атрибуты жизненного цикла позволяют выполнять код до и после тестов — для подготовки окружения, очистки состояния и управления ресурсами.

<plugin-info name="Lifecycle" class="\Testo\Lifecycle\LifecyclePlugin" included="\Testo\Application\Config\Plugin\SuitePlugins" />

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

<signature h="3" compact name="#[\Testo\Lifecycle\BeforeTest(int $priority = 0)]">
<short>Выполняет метод перед каждым тестом в классе.</short>
<param name="$priority">Приоритет выполнения. Чем больше значение, тем раньше выполняется метод.</param>
</signature>

<signature h="3" compact name="#[\Testo\Lifecycle\AfterTest(int $priority = 0)]">
<short>Выполняет метод после каждого теста в классе.</short>
<param name="$priority">Приоритет выполнения. Чем больше значение, тем раньше выполняется метод.</param>
</signature>

<signature h="3" compact name="#[\Testo\Lifecycle\BeforeClass(int $priority = 0)]">
<short>Выполняет метод один раз перед всеми тестами в классе. Подходит для дорогой инициализации.</short>
<param name="$priority">Приоритет выполнения. Чем больше значение, тем раньше выполняется метод.</param>
</signature>

<signature h="3" compact name="#[\Testo\Lifecycle\AfterClass(int $priority = 0)]">
<short>Выполняет метод один раз после всех тестов в классе. Подходит для очистки ресурсов.</short>
<param name="$priority">Приоритет выполнения. Чем больше значение, тем раньше выполняется метод.</param>
</signature>

## Порядок выполнения

```
BeforeClass (один раз)
├── BeforeTest
│   └── Тест 1
│   └── AfterTest
├── BeforeTest
│   └── Тест 2
│   └── AfterTest
└── ...
AfterClass (один раз)
```

## Базовый пример

```php
final class DatabaseTest
{
    private static Connection $connection;
    private Transaction $transaction;

    #[BeforeClass]
    public static function connect(): void
    {
        self::$connection = new Connection();
    }

    #[AfterClass]
    public static function disconnect(): void
    {
        self::$connection->close();
    }

    #[BeforeTest]
    public function beginTransaction(): void
    {
        $this->transaction = self::$connection->beginTransaction();
    }

    #[AfterTest]
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
#[BeforeTest(priority: 100)]
public function initializeConfig(): void
{
    // Выполняется первым (наивысший приоритет)
}

#[BeforeTest(priority: 50)]
public function initializeLogger(): void
{
    // Выполняется вторым
}

#[BeforeTest] // priority: 0 (по умолчанию)
public function initializeService(): void
{
    // Выполняется последним
}
```

Большие значения выполняются первыми. Приоритет по умолчанию — `0`.
