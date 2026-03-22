---
outline: [2, 3]
---

# Assert

Плагин предоставляет функционал проверок в тестах через фасады <class>\Testo\Assert</class> и <class>\Testo\Expect</class>.

<plugin-info name="Assert" class="\Testo\Assert\AssertPlugin" included="\Testo\Application\Config\Plugin\SuitePlugins" />

## Assert vs Expect

Разница между фасадами — в том, **когда** происходит проверка:

- <class>\Testo\Assert</class> — утверждения. Проверяются здесь и сейчас, на той же строке: «проверил и забыл».
- <class>\Testo\Expect</class> — ожидания. Регистрируются во время теста, а проверяются уже после его завершения: «запомнил, в конце проверил».

Такое разделение убирает диссонанс в именовании. Когда вы видите в тесте <func>\Testo\Expect::exception()</func>, сразу понятно, что проверка произойдёт позже — после того, как тест завершится. А <func>\Testo\Assert::same()</func> сработает прямо на этой строке.

## Базовые утверждения

::: warning
Обратите внимание, что в Testo выбран более интуитивный прямой порядок аргументов: сначала идёт `$actual` (проверяемое значение), затем `$expected` (ожидаемое значение). Это отличается от устаревшего подхода xUnit.
:::

Для большинства проверок достаточно этих методов:

