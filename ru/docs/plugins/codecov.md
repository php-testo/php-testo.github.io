---
outline: [2, 4]
---

# Покрытие кода

Плагин собирает данные о покрытии кода во время выполнения тестов и генерирует отчёты в стандартных форматах. Отчёты можно использовать в CI-сервисах (Codecov.io, SonarQube, GitHub Actions) и в IDE — например, PhpStorm умеет отображать покрытие прямо в коде по Clover-отчёту.

<plugin-info name="Codecov" class="\Testo\Codecov\CodecovPlugin" />

## Требования

Для сбора покрытия нужно одно из PHP-расширений:

- **[PCOV](https://github.com/krakjoe/pcov)** — легковесное, быстрое, только построчное покрытие.
- **[XDebug](https://xdebug.org/)** ≥ 3.0 в режиме `coverage` (`xdebug.mode=coverage`).

Если доступны оба расширения, Testo предпочитает PCOV — у него меньше накладных расходов. Если не установлено ни одно из расширений, поведение зависит от режима активации плагина (<enum>\Testo\Codecov\Config\CoverageMode</enum>).

::: question Какое расширение лучше — PCOV или XDebug?
PCOV быстрее и проще в настройке, но поддерживает только построчное покрытие. XDebug нужен для анализа ветвей и путей. Если вам достаточно <enum>\Testo\Codecov\Config\CoverageLevel::Line</enum> — используйте PCOV.
:::

## Настройка

Зарегистрируйте <class>\Testo\Codecov\CodecovPlugin</class> в секции `plugins` конфигурации:

::: code-group
```php [Уровень приложения]
return new ApplicationConfig(
    src: ['src'],
    //...
    plugins: [
        new CodecovPlugin(
            level: CoverageLevel::Line,
            reports: [
                new CloverReport(__DIR__ . '/clover.xml', 'MyProject'),
                new CoberturaReport(__DIR__ . '/cobertura.xml'),
            ],
        ),
    ],
);
```
```php [Уровень Test Suite]
return new ApplicationConfig(
    src: ['src'],
    suites: [
        new SuiteConfig(
            // ...
            plugins: [
                new CodecovPlugin(
                    reports: [
                        new CloverReport(__DIR__ . '/clover.xml', 'MyProject'),
                    ],
                ),
            ],
        ),
    ],
);
```
:::

На уровне приложения покрытие собирается по всем Test Suite. На уровне Test Suite — только для конкретного комплекта. Отчёты генерируются после завершения тестов. Покрытие фильтруется по файлам, соответствующим параметру `src` из <class>\Testo\Application\Config\ApplicationConfig</class>.

<signature h="3" name="new \Testo\Codecov\CodecovPlugin(CoverageLevel $level = CoverageLevel::Line, CoverageMode $collect = CoverageMode::IfAvailable, array $testTypes = [TestType::Test, TestType::TestInline], array $reports = [])">
<short>Настраивает сбор покрытия кода: глубину анализа, режим активации и формат отчётов.</short>
<param name="$level">Глубина анализа покрытия. По умолчанию <enum>\Testo\Codecov\Config\CoverageLevel::Line</enum>.</param>
<param name="$collect">Режим активации по умолчанию. CLI-флаги (`--coverage`, `--no-coverage`) имеют приоритет над этим значением.</param>
<param name="$testTypes">Типы тестов, для которых собирать покрытие. Сбор покрытия добавляет накладные расходы к каждому запуску, поэтому для бенчмарков он по умолчанию отключён — иначе замеры производительности будут искажены. По умолчанию покрытие собирается только для обычных тестов и inline-тестов (<enum>\Testo\Core\Value\TestType::Test</enum>, <enum>\Testo\Core\Value\TestType::TestInline</enum>). Пустой массив означает все типы. Принимает кейсы <enum>\Testo\Core\Value\TestType</enum> или произвольные строковые идентификаторы.</param>
<param name="$reports">Генераторы отчётов, которые будут выполнены после завершения всех тестов. Каждый элемент должен реализовывать интерфейс <class>\Testo\Codecov\Report\CoverageReport</class>.</param>
</signature>

<signature h="3" name="enum \Testo\Codecov\Config\CoverageLevel">
<short>Определяет глубину анализа покрытия. Каждый следующий уровень включает данные предыдущего.</short>
<description>
Каждый следующий уровень увеличивает накладные расходы на анализ. PCOV поддерживает только `Line` — при запросе более глубокого уровня он молча возвращается к `Line`.

**Пример.** Допустим, есть такой код:

```php
function greet(bool $loud, bool $formal): string
{
    $greeting = $formal ? 'Good day' : 'Hi';         // 2 ветви
    return $loud ? strtoupper($greeting) : $greeting; // 2 ветви
}
```

Тест, вызывающий `greet(true, true)`:

- **Line** — 100%: обе строки выполнены.
- **Branch** — 50%: пройдены 2 из 4 ветвей.
- **Path** — 25%: пройден 1 из 4 путей (true+true, true+false, false+true, false+false).
</description>
<case name="Line">Какие строки исходного кода были выполнены. Поддерживается PCOV и XDebug.</case>
<case name="Branch">Line + какие ветви (`if/else`, `switch`, `?:`, `??`) были пройдены. Только XDebug.</case>
<case name="Path">Branch + какие полные пути выполнения через каждую функцию были пройдены. Только XDebug.</case>
</signature>

<signature h="3" name="enum \Testo\Codecov\Config\CoverageMode">
<short>Определяет, нужно ли собирать покрытие.</short>
<description>
Поведение по умолчанию задаётся параметром `collect` конструктора <class>\Testo\Codecov\CodecovPlugin</class>, а CLI-флаги при запуске могут его переопределить. Благодаря этому плагин можно безопасно оставить в `testo.php` на всех окружениях — на CI без PCOV/XDebug тесты пройдут нормально, просто без отчётов.
</description>
<case name="IfAvailable">**По умолчанию.** Покрытие собирается, если расширение доступно и настроено, иначе молча пропускается.</case>
<case name="Always">Покрытие обязательно. Если расширение не установлено, тесты упадут с исключением <class>\Testo\Codecov\Exception\CoverageDriverNotAvailable</class>. Устанавливается CLI-флагом `--coverage`.</case>
<case name="Never">Покрытие полностью отключено, нулевые накладные расходы. Устанавливается CLI-флагом `--no-coverage`.</case>
</signature>

::: question Что будет, если не установлено ни одно расширение для покрытия?
Зависит от режима активации. По умолчанию используется <enum>\Testo\Codecov\Config\CoverageMode::IfAvailable</enum> — плагин молча пропустит сбор покрытия, и тесты выполнятся без него. Если запустить с флагом `--coverage`, режим установится в <enum>\Testo\Codecov\Config\CoverageMode::Always</enum>, и тесты упадут с исключением <class>\Testo\Codecov\Exception\CoverageDriverNotAvailable</class>.
:::

### Отчёты

Все встроенные генераторы отчётов реализуют интерфейс <class>\Testo\Codecov\Report\CoverageReport</class>. Вы можете реализовать его, чтобы добавить собственный формат вывода.

<signature h="4" name="new \Testo\Codecov\Report\CloverReport(string $outputPath, string $projectName = '')">
<short>Генерирует отчёт в формате Clover XML.</short>
<description>
Формат содержит элементы `<file>`, `<line>` и `<metrics>` — только построчное покрытие операторов. Данные о ветвях и путях не включаются, поскольку формат их не поддерживает.

Совместим с: Codecov.io, SonarQube, Atlassian Clover.
</description>
<param name="$outputPath">Абсолютный путь к выходному XML-файлу.</param>
<param name="$projectName">Имя проекта в элементе `<project>`. По умолчанию пустая строка.</param>
<example>
```php
new CloverReport(__DIR__ . '/clover.xml', 'MyProject')
```
</example>
</signature>

<signature h="4" name="new \Testo\Codecov\Report\CoberturaReport(string $outputPath, string $sourceRoot = '')">
<short>Генерирует отчёт в формате Cobertura XML.</short>
<description>
Файлы группируются в элементы `<package>` по директориям, с относительными путями от `sourceRoot`.

Если доступны данные о ветвях (<enum>\Testo\Codecov\Config\CoverageLevel::Branch</enum> или выше):

- `branch-rate`, `branches-covered`, `branches-valid` заполняются на всех уровнях (coverage, package, class).
- Строки с точками ветвления получают атрибуты `branch="true"` и `condition-coverage="50% (1/2)"`.

Без данных о ветвях все branch-атрибуты равны `0`.

Совместим с: GitHub Actions, GitLab CI, Jenkins.
</description>
<param name="$outputPath">Абсолютный путь к выходному XML-файлу.</param>
<param name="$sourceRoot">Корень исходников для формирования относительных путей. По умолчанию `getcwd()`.</param>
<example>
```php
new CoberturaReport(__DIR__ . '/cobertura.xml')
```
</example>
</signature>

## Управление покрытием

Параметр `src` в конфигурации <class>\Testo\Application\Config\ApplicationConfig</class> определяет глобальный набор файлов, попадающих в покрытие. Атрибуты <attr>\Testo\Codecov\Covers</attr> и <attr>\Testo\Codecov\CoversNothing</attr> позволяют точечно управлять покрытием для конкретного теста.

### Глобальный фильтр

Поддерживаются включения и исключения через <class>\Testo\Application\Config\FinderConfig</class>:

```php
return new ApplicationConfig(
    src: new FinderConfig(
        include: ['src'],
        exclude: ['src/Generated'],
    ),
    // ...
);
```

::: tip
Старайтесь включать в `src` только нужные директории, чтобы отрезать ненужные файлы ещё до их загрузки. Это даёт наибольшую производительность.
:::

<signature h="3" name="#[\Testo\Codecov\Covers(string $classOrFunction, ?string $method = null)]">
<short>Ограничивает, какой исходный код засчитывается в покрытие для данного теста.</short>
<description>
В отчёт попадут только строки, принадлежащие указанным классам, трейтам, enum-ам, методам или функциям. Всё остальное отбрасывается. Атрибут можно повторять: несколько <attr>\Testo\Codecov\Covers</attr> на одном тесте объединяются.

При размещении на классе применяется ко всем тестам внутри.
</description>
<param name="$classOrFunction">Полное имя класса, трейта, enum-а (`UserService::class`, `Cacheable::class`, `OrderStatus::class`) или функции (`'App\Helpers\format_name'`).</param>
<param name="$method">Имя метода внутри класса, трейта или enum-а. Если указано, в покрытие попадут только строки этого метода, а не всей сущности.</param>
<example>
Покрытие для класса, трейта или enum-а — все исполняемые строки:

```php
#[Covers(UserService::class)]
public function testCreateUser(): void { ... }

#[Covers(Cacheable::class)]
public function testCacheableBehavior(): void { ... }

#[Covers(OrderStatus::class)]
public function testOrderStatusTransitions(): void { ... }
```
</example>
<example>
Покрытие для конкретного метода — работает с классами, трейтами и enum-ами:

```php
#[Covers(UserService::class, 'create')]
public function testCreateUser(): void { ... }

#[Covers(Cacheable::class, 'invalidate')]
public function testCacheInvalidation(): void { ... }

#[Covers(OrderStatus::class, 'canTransitionTo')]
public function testStatusTransition(): void { ... }
```
</example>
<example>
Несколько целей — покрытие объединяется:

```php
#[Covers(UserService::class)]
#[Covers(UserRepository::class, 'findById')]
public function testCreateUser(): void { ... }
```
</example>
</signature>

<signature h="3" name="#[\Testo\Codecov\CoversNothing]">
<short>Исключает тест из статистики покрытия.</short>
<description>
Тест с этим атрибутом выполняется как обычно, но драйвер покрытия не запускается — нулевые накладные расходы, данные не собираются и не попадают в отчёты. Полезно для smoke-тестов и интеграционных проверок, которые затрагивают много кода, но не должны искажать картину покрытия.

При размещении на классе применяется ко всем тестам внутри.
</description>
<example>
```php
#[CoversNothing]
public function smokeTest(): void
{
    // Тест выполнится, но покрытие не собирается
    $response = $this->app->get('/health');
    Assert::same(200, $response->statusCode);
}
```
</example>
</signature>

### Приоритет атрибутов

Атрибуты покрытия разрешаются послойно: сначала проверяется метод, затем класс. Если на методе есть любой атрибут покрытия, атрибуты класса игнорируются. Это позволяет переопределять поведение в наследниках:

```php
#[CoversNothing]
abstract class BaseIntegrationTest
{
    // По умолчанию все тесты в наследниках не собирают покрытие
}

#[Covers(PaymentService::class)]
final class PaymentServiceTest extends BaseIntegrationTest
{
    // Этот класс переопределяет поведение — покрытие собирается
    public function testCharge(): void { ... }
}
```

::: warning
Использование <attr>\Testo\Codecov\Covers</attr> и <attr>\Testo\Codecov\CoversNothing</attr> на **одном уровне** — ошибка. Testo выбросит исключение с указанием конфликтующего теста. Разные уровни (например, <attr>\Testo\Codecov\CoversNothing</attr> на родительском классе и <attr>\Testo\Codecov\Covers</attr> на дочернем) — допустимы.
:::

### Метаданные

Данные о покрытии каждого теста попадают в метаданные <class>\Testo\Core\Context\TestResult</class> под ключом <class>\Testo\Codecov\Result\CoverageResult</class>:

```php
use Testo\Codecov\Result\CoverageResult;

$coverage = $testResult->getAttribute(CoverageResult::class);
// CoverageResult|null
```

Таким образом, вы можете реализовать любую логику на основе покрытия до того, как результаты будут отражены в отчётах.
