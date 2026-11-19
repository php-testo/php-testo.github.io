---
outline: [2, 3]
---

# Error Handler — ошибки PHP в тестах

Предупреждения, нотисы и депрекейты PHP не прерывают выполнение кода: тест проходит, а ошибка теряется где-то в выводе раннера. Плагин ловит такие ошибки в каждом тесте и выводит их в канал `stderr` рядом с тестом, который их вызвал. По желанию любая такая ошибка может валить тест.

Плагин поставляется вместе с `testo/testo` и подключается в каждый Test Suite по умолчанию.

<plugin-info class="\Testo\ErrorHandler\ErrorHandlerPlugin" name="Error Handler" included="\Testo\Application\Config\Plugin\SuitePlugins" />

## Как ловятся ошибки

Перед стартом теста плагин ставит свой обработчик ошибок, а после теста снимает его. Обработчик, который был установлен до этого, например в бутстрапе приложения, продолжает работать: каждая ошибка сначала уходит к нему. Ошибки, подавленные через `@` или исключённые в `error_reporting()`, плагин не трогает.

Ошибки из хуков `#[BeforeTest]` и `#[AfterTest]` относятся к тесту так же, как ошибки из его тела. Хуки `#[BeforeClass]` и `#[AfterClass]` выполняются вне тестов, и их ошибки плагин не ловит.

## Падение теста на ошибке

<signature name="\Testo\ErrorHandler\ErrorHandlerPlugin::__construct(bool $failOnError = false)">
<short>Перехватывает ошибки PHP в каждом тесте Test Suite.</short>
<description>
По умолчанию ошибки только выводятся, и статус теста от них не меняется. С `failOnError: true` прошедший тест, в котором была ошибка, получает статус <enum>\Testo\Core\Value\Status::Failed</enum>, а причиной падения становится первая ошибка.
</description>
<param name="$failOnError">Валить прошедший тест, если в нём была хотя бы одна ошибка PHP.</param>
<example>
```php
use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;
use Testo\ErrorHandler\ErrorHandlerPlugin;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: ['tests/Unit'],
            plugins: [new ErrorHandlerPlugin(failOnError: true)],
        ),
    ],
);
```
</example>
</signature>

## Обработчик плагина всегда на стеке

Пока выполняется тест, обработчик плагина установлен, поэтому `set_error_handler()` внутри теста **всегда** возвращает предыдущий обработчик, даже если приложение никаких обработчиков не ставило.

::: warning
Код, который по результату `set_error_handler()` решает, есть ли уже обработчик, под плагином ведёт себя иначе, чем в продакшене: ветка «предыдущего обработчика нет» в тесте не выполнится. Если тест проверяет именно её, отключите для него плагин атрибутом <attr>\Testo\ErrorHandler\WithoutErrorHandler</attr>.
:::

## Тесты, которые меняют стек обработчиков

После каждого теста плагин возвращает стек обработчиков в исходное состояние, чтобы обработчик, забытый одним тестом, не перехватывал ошибки следующих. Если тест оставил свой обработчик на стеке или снял чужой, он получает статус <enum>\Testo\Core\Value\Status::Risky</enum>. Тест, который сам снимает поставленный обработчик, ничего объявлять не должен.

<signature h="3" name="#[\Testo\ErrorHandler\ExpectErrorHandlerChange]">
<short>Объявляет, что тест намеренно меняет стек обработчиков ошибок.</short>
<description>
Нужен тестам, которые проверяют установку обработчика ошибок, например бутстрап приложения. С атрибутом такой тест не получает статус <enum>\Testo\Core\Value\Status::Risky</enum>. Если же помеченный тест стек не изменил, он падает: объявление не соответствует действительности.

Атрибут можно повесить на метод, функцию или класс.
</description>
<example>
```php
use Testo\ErrorHandler\ExpectErrorHandlerChange;

#[Test]
#[ExpectErrorHandlerChange]
public function registersTheApplicationHandler(): void
{
    $app->registerErrorHandler();

    // ...
}
```
</example>
</signature>

## Как отключить плагин

<signature h="3" name="#[\Testo\ErrorHandler\WithoutErrorHandler]">
<short>Выводит тест из-под действия плагина.</short>
<description>
Для помеченного теста плагин не ставит обработчик и ничего не проверяет: тест видит обработку ошибок такой, какая она есть в процессе, и `set_error_handler()` возвращает `null`, если до теста обработчиков не было.

Атрибут можно повесить на метод, функцию или класс. Всё, что такой тест оставит на стеке, достанется следующим тестам, поэтому убирать за собой он должен сам.
</description>
<example>
```php
use Testo\ErrorHandler\WithoutErrorHandler;

#[Test]
#[WithoutErrorHandler]
public function fallsBackWithoutPreviousHandler(): void
{
    // ...
}
```
</example>
</signature>

Чтобы отключить плагин для всего Test Suite, уберите его из стандартного набора в `testo.php`:

```php
use Testo\Application\Config\Plugin\SuitePlugins;
use Testo\Application\Config\SuiteConfig;
use Testo\ErrorHandler\ErrorHandlerPlugin;

new SuiteConfig(
    name: 'Legacy',
    location: ['tests/Legacy'],
    plugins: SuitePlugins::without(ErrorHandlerPlugin::class),
),
```
