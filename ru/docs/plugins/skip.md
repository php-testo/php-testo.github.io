---
outline: [2, 3]
---

# Пропуск тестов

Плагин предоставляет атрибут <attr>\Testo\Skip</attr>, который помечает тест пропущенным. Тест попадает в отчёт со статусом <enum>\Testo\Core\Value\Status::Skipped</enum> и учитывается в итогах, а необязательная причина объясняет, почему он пропущен. Пропускайте тест, когда запускать его пока нельзя, а удалять рано: он воспроизводит ещё не починенный баг, сломан незавершённым рефакторингом или написан раньше фичи, которую проверяет.

<plugin-info class="\Testo\Skip\SkipPlugin" name="Skip" included="\Testo\Application\Config\Plugin\SuitePlugins" />

<signature h="2" name="#[\Testo\Skip(string $reason = '')]">
<short>Помечает тест, класс тестов или тестовую функцию как пропущенные, не запуская их.</short>
<description>
Можно повесить на метод, свободную функцию или класс — на классе пропускаются все тесты тест-кейса. Атрибут наследуется от родительских классов, трейтов и переопределённых методов. Если `#[Skip]` стоит и на методе, и на классе, действует атрибут метода, и его причина заменяет причину класса. Это верно и для пустой причины: если на методе стоит `#[Skip]` без аргумента, тест пропускается без причины, а причина класса не подставляется. Повесить атрибут на один элемент дважды нельзя.

Атрибут действует только на обычные тесты: на не-тестовом методе он ничего не делает, а <attr>\Testo\Bench</attr> и <attr>\Testo\Inline\TestInline</attr> выполняются как обычно. По смыслу близок к `@Disabled` в JUnit и `#[ignore]` в Rust.
</description>
<param name="$reason">Почему тест пропущен. По умолчанию причины нет. Заданная причина дописывается в сообщение результата.</param>
<example>
Пропустить один тест:

```php
use Testo\Skip;
use Testo\Test;

final class OrderTest
{
    #[Test]
    #[Skip('broken by the pricing rework')]
    public function calculatesTotal(): void
    {
        // никогда не выполняется — в отчёте Skipped с причиной выше
    }

    #[Test]
    public function createsOrder(): void { /* выполняется как обычно */ }
}
```
</example>
<example>
На классе — пропускаются все тесты тест-кейса, а метод может указать свою причину:

```php
#[Skip('the billing sandbox is down')]
final class BillingTest
{
    #[Test]
    public function chargesCard(): void { /* ... */ }

    #[Test]
    #[Skip('flaky since the gateway upgrade')] // эта причина заменяет причину класса
    public function refundsCard(): void { /* ... */ }
}
```
</example>
</signature>

## Что не запускается

Решение о пропуске принимается ещё до старта теста: тест сразу получает статус <enum>\Testo\Core\Value\Status::Skipped</enum>, и на этом всё. Поэтому ничего из того, что обычно готовит, оборачивает или повторяет тело теста, не срабатывает:

- Хуки <attr>\Testo\Lifecycle\BeforeTest</attr> и <attr>\Testo\Lifecycle\AfterTest</attr> не вызываются.
- Провайдеры данных, например <attr>\Testo\Data\DataProvider</attr>, тоже не вызываются. Параметризованный тест даёт в отчёте **одну** запись <enum>\Testo\Core\Value\Status::Skipped</enum>, а не по записи на каждый набор данных.
- <attr>\Testo\Retry</attr> и <attr>\Testo\Repeat</attr> не запускают повторы.
- <attr>\Testo\Fiber\RunInFiber</attr> не создаёт файбер.
- Покрытие кода не собирается.

```php
final class OrderTest
{
    #[BeforeTest]
    public function startTransaction(): void
    {
        // для calculatesTotal() не вызывается — готовить нечего
    }

    #[Test]
    #[Skip('broken by the pricing rework')]
    public function calculatesTotal(): void { /* ... */ }

    #[Test]
    public function createsOrder(): void
    {
        // для этого теста startTransaction() выполняется как обычно
    }
}
```

