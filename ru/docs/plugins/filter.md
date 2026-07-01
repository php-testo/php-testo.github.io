---
outline: [2, 3]
---

# Фильтрация тестов

Этот документ описывает внутреннюю логику плагина фильтрации: алгоритм, этапы конвейера, комбинирование критериев. Если вам нужно просто отфильтровать тесты при запуске — смотрите [CLI-справочник](../guide/cli-reference.md).

<plugin-info name="Filter" class="\Testo\Filter\FilterPlugin" included="\Testo\Application\Config\Plugin\ApplicationPlugins" />

## Обзор

Testo предоставляет гибкую систему фильтрации, которая работает в несколько этапов для последовательного сужения набора тестов. Фильтрацией можно управлять программно через класс <class>\Testo\Filter</class> или автоматически из аргументов CLI.

<signature h="2" name="new \Testo\Filter(array $suites = [], array $names = [], array $paths = [], array $type = [], array $notType = [], array $groups = [], array $excludeGroups = [])">
<short>Неизменяемый DTO с критериями фильтрации тестов.</short>
<param name="$suites">Названия Test Suite для фильтрации.</param>
<param name="$names">Имена классов, методов или функций. Форматы: `ClassName::methodName`, `Namespace\ClassName`, фрагмент `methodName`. Опциональные индексы DataProvider через двоеточие: `name:providerIndex:datasetIndex`.</param>
<param name="$paths">Пути к файлам или директориям. Поддерживает glob-паттерны: `*`, `?`, `[abc]`.</param>
<param name="$type">Типы тестов для включения (логика ИЛИ): `test`, `inline`, `bench` или пользовательские. Пустой список — запускаются все типы. См. <attr>\Testo\Core\Value\TestType</attr>.</param>
<param name="$notType">Типы тестов для исключения. Тест такого типа пропускается — исключение имеет приоритет над включением.</param>
<param name="$groups">Названия групп для включения (логика ИЛИ). Тест совпадает, если входит в любую из этих групп. См. <attr>\Testo\Filter\Group</attr>.</param>
<param name="$excludeGroups">Названия групп для исключения. Тест из любой такой группы пропускается — исключение имеет приоритет над включением.</param>
<example>
```php
$filter = new Filter(
    suites: ['Unit', 'Integration'],
    names: ['UserTest::testLogin', 'testAuthentication'],
    paths: ['tests/Unit/*', 'tests/Integration/*'],
    type: ['test'],
    notType: ['bench'],
    groups: ['database'],
    excludeGroups: ['slow'],
);
```
</example>
</signature>

### Использование

**Через CLI-опции** — при создании через `Application::createFromInput()` плагин автоматически создаёт <class>\Testo\Filter</class> из опций команды: `--filter`, `--path`, `--suite`, `--type`, `--group`:

```php
$app = Application::createFromInput(
    inputOptions: ['filter' => ['UserTest'], 'suite' => ['Unit']],
);
$result = $app->run();
```

**Через контейнер** — зарегистрируйте объект <class>\Testo\Filter</class> напрямую:

```php
$app = Application::createFromConfig($config);

$app->getContainer()->set(Filter::class, new Filter(
    suites: ['Unit'],
    names: ['UserTest'],
));

$result = $app->run();
```

## Логика комбинирования фильтров

### Одинаковый тип: логика ИЛИ

Несколько значений внутри одного типа фильтра комбинируются логикой ИЛИ:

- `names: ['test1', 'test2']` → совпадает, если имя test1 **ИЛИ** test2
- `paths: ['path1', 'path2']` → совпадает, если путь path1 **ИЛИ** path2
- `suites: ['Unit', 'Integration']` → совпадает, если Test Suite - Unit **ИЛИ** Integration

### Разные типы: логика И

Разные типы фильтров комбинируются логикой И:

