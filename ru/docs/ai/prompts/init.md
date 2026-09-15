---
title: "Инициализация Testo"
llms: prompt
llms_description: "Установка Testo через Composer, генерация testo.php командой `vendor/bin/testo init`, проверочный прогон, джоба для GitHub Actions или GitLab CI и подключение llm/skills для синхронизации скиллов."
prompt_category: "Установка"
---

# Инициализация Testo

Настрой в этом проекте PHP-фреймворк для тестирования [Testo](https://github.com/php-testo/testo). Пройди шаги по порядку и в конце отчитайся о проделанном.

## 0. Сначала прочитай документацию

Прежде чем писать конфиг или тесты, загрузи `https://php-testo.github.io/llms.txt`. Testo — это **не** PHPUnit: ассерты, обнаружение тестов и жизненный цикл устроены иначе, а API, угаданный по именам классов, просто не запустится. Если краткого индекса не хватает, переходи к `https://php-testo.github.io/llms-full.txt`.

## 1. Установка

```bash
composer require --dev testo/testo
```

## 2. Генерация конфига

```bash
vendor/bin/testo init
```

Команда создаёт `testo.php` в корне проекта, находит папки сьютов внутри `tests/` (`Unit`, `Integration`, `Functional`, `Acceptance`, `Feature`, `E2E`, `Contract`), создаёт `tests/Unit/`, если там ничего нет, и добавляет скрипт `composer test` плюс по одному `composer test:<suite>` на каждый найденный сьют.

Что стоит учесть:

- В монорепозитории или при вложенном приложении передай его корень: `vendor/bin/testo init --path=app`. Все пути в сгенерированном конфиге разрешаются относительно этого корня.
- Существующий `testo.php` остаётся цел: команда спрашивает подтверждение на перезапись, а с `--no-interaction` не трогает файл вовсе.
- Для `--no-interaction` каталог `<path>/src` должен уже существовать.

Затем прочитай `testo.php` и сверь `src` и расположение сьютов с реальной структурой проекта.

## 3. Проверочный прогон

```bash
vendor/bin/testo --json
```

С флагом `--json` весь прогон печатается в stdout одним JSON-объектом и больше ничем — разбирай именно его, а не человекочитаемый вывод. Коды выхода: `0` — всё прошло, `1` — есть упавшие тесты, `2` — некорректная команда или конфигурация.

Если тестов в проекте пока нет, напиши один небольшой класс с `#[Test]` в `tests/Unit`, чтобы прогону было о чём отчитаться, и убедись, что он проходит.

## 4. Настройка CI

Спроси, какой CI используется в проекте, и добавь одну джобу — для него. Если конфигурация пайплайна уже есть, добавь шаг с Testo в неё, сохранив настроенные кэши и сервис-контейнеры.

### GitHub Actions — `.github/workflows/tests.yml`

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  tests:
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        php: [ '8.2', '8.3', '8.4' ]

    name: PHP ${{ matrix.php }}

    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          coverage: none

      - name: Install Composer dependencies
        uses: ramsey/composer-install@v3

      - name: Run Tests
        run: vendor/bin/testo --log-junit=runtime/junit.xml

      - name: Upload JUnit report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: junit-php${{ matrix.php }}
          path: runtime/junit.xml
```

### GitLab CI — `.gitlab-ci.yml`

```yaml
stages:
  - test

tests:
  stage: test
  image: php:8.3-cli
  before_script:
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --no-interaction --prefer-dist --no-progress
  script:
    - vendor/bin/testo --log-junit=runtime/junit.xml
  artifacts:
    when: always
    reports:
      junit: runtime/junit.xml
```

Версии PHP приведи в соответствие с ограничением из `composer.json`.

## 5. Предложи синхронизацию скиллов

Внутри пакета Testo поставляются скиллы для AI-агентов (написание тестов, провайдеры данных, бенчмарки, покрытие, миграция), а Composer-плагин [`llm/skills`](https://packagist.org/packages/llm/skills) раскладывает их туда, куда смотрят агенты. Предложи это настроить — там `composer require --dev llm/skills` и одна команда `composer skills:init` — и, если предложение принято, действуй по <https://php-testo.github.io/ru/docs/ai/prompts/skills.md>.

## 6. Отчёт

Отчитайся: что установлено, какие сьюты объявлены в `testo.php`, чем закончился проверочный прогон, какой CI-файл добавлен и настроена ли синхронизация скиллов — и отдельно отметь всё, о чём в структуре проекта пришлось догадываться.