С хуками уровня класса всё иначе: они привязаны к тест-кейсу, а не к отдельному тесту. <attr>\Testo\Lifecycle\BeforeClass</attr> и <attr>\Testo\Lifecycle\AfterClass</attr> выполняются, если в тест-кейсе остался хотя бы один непропущенный тест. Если же пропущены все тесты, эти хуки не вызываются, а экземпляр класса даже не создаётся.

## Пропуск в отчётах

В результат теста попадает сообщение из полного имени теста — `Класс::метод` или полное имя функции для функционального теста — и маркера `is skipped via #[Skip]`; если указана причина, она дописывается в конец:

```
Tests\Unit\OrderTest::calculatesTotal is skipped via #[Skip] ==> broken by the pricing rework
```

- Отчёты JUnit ([`--log-junit`](../guide/cli-reference.md#log-junit)), TeamCity ([`--teamcity`](../guide/cli-reference.md#teamcity)) и HTML показывают это сообщение.
- Терминал печатает строку пропущенного теста без этого сообщения.
- Компактный отчёт [`--json`](../guide/cli-reference.md#json) учитывает тест в итогах.

Прогон, в котором пропущены все тесты, считается успешным: <enum>\Testo\Core\Value\Status::Skipped</enum> не относится ни к падениям, ни к ошибкам.

## Пропуск во время выполнения

Иногда решение о пропуске нельзя принять заранее: тест должен сначала осмотреться и пропустить себя по тому, что обнаружит — нет расширения, недоступен сервис, фикстура оказалась пустой. Для этого бросьте <class>\Testo\Core\Exception\SkipTest</class> из тела теста. Тест попадёт в отчёт со статусом <enum>\Testo\Core\Value\Status::Skipped</enum> и сообщением исключения.

```php
use Testo\Core\Exception\SkipTest;

#[Test]
public function requiresPdoMysql(): void
{
    if (!\extension_loaded('pdo_mysql')) {
        throw new SkipTest('pdo_mysql required');
    }

    // ...
}
```

Оба механизма приводят к одному статусу, но разными путями, и это стоит помнить. Исключение бросается, когда тест уже выполняется: <attr>\Testo\Lifecycle\BeforeTest</attr> отработал, аргументы подготовлены (провайдером данных, если он есть), а класс создан, если методу нужен экземпляр. <attr>\Testo\Skip</attr> объявляется заранее и до всего этого просто не доходит. Отличить их в отчёте просто: маркер `is skipped via #[Skip]` ставит только атрибут.

::: warning
Бросайте <class>\Testo\Core\Exception\SkipTest</class> только из тела теста. Если бросить его из интерцептора, оно покинет пайплайн, и тест получит статус <enum>\Testo\Core\Value\Status::Aborted</enum>, а не <enum>\Testo\Core\Value\Status::Skipped</enum>.
:::

## Skip, SkipTest или фильтр по группе

Все три не дают тесту выполниться, но различаются тем, когда принимается решение и остаётся ли тест в отчёте:

- Берите <attr>\Testo\Skip</attr>, когда **тест пока не должен запускаться** и это решение должно быть видно и в коде, и в отчёте.
- Бросайте <class>\Testo\Core\Exception\SkipTest</class>, когда **решить может только сам тест** — по тому, что он обнаружит во время выполнения.
- Берите <attr>\Testo\Filter\Group</attr> с ключом `--group=!slow`, когда **с тестом всё в порядке**, а запускать его в каждом прогоне незачем — например, он слишком долгий.

| Инструмент | Где принимается решение | В отчёте |
|------------|-------------------------|----------|
| `#[Skip('…')]` | в коде, до запуска | <enum>\Testo\Core\Value\Status::Skipped</enum>, с причиной |
| `throw new SkipTest('…')` | внутри теста, во время выполнения | <enum>\Testo\Core\Value\Status::Skipped</enum>, с сообщением |
| <attr>\Testo\Filter\Group</attr> + `--group=!slow` | при запуске раннера | не отображается |
