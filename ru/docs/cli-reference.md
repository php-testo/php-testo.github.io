# Интерфейс командной строки

Этот документ описывает интерфейс командной строки для Testo.

::: info Путь к бинарнику
Если Testo установлен через Composer, путь до бинарника будет `vendor/bin/testo`. В примерах ниже используется просто `testo` для краткости, но в реальных проектах используйте `vendor/bin/testo` или настройте алиас в вашем окружении.
:::

## Команды

### `testo run`

Выполнить комплекты тестов с опциональной фильтрацией и форматированием вывода.

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

### Фильтрация

Testo предоставляет три типа фильтров, которые можно комбинировать для выборочного запуска тестов.

**Логика комбинирования фильтров:**
- Фильтры одного типа используют логику ИЛИ: `--filter=test1 --filter=test2` → test1 ИЛИ test2
- Фильтры разных типов используют логику И: `--filter=test1 --suite=Unit` → test1 И Unit
- Формула: `И(ИЛИ(filters), ИЛИ(paths), ИЛИ(suites))`

Подробная информация о поведении фильтров в разделе [Фильтрация](/ru/docs/filtering).

#### `--suite`

Фильтрация тестов по имени комплекта тестов. Комплекты определяются в конфигурации.

**Повторяемый:** Да (логика ИЛИ)

**Примеры:**
```bash
# Один набор
testo run --suite=Unit

# Несколько наборов
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

**Поведение фильтров:** Подробности в разделе [Фильтрация](/ru/docs/filtering).

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
