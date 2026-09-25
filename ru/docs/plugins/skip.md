---
outline: [2, 3]
---

# Пропуск тестов

Плагин предоставляет атрибут <attr>\Testo\Skip</attr> и интерцептор, которые помечают тест пропущенным ещё до его запуска. Тест попадает в отчёт со статусом <enum>\Testo\Core\Value\Status::Skipped</enum> и учитывается в итогах, а необязательная причина объясняет, почему он пропущен. Пропускайте тест, когда запускать его пока нельзя, а удалять рано: он воспроизводит ещё не починенный баг, сломан незавершённым рефакторингом или написан раньше фичи, которую проверяет. Атрибут можно повесить на метод, функцию или целый класс — в последнем случае пропускаются все тесты в классе.

<plugin-info class="\Testo\Skip\SkipPlugin" name="Skip" included="\Testo\Application\Config\Plugin\SuitePlugins" />

<signature h="2" name="#[\Testo\Skip(string $reason = '')]">
<short>Помечает тест, класс тестов или тестовую функцию как пропущенные, не запуская их.</short>
<description>
Можно повесить на метод, свободную функцию или класс — на классе пропускаются все тесты тест-кейса. Атрибут наследуется от родительских классов, трейтов и переопределённых методов. Если `#[Skip]` стоит и на методе, и на классе, действует атрибут метода, и его причина заменяет причину класса. Повесить атрибут на один элемент дважды нельзя.

Атрибут действует только на обычные тесты: на не-тестовом методе он ничего не делает, а <attr>\Testo\Bench</attr> и <attr>\Testo\Inline\TestInline</attr> выполняются как обычно. По смыслу близок к `@Disabled` в JUnit и `#[ignore]` в Rust.
</description>
<param name="$reason">Почему тест пропущен. По умолчанию причины нет. Заданная причина дописывается в сообщение результата и видна в отчётах JUnit, TeamCity и HTML.</param>
<example>
Пропустить один тест:

```php
use Testo\Skip;
use Testo\Test;

final class PricingTest
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

## Что не выполняется

Решение о пропуске принимается до старта теста, и в отчёт тест попадает ровно там, где начался бы его запуск. Ничто из того, что подготавливает, оборачивает или повторяет тело теста, не успевает включиться:

- Хуки <attr>\Testo\Lifecycle\BeforeTest</attr> и <attr>\Testo\Lifecycle\AfterTest</attr> не вызываются.
- Провайдеры данных, например <attr>\Testo\Data\DataProvider</attr>, не вызываются: параметризованный тест даёт **одну** запись <enum>\Testo\Core\Value\Status::Skipped</enum>, а не по одной на каждый набор данных.
- <attr>\Testo\Retry</attr> и <attr>\Testo\Repeat</attr> не начинают свой цикл.
- <attr>\Testo\Fiber\RunInFiber</attr> не запускает для него файбер, и покрытие не собирается.

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

Хуки уровня класса подчиняются тест-кейсу, а не тесту: <attr>\Testo\Lifecycle\BeforeClass</attr> и <attr>\Testo\Lifecycle\AfterClass</attr> выполняются, пока в тест-кейсе есть хотя бы один непропущенный тест. Если пропущены все тесты, эти хуки не вызываются, а класс так и не создаётся.

Прогон, состоящий из одних пропущенных тестов, считается успешным: <enum>\Testo\Core\Value\Status::Skipped</enum> — это ни падение, ни ошибка, поэтому код выхода `0`.

## Причина в отчётах

В результат теста попадает сообщение из полного имени теста — `Класс::метод` или полное имя функции для функционального теста — и маркера `is skipped via #[Skip]`; если указана причина, она дописывается в конец:

```
Tests\Unit\PricingTest::calculatesTotal is skipped via #[Skip] ==> broken by the pricing rework
```

- Отчёты JUnit ([`--log-junit`](../guide/cli-reference.md#log-junit)), TeamCity ([`--teamcity`](../guide/cli-reference.md#teamcity)) и HTML показывают это сообщение.
- Терминал печатает строку пропущенного теста без него.
- Компактный отчёт [`--json`](../guide/cli-reference.md#json) учитывает тест в итогах.

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

Оба механизма приводят к одному статусу, но разными путями, и это стоит помнить. Исключение бросается, когда тест уже выполняется: <attr>\Testo\Lifecycle\BeforeTest</attr> отработал, аргументы подготовлены (провайдером данных, если он есть), а класс создан, если методу нужен экземпляр. <attr>\Testo\Skip</attr> объявляется заранее и до всего этого просто не доходит. В отчётах их легко различить: у объявленного пропуска в сообщении есть маркер `is skipped via #[Skip]`.

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
| `#[Skip('…')]` | до запуска теста | <enum>\Testo\Core\Value\Status::Skipped</enum>, с причиной |
| `throw new SkipTest('…')` | внутри теста, во время выполнения | <enum>\Testo\Core\Value\Status::Skipped</enum>, с сообщением |
| <attr>\Testo\Filter\Group</attr> + `--group=!slow` | при запуске раннера | не отображается |

::: question Нужно ли регистрировать плагин?
Нет. `SkipPlugin` входит в набор плагинов по умолчанию, а атрибут сам подключает свой интерцептор. В Test Suite, настроенном без плагина, тест всё равно попадёт в отчёт со статусом <enum>\Testo\Core\Value\Status::Skipped</enum>, и <attr>\Testo\Lifecycle\BeforeTest</attr>/<attr>\Testo\Lifecycle\AfterTest</attr> для него по-прежнему не вызовутся. Теряется только решение на уровне класса: у класса, все тесты которого пропущены, выполнятся <attr>\Testo\Lifecycle\BeforeClass</attr>/<attr>\Testo\Lifecycle\AfterClass</attr>, а ради нестатического хука будет создан экземпляр класса.
:::
