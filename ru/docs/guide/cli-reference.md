# Интерфейс командной строки

Этот документ описывает интерфейс командной строки для Testo.

::: info Путь к бинарнику
Если Testo установлен через Composer, путь до бинарника будет `vendor/bin/testo`. В примерах ниже используется просто `testo` для краткости, но в реальных проектах используйте `vendor/bin/testo` или настройте алиас в вашем окружении.
:::

## Команды

### `testo run`

Выполнить Test Suite с опциональной фильтрацией и форматированием вывода.

Это команда по умолчанию и может быть опущена при использовании флагов.

```bash
testo run [options]
testo [options]  # run опциональна
```

**Примеры:**
```bash
# Явная команда run
testo run
testo run --suite=Unit

# Неявная команда run (по умолчанию)
testo
testo --suite=Unit
```

## Общие флаги конфигурации

### `--config`

Указать путь к конфигурационному файлу.

**По умолчанию:** `./testo.php`

**Примеры:**
```bash
testo run --config=./custom-testo.php
testo run --suite=Integration --config=./ci-testo.php
```

## Запуск тестов

### Форматирование вывода

#### `--teamcity`

Включить формат служебных сообщений TeamCity для интеграции с JetBrains IDE.

Используется [плагином Testo](https://plugins.jetbrains.com/plugin/28842-testo) для PHPStorm/IntelliJ IDEA и CI-сервера TeamCity.

**Примеры:**
```bash
testo --teamcity
testo --suite=Unit --teamcity
```

#### `--json`

Вывести весь прогон одним минималистичным JSON-объектом в stdout — и больше ничего. JSON-отчёт рассчитан на машины: AI-агентов и CI-скрипты, которым нужно разбирать результаты, а не парсить ANSI-вывод.

Отчёт содержит только то, что нужно для реакции на упавший прогон: общий `status`, `duration`, счётчики по статусам `totals` и плоский список `failures[]`. Каждый провал несёт FQN теста, тип исключения, сообщение, файл и строку, обрезанный стек вызовов, цепочку предыдущих исключений (`causedBy`) и захваченный вывод.

`--json` несовместим с `--teamcity` — оба пишут в stdout. Чтобы получить JSON вместе с читаемым выводом, используйте `--log-json`.

```bash
testo --json
testo --suite=Unit --json
```

#### `--log-json`

Записать JSON-отчёт в файл, оставив обычный вывод в терминал активным. Работает по аналогии с `--log-junit`.

```bash
testo --log-json=runtime/report.json
testo --suite=Unit --log-json=runtime/report.json
```

#### `--log-junit`

Записать отчёт JUnit XML по указанному пути (переопределяет конфигурацию плагина JUnit). Вывод в терминал остаётся активным.

```bash
testo --log-junit=runtime/junit.xml
```

### Фильтрация

Testo предоставляет несколько фильтров, которые можно комбинировать для выборочного запуска тестов.

**Логика комбинирования фильтров:**
- Фильтры одного типа используют логику ИЛИ: `--filter=test1 --filter=test2` → test1 ИЛИ test2
- Фильтры разных типов используют логику И: `--filter=test1 --suite=Unit` → test1 И Unit
- Формула: `И(ИЛИ(filters), ИЛИ(paths), ИЛИ(suites), ИЛИ(type), НЕ ИЛИ(notType), ИЛИ(groups), НЕ ИЛИ(excludeGroups))`

Подробная информация о поведении фильтров в разделе [Фильтрация](/ru/docs/plugins/filter.md).

#### `--suite`

Фильтрация тестов по имени Test Suite. Test Suite определяются в конфигурации.

**Повторяемый:** Да (логика ИЛИ)

**Примеры:**
```bash
# Один Test Suite
testo run --suite=Unit

# Несколько Test Suite
testo run --suite=Unit --suite=Integration
```

#### `--path`

Фильтрация файлов тестов по glob-паттернам. Поддерживает подстановочные символы: `*`, `?`, `[abc]`

**Повторяемый:** Да (логика ИЛИ)

**Примечание:** Звёздочка `*` автоматически добавляется, если путь не заканчивается подстановочным символом.
- `tests/Unit` становится `tests/Unit*`
- `tests/Unit/` становится `tests/Unit/*`

**Примеры:**
```bash
# Соответствует tests/Unit*
testo run --path="tests/Unit"

# Соответствует tests/Unit/*Test.php
testo run --path="tests/Unit/*Test.php"

# Несколько путей
testo run --path="tests/Unit" --path="tests/Integration"

# Вложенные директории
testo run --path="tests/*/Security/*Test.php"
```

#### `--filter`

Фильтрация тестов по именам классов, методов или функций.

**Повторяемый:** Да (логика ИЛИ)

**Поддерживаемые форматы:**
- **Метод**: `ClassName::methodName` или `Namespace\ClassName::methodName`
- **FQN**: `Namespace\ClassName` или `Namespace\functionName`
- **Фрагмент**: `methodName`, `functionName` или `ShortClassName`

**Примеры:**
```bash
# Конкретный метод
testo run --filter=UserTest::testLogin

# Весь класс
testo run --filter=UserTest

# По FQN
testo run --filter=Tests\Unit\UserTest

# Имя метода во всех классах
testo run --filter=testLogin

# Несколько фильтров (ИЛИ)
testo run --filter=UserTest::testCreate --filter=UserTest::testUpdate

# Комбинация с другими фильтрами (И)
testo run --filter=testAuthentication --suite=Unit
testo run --filter=UserTest --path="tests/Unit"
```

**Поведение фильтров:** Подробности в разделе [Фильтрация](/ru/docs/plugins/filter.md).

#### `--type`

Фильтрация тестов по типу.

**Повторяемый:** Да (логика ИЛИ)

**Возможные значения:**
- `test` — обычные тесты (методы в классах)
- `inline` — [встроенные тесты](/ru/docs/plugins/inline.md) (тесты через <attr>\Testo\Inline\TestInline</attr>)
- `bench` — бенчмарки

- Обычное имя **включает** тип: `--type=bench`. Несколько значений комбинируются логикой ИЛИ.
- Префикс `!` **исключает** тип: `--type=!bench`. Исключение имеет приоритет над включением.

**Примеры:**
```bash
# Только обычные тесты
testo run --type=test

# Обычные тесты ИЛИ встроенные
testo run --type=test --type=inline

# Только бенчмарки
testo run --type=bench

# Всё, кроме бенчмарков
testo run --type=!bench

# Комбинация с другими фильтрами (И)
testo run --type=test --suite=Unit
testo run --type=inline --filter=testLogin
```

::: info Мидлвари и тип тестов
Фильтр по типу работает на уровне конвейера: мидлвари (и локаторы тестов), привязанные к определённому типу, исключаются из пайплайна, если их тип не проходит фильтр. Подробности — в разделе [Фильтрация по типу](/ru/docs/plugins/filter.md#фильтрация-по-типу).
:::

#### `--group`

Фильтрация тестов по группам. Группы — это простые метки, навешиваемые на тесты атрибутом <attr>\Testo\Filter\Group</attr>.

**Повторяемый:** Да (логика ИЛИ)

- Обычное имя **включает** группу: `--group=database`.
- Префикс `!` **исключает** группу: `--group=!slow`. Исключение имеет приоритет над включением.

**Примеры:**
```bash
# Только тесты из группы "database"
testo run --group=database

# Тесты из "database" ИЛИ "integration"
testo run --group=database --group=integration

# Всё, кроме группы "slow"
testo run --group=!slow

# Комбинация с фильтром по имени (И)
testo run --group=database --filter=UserTest
```

Правила наследования групп описаны в разделе [Фильтрация по группам](/ru/docs/plugins/filter.md#фильтрация-по-группам).

### Комбинирование фильтров

**Примеры:**
```bash
# Имя И набор
testo run --filter=testLogin --suite=Unit

# Имя И путь
testo run --filter=UserTest --path="tests/Unit"

# Все три типа (И)
testo run --filter=testImportant --path="tests/Unit" --suite=Critical

# Несколько значений с несколькими типами
testo run \
  --filter=testCreate --filter=testUpdate \
  --path="tests/Unit" --path="tests/Integration" \
  --suite=Critical
```

## Коды выхода

- `0` (SUCCESS): Все тесты прошли
- `1` (FAILURE): Один или несколько тестов упали
- `2` (INVALID): Неверная команда или конфигурация