<signature compact h="4" name="\Testo\Assert::same(mixed $actual, mixed $expected, string $message = ''): void">
<short>Строгое сравнение двух значений (`===`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::notSame(mixed $actual, mixed $expected, string $message = ''): void">
<short>Проверяет, что два значения не идентичны (`!==`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::equals(mixed $actual, mixed $expected, string $message = ''): void">
<short>Нестрогое сравнение двух значений (`==`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::notEquals(mixed $actual, mixed $expected, string $message = ''): void">
<short>Проверяет, что два значения не равны (`!=`).</short>
</signature>

<signature compact h="4" name="\Testo\Assert::true(mixed $actual, string $message = ''): void">
<short>Проверяет, что значение строго равно `true`.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::false(mixed $actual, string $message = ''): void">
<short>Проверяет, что значение строго равно `false`.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::null(mixed $actual, string $message = ''): void">
<short>Проверяет, что значение равно `null`.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::contains(iterable $haystack, mixed $needle, string $message = ''): void">
<short>Проверяет, что коллекция содержит указанное значение.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::count(Countable|iterable $actual, int $expected, string $message = ''): void">
<short>Проверяет количество элементов в коллекции.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::instanceOf(mixed $actual, string $expected, string $message = ''): ObjectType">
<short>Проверяет, что объект является экземпляром указанного класса. Сокращение для `Assert::object($obj)->instanceOf($class)`.</short>
</signature>

<signature compact h="3" name="\Testo\Assert::blank(mixed $actual, string $message = ''): void">
<short>Проверяет отсутствие данных.</short>
<description>В отличие от PHP-функции `empty()`, не считает `false`, `0` и `"0"` пустыми значениями, потому что они несут в себе реальные данные. Пустыми считаются: `null`, пустая строка `''`, пустой массив `[]` и `Countable`-объекты с нулевым количеством элементов.</description>
</signature>

<signature compact h="3" name="\Testo\Assert::fail(string $message = ''): never">
<short>Принудительно фейлит тест.</short>
<description>Полезен для строк кода, до которых выполнение не должно доходить.</description>
<param name="$message">Причина провала теста.</param>
<example>
```php
foreach ($users as $user) {
    if ($user->isAdmin()) {
        Assert::same($user->role, 'admin');
        return;
    }
}
Assert::fail('В списке должен быть хотя бы один администратор');
```
</example>
</signature>

### Пользовательские сообщения

Большинство методов принимают необязательный параметр `$message`. Это произвольное описание того, что именно проверяется — оно отобразится в отчёте, если утверждение не пройдёт. Работает как в базовых утверждениях (<func>\Testo\Assert::same()</func>, <func>\Testo\Assert::blank()</func>), так и в цепочках проверок:

```php
Assert::same($user->role, 'admin', 'У пользователя должна быть роль admin');
```

## Цепочки проверок

Вместо десятков отдельных методов вроде `assertStringContains()`, `assertArrayHasKey()` и ещё двадцати с префиксом `string*`, Testo группирует проверки в типизированные цепочки.

Идея простая: метод в начале цепочки проверяет, что значение имеет нужный тип, а затем открывает доступ к специфичным для этого типа проверкам. Методы можно вызывать друг за другом:

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
<short>Проверяет, что значение является строкой, и открывает строковые проверки.</short>
<example>
```php
Assert::string($html)
    ->contains('<div>')
    ->notContains('<script>');
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\StringType::contains(string $needle, string $message = ''): static">
<short>Проверяет, что строка содержит указанную подстроку.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\StringType::notContains(string $needle, string $message = ''): static">
<short>Проверяет, что строка не содержит указанную подстроку.</short>
</signature>

### Числовые типы

Для числовых значений есть три точки входа. Они отличаются только проверкой типа на входе, а набор методов в цепочке у всех одинаковый:

<signature compact h="4" name="\Testo\Assert::int(mixed $actual): IntType">
<short>Проверяет, что значение является целым числом, и открывает числовые проверки.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::float(mixed $actual): FloatType">
<short>Проверяет, что значение является числом с плавающей точкой.</short>
</signature>

<signature compact h="4" name="\Testo\Assert::numeric(mixed $actual): NumericType">
<short>Проверяет, что значение числовое (`int`, `float` или числовая строка).</short>
</signature>

Общие методы в цепочке:

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::greaterThan(int|float $min, string $message = ''): static">
<short>Проверяет, что значение строго больше указанного.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::greaterThanOrEqual(int|float $min, string $message = ''): static">
<short>Проверяет, что значение больше или равно указанному.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::lessThan(int|float $max, string $message = ''): static">
<short>Проверяет, что значение строго меньше указанного.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\NumericType::lessThanOrEqual(int|float $max, string $message = ''): static">
<short>Проверяет, что значение меньше или равно указанному.</short>
</signature>

```php
Assert::int(15)->greaterThan(10);
Assert::float(3.14)->lessThan(4.0);
Assert::numeric('42.5')->greaterThanOrEqual(0);
```

<signature h="3" name="\Testo\Assert::iterable(mixed $actual): IterableType">
<short>Проверяет, что значение является iterable, и открывает проверки для коллекций.</short>
<description>
Работает с массивами и объектами, реализующими `Traversable`.

::: warning
Если передать в цепочку генератор, он будет потрачен — генераторы в PHP можно итерировать только один раз.
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
<short>Проверяет, что коллекция содержит хотя бы один элемент.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::contains(mixed $needle, string $message = ''): static">
<short>Проверяет, что коллекция содержит указанное значение.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::sameSizeAs(iterable $expected, string $message = ''): static">
<short>Проверяет, что количество элементов совпадает с другой коллекцией.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::hasCount(int $expected): static">
<short>Проверяет, что коллекция содержит ровно указанное количество элементов.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::allOf(string $type, string $message = ''): static">
<short>Проверяет, что все элементы имеют указанный тип (`get_debug_type()`: `'int'`, `'string'`, имя класса).</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\IterableType::every(callable $callback, string $message = ''): static">
<short>Проверяет, что каждый элемент удовлетворяет переданному предикату.</short>
</signature>

<signature h="3" name="\Testo\Assert::array(mixed $actual): ArrayType">
<short>Проверяет, что значение является массивом, и открывает проверки для массивов.</short>
<description>Наследует все методы <func>\Testo\Assert::iterable()</func> и добавляет проверки, специфичные для массивов.</description>
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
<short>Проверяет, что в массиве есть все перечисленные ключи.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ArrayType::doesNotHaveKeys(int|string ...$keys): static">
<short>Проверяет, что в массиве нет ни одного из перечисленных ключей.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ArrayType::isList(string $message = ''): static">
<short>Проверяет, что массив является списком (последовательные целочисленные ключи от 0).</short>
</signature>

<signature h="3" name="\Testo\Assert::object(mixed $actual): ObjectType">
<short>Проверяет, что значение является объектом, и открывает проверки для объектов.</short>
<example>
```php
Assert::object($event)
    ->instanceOf(OrderCreated::class)
    ->hasProperty('orderId');
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ObjectType::instanceOf(string $expected, string $message = ''): static">
<short>Проверяет, что объект является экземпляром указанного класса или интерфейса.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Builtin\ObjectType::hasProperty(string $propertyName, string $message = ''): static">
<short>Проверяет, что объект имеет указанное свойство.</short>
</signature>

<signature h="3" name="\Testo\Assert::json(string $actual): JsonAbstract">
<short>Проверяет, что строка содержит валидный JSON, и открывает проверки структуры.</short>
</signature>

На входе можно определить тип JSON-значения, после чего доступны специфичные для типа проверки:

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isObject(): JsonObject">
<short>Проверяет, что JSON представляет объект.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isArray(): JsonArray">
<short>Проверяет, что JSON представляет массив.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isPrimitive(): JsonCommon">
<short>Проверяет, что JSON представляет примитивное значение (строка, число, boolean, null).</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::isStructure(): JsonStructure">
<short>Проверяет, что JSON представляет структуру (объект или массив).</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::maxDepth(int $expected): static">
<short>Проверяет, что глубина вложенности JSON не превышает указанную.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonAbstract::empty(): JsonCommon">
<short>Проверяет, что JSON-объект или массив пуст.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonStructure::count(int $count, string $message = ''): static">
<short>Проверяет количество элементов в JSON-массиве или объекте.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonObject::hasKeys(array|string $keys, string $message = ''): JsonObject">
<short>Проверяет, что JSON-объект содержит указанные ключи.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonStructure::assertPath(string $path, callable $callback): static">
<short>Проверяет вложенное значение по указанному пути.</short>
<description>Callback получает `JsonAbstract` для значения по указанному пути, что позволяет строить вложенные цепочки проверок.</description>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonCommon::matchesType(string $type): static">
<short>Валидирует структуру JSON по Psalm-типу.</short>
<description>Принимает расширенную аннотацию типа Psalm — например, `'array{foo: bool, bar?: non-empty-string}'` или `'list<array{id: positive-int}>'`.</description>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonCommon::matchesSchema(string $schema): static">
<short>Валидирует структуру JSON по JSON Schema.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\Json\JsonCommon::decode(): mixed">
<short>Возвращает декодированное значение JSON.</short>
</signature>

```php
// Определение типа и проверка структуры
Assert::json($string)->isObject()->hasKeys('id', 'name');
Assert::json($string)->isArray()->count(5);

// Проверка вложенных значений по пути
Assert::json($response->body())
    ->isObject()
    ->assertPath('data.users', fn(JsonAbstract $json) =>
        $json->isArray()->count(10)
    );

// Валидация по Psalm-типу
Assert::json('{"foo": true, "bar": "test"}')
    ->matchesType('array{foo: bool, bar?: non-empty-string}');

// Валидация по JSON Schema
Assert::json($string)->matchesSchema($schemaJson);

// Получение декодированного значения
$data = Assert::json($string)->isObject()->decode();
```

## Ожидания (Expect)

В отличие от утверждений, ожидания регистрируются во время выполнения теста, а проверяются **после его завершения**. Это удобно для ситуаций, когда результат нужно оценить по побочному эффекту — например, по выброшенному исключению или по состоянию памяти.

<signature h="3" name="\Testo\Expect::exception(string|\Throwable $classOrObject): ExpectedException">
<short>Ожидает, что тест выбросит указанное исключение.</short>
<description>Если тест завершится без исключения или с другим исключением, он будет считаться проваленным. Вместо имени класса можно передать конкретный объект исключения.</description>
<param name="$classOrObject">Класс, интерфейс или объект ожидаемого исключения.</param>
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

С помощью цепочки методов можно уточнить, какое именно исключение ожидается:

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::fromMethod(string $class, string $method): self">
<short>Проверяет, что указанный метод присутствует в стеке вызовов исключения.</short>
<description>
Метод можно вызывать несколько раз, добавляя несколько мест для проверки.

::: info
Стек вызовов в исключении заполняется в момент его создания, а не выброса. Таким образом, мы проверяем именно место создания, а не проброс через `throw`.
:::
</description>
<example>
```php
// Убеждаемся, что исключение возникло именно в валидации,
// а не было проброшено откуда-то ещё
Expect::exception(ValidationException::class)
    ->fromMethod(UserValidator::class, 'validate');
```
</example>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withMessage(string $message): self">
<short>Проверяет точное сообщение исключения.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withMessagePattern(string $pattern): self">
<short>Проверяет, что сообщение соответствует регулярному выражению.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withMessageContaining(string $substring): self">
<short>Проверяет, что сообщение содержит указанную подстроку.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withCode(int|array $code): self">
<short>Проверяет код исключения. Можно передать одно значение или массив допустимых кодов.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withoutPrevious(): self">
<short>Проверяет, что у исключения нет предыдущего исключения.</short>
</signature>

<signature compact h="4" name="\Testo\Assert\Api\ExpectedException::withPrevious(string|\Throwable $classOrObject, ?callable $assertion = null): self">
<short>Проверяет наличие предыдущего исключения указанного типа.</short>
<param name="$assertion">Опциональный `callback`, получающий `ExpectedException` по предыдущей ошибке — это позволяет строить вложенные проверки с тем же API: проверить сообщение, код или даже его собственный `withPrevious()`.</param>
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

Все методы цепочки можно комбинировать в произвольном порядке, выстраивая точное описание ожидаемого исключения:

```php
Expect::exception(PaymentException::class)
    ->fromMethod(PaymentGateway::class, 'charge')
    ->withMessageContaining('insufficient funds')
    ->withCode([402, 422])
    ->withPrevious(GatewayException::class);
```

<signature h="3" name="\Testo\Expect::notLeaks(object ...$objects): NotLeaks">
<short>Ожидает, что объекты будут освобождены из памяти после завершения теста.</short>
<description>Полезно, когда нужно убедиться, что сервис корректно освобождает ресурсы.</description>
<example>
```php
#[Test]
public function serviceReleasesResources(): void
{
    $connection = new Connection();
    $service = new Service($connection);

    Expect::notLeaks($connection, $service);

    $service->process();
    // После теста Testo проверит, что $connection и $service больше не удерживаются в памяти
}
```
</example>
</signature>

<signature h="3" name="\Testo\Expect::leaks(object ...$objects): Leaks">
<short>Ожидает, что объекты останутся в памяти после завершения теста.</short>
<description>
Полезно, чтобы убедиться, что кеш или другой механизм действительно удерживает объекты.

::: warning
PHP может не собрать объекты, если тест завершается выбросом исключения. Также существуют известные проблемы со сборкой мусора на macOS.
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
    // После теста Testo проверит, что $entity всё ещё удерживается в памяти (кешем)
}
```
</example>
</signature>