- `names: ['test1'], suites: ['Unit']` → совпадает, если имя test1 **И** Test Suite - Unit
- `names: ['UserTest'], paths: ['tests/Unit/*']` → совпадает, если имя UserTest **И** путь соответствует tests/Unit/*
- `names: ['test1'], type: ['inline']` → совпадает, если имя test1 **И** тип - inline

**Формула**: `AND(OR(names), OR(paths), OR(suites), OR(type), NOT OR(notType), OR(groups), NOT OR(excludeGroups))`

**Пример:**
```php
$filter = new Filter(
    names: ['test1', 'test2'],        // test1 ИЛИ test2
    paths: ['path1', 'path2'],        // path1 ИЛИ path2
    suites: ['Unit', 'Critical'],     // Unit ИЛИ Critical
    type: ['test'],                   // только обычные тесты
);
// Результат: (test1 ИЛИ test2) И (path1 ИЛИ path2) И (Unit ИЛИ Critical) И type=test
```

## Фильтрация по типу

Тип — это вид теста: `test` (обычные `#[Test]`), `inline` (<attr>\Testo\Inline\TestInline</attr>), `bench` (<attr>\Testo\Bench\Bench</attr>) или пользовательский. См. <attr>\Testo\Core\Value\TestType</attr>.

В отличие от групп, фильтр по типу работает **не на уровне отдельных тестов**, а на уровне конвейера: он отбирает, какие interceptor'ы-локаторы (и другие мидлвари) участвуют в пайплайне, исходя из объявленного у них типа (<attr>\Testo\Pipeline\Attribute\InterceptorOptions</attr>, параметр `testType`). Каждый локатор, порождающий тесты определённого типа, объявляет этот тип; универсальные мидлвари (без `testType`) работают всегда.

Выбор выполняется через CLI-флаг `--type` (или свойства `$type` / `$notType` DTO <class>\Testo\Filter</class>):

- **Включение** — `--type=bench` оставляет только тип `bench`. Несколько значений `--type` комбинируются логикой ИЛИ.
- **Исключение** — префикс `!` означает исключение: `--type=!bench` запускает всё, кроме бенчей. Исключение всегда имеет приоритет над включением.
- Фильтры по типу комбинируются с фильтрами по имени, пути, Test Suite и группам логикой И.

```bash
# Только бенчмарки
testo run --type=bench

# Обычные тесты ИЛИ встроенные
testo run --type=test --type=inline

# Всё, кроме бенчей
testo run --type=!bench
```

::: tip Тип проходит, если
Тип `t` проходит, когда он есть в списке включения (или список включения пуст) **и** его нет в списке исключения. Interceptor остаётся в пайплайне, если он универсальный (без `testType`) либо хотя бы один из объявленных у него типов проходит.
:::

## Фильтрация по группам

Группы — это простые строковые метки, которые вы навешиваете на тесты атрибутом <attr>\Testo\Filter\Group</attr>. В отличие от имён и путей, они не зависят от того, как тест назван и где лежит: вы помечаете тесты по категориям (`db`, `slow`, `integration`), а затем запускаете или пропускаете целые категории разом.

<signature h="2" name="#[\Testo\Filter\Group(string ...$names)]">
<short>Помечает класс, метод или функцию одной или несколькими группами для выборочной фильтрации.</short>
<description>
Можно указать сразу несколько названий групп. Это просто строковые метки без структуры «ключ-значение».

Тест попадает во все группы, которые объявлены где-либо на пути к нему: на самом методе (и на родительском методе, который он переопределяет), на классе теста, на его родительских классах и трейтах. Все эти группы **складываются**, поэтому группа, объявленная на классе, действует для каждого теста внутри него.
</description>
<param name="$names">Названия групп для присвоения.</param>
<example>
```php
#[Test]
#[Group('integration')]
final class OrderTest
{
    public function createsOrder(): void {}            // группы: integration

    #[Group('slow')]
    public function importsLargeDataset(): void {}     // группы: integration, slow
}
```
</example>
</signature>

Выбор тестов выполняется через CLI-флаг `--group` (или свойства `$groups` / `$excludeGroups` DTO <class>\Testo\Filter</class>):

- **Включение** — `--group=db` запускает только тесты из группы `db`. Несколько значений `--group` комбинируются логикой ИЛИ.
- **Исключение** — префикс `!` означает исключение: `--group=!slow` пропускает тесты из группы `slow`. Исключение всегда имеет приоритет над включением.
- Фильтры по группам комбинируются с фильтрами по имени, пути, Test Suite и типу логикой И.

```bash
# Только тесты из группы "database"
testo run --group=database

# Тесты из "database" ИЛИ "unit"
testo run --group=database --group=unit

# Всё, кроме группы "slow"
testo run --group=!slow

# Комбинация с фильтром по имени (И)
testo run --group=database --filter=UserTest
```

## Поведение фильтра по именам

Поведение фильтрации по именам реализовано в <class>\Testo\Filter\Internal\FilterInterceptor</class> и зависит от формата имени:

### Формат метода (`ClassName::methodName`)

При использовании формата метода с разделителем `::`:
- Совпадает только указанный метод
- Другие методы в том же классе исключаются
- Результат: Тестовый кейс с **только указанным методом**

**Пример:**
```php
$filter = new Filter(names: ['UserTest::testLogin']);
// Результат: класс UserTest только с методом testLogin
```

### Формат FQN или фрагмента

При использовании FQN (с `\`) или простого фрагмента (без разделителей):

**Случай 1: Имя класса совпадает**
- Результат: **Весь тестовый кейс со всеми методами**

**Случай 2: Имя класса не совпадает**
- Система проверяет отдельные методы/функции
- Результат: Тестовый кейс с **только совпавшими методами**
- Если методы не совпадают: Тестовый кейс пропускается

**Примеры:**
```php
// FQN - совпадает весь класс
$filter = new Filter(names: ['Tests\Unit\UserTest']);
// Результат: класс UserTest со всеми методами

// Фрагмент - совпадает весь класс
$filter = new Filter(names: ['UserTest']);
// Результат: класс UserTest со всеми методами

// Фрагмент - совпадает метод в любом классе
$filter = new Filter(names: ['testLogin']);
// Результат: Все классы с методом testLogin, каждый только с этим методом
```

### Уточнение DataProvider и DataSet

После имени через двоеточие можно уточнить конкретный DataProvider, а ещё через двоеточие — конкретный DataSet внутри него.

**Формат:** `name:providerIndex:datasetIndex`

- Формат маппится на <class>\Testo\Filter\DataPointer</class> и передаётся модулю провайдера данных.
- Под «провайдером» понимается любой атрибут, порождающий отдельный тест: <attr>\Testo\Data\DataProvider</attr>, <attr>\Testo\Data\DataSet</attr>, <attr>\Testo\Inline\TestInline</attr>, <attr>\Testo\Bench\Bench</attr> и т.д.
- Индексы начинаются с 0, независимы от меток датасетов.
- `datasetIndex` опционален — можно указать только провайдер.
- Работает со всеми форматами имён (метод, FQN, фрагмент).

**Примеры:**
```php
// Первый провайдер
$filter = new Filter(names: ['UserTest::testLogin:0']);

// Первый провайдер, второй датасет
$filter = new Filter(names: ['UserTest::testLogin:0:1']);

// Второй провайдер, четвёртый датасет — для любого теста с именем testAuth
$filter = new Filter(names: ['testAuth:1:3']);

// Первый провайдер — для всего класса UserTest
$filter = new Filter(names: ['UserTest:0']);
```

## Конвейер фильтрации

Фильтрация работает в пять этапов:

### Этап 1: Фильтр Test Suite (уровень конфигурации)

**Входные данные:** `Filter::$suites`

- Фильтрует Test Suite по названиям
- Каждый Test Suite определяет расположение и паттерны сканирования файлов
- Определяет начальный набор директорий для сканирования
- Несколько Test Suite используют логику ИЛИ

### Этап 2: Фильтр путей (уровень Finder)

**Входные данные:** `Filter::$paths`

- Применяется на уровне поиска файлов во время сканирования директорий
- Использует glob-паттерны для сопоставления путей файлов
- Поддерживает подстановочные символы: `*`, `?`, `[abc]`
- Несколько путей используют логику ИЛИ
- Возвращает список файлов для обработки

### Этап 3: Фильтр файлов (уровень Tokenizer)

**Входные данные:** `Filter::$names`
**Реализация:** `FilterInterceptor::locateFile()`

- Предварительная фильтрация тестовых файлов перед загрузкой для рефлексии
- Использует легковесную токенизацию вместо полной рефлексии
- Проверяет, содержит ли файл какие-либо совпадающие классы, методы или функции
- Пропускает файлы, которые не соответствуют ни одному паттерну
- Несколько имен используют логику ИЛИ

### Этап 4: Фильтр тестов (уровень рефлексии)

**Входные данные:** `Filter::$names`
**Реализация:** `FilterInterceptor::locateTestCases()`

- Фильтрует отдельные тестовые кейсы и методы после рефлексии
- Реализует иерархическую фильтрацию:
  - Для формата метода (`::`) - фильтрует только конкретные методы
  - Для формата FQN/фрагмента - сначала проверяет имя класса, затем методы
- Извлекает индексы DataProvider и связывает их с совпавшими тестами
- Возвращает отфильтрованные определения тестовых кейсов, готовые к выполнению

### Этап 5: Внедрение DataProvider (уровень выполнения)

**Входные данные:** Индексы DataProvider с Этапа 4
**Реализация:** `FilterInterceptor::runTest()`

- Внедряет `DataPointer` в метаданные теста перед выполнением
- Делает `DataPointer` доступным для других interceptor'ов
- Если индексы не указаны: `DataPointer` не внедряется

## Сопоставление паттернов

<class>\Testo\Filter\Internal\FilterInterceptor</class> использует сопоставление по границам целых слов с помощью регулярных выражений:

```php
private static function has(string $needle, string $haystack): bool
{
    return \preg_match('/\\b' . \preg_quote($needle, '/') . '\\b$/', $haystack) === 1;
}
```

**Поведение:**
- `User` совпадает с `App\User` ✓
- `User` НЕ совпадает с `App\UserManager` ✗
- `test` совпадает с `testMethod` ✓
- `test` НЕ совпадает с `latestMethod` ✗
