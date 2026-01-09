# Начало работы

Testo — это расширяемый фреймворк тестирования, построенный на легковесном ядре с системой middleware.
Он даёт вам полный контроль над средой тестирования, сохраняя привычный синтаксис PHP.

## Установка

Установите Testo через Composer:

```bash
composer require --dev testo/testo
```

::: tip Требования
PHP 8.3 или выше
:::

## Конфигурация

По умолчанию, если конфигурационный файл не указан, Testo запустит тесты из папки `tests`.

Чтобы настроить конфигурацию, создайте файл `testo.php` в корне проекта:

```php
<?php

declare(strict_types=1);

use Testo\Config\ApplicationConfig;
use Testo\Config\SuiteConfig;
use Testo\Config\FinderConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: new FinderConfig(
                include: ['tests/Unit'],
            ),
        ),
    ],
);
```

## Написание первого теста

Создайте тестовый класс в настроенной директории (например, `tests/CalculatorTest.php`):

```php
<?php

declare(strict_types=1);

namespace Tests;

use Testo\Assert;
use Testo\Attribute\Test;
use Testo\Attribute\RetryPolicy;
use Testo\Attribute\ExpectException;

final class CalculatorTest
{
    #[Test]
    public function dividesNumbers(): void
    {
        $result = 10 / 2;

        Assert::same(5.0, $result);
        Assert::notSame(5, $result); // Типы важны!
    }

    #[Test]
    #[RetryPolicy(maxAttempts: 3)]
    public function flakyApiCall(): void
    {
        // Повторяет до 3 раз при падении теста
        $response = $this->makeExternalApiCall();

        Assert::same(200, $response->status);
    }

    #[Test]
    #[ExpectException(\RuntimeException::class)]
    public function throwsException(): void
    {
        throw new \RuntimeException('Expected error');
    }
}
```

### Ключевые моменты

- Используйте атрибут `#[Test]` для пометки тестовых методов
- Тестовые классы не обязаны наследоваться от базового класса
- Используйте класс `Assert` для утверждений (`same`, `true`, `false`, `null`, `contains`, `instanceOf` и т.д.)
- Testo предоставляет множество атрибутов для расширения возможностей тестирования (политики повторов, обработка исключений и другое)

## Запуск тестов

Чтобы запустить тесты, выполните:

```bash
vendor/bin/testo
```

Вы увидите вывод с результатами тестов и детальной информацией о пройденных и упавших тестах.

## Поддержка IDE

Для PhpStorm и IntelliJ IDEA существует официальный [плагин IDEA](https://plugins.jetbrains.com/plugin/28842-testo).

Плагин предоставляет:
- Запуск тестов прямо из IDE
- Навигацию между тестом и реализацией
- Визуализацию результатов тестов
- Поддержку отладки

## Следующие шаги

- Изучите [опции CLI](/ru/docs/cli-reference) для фильтрации и запуска тестов
- Исследуйте [систему событий](/ru/docs/events) для расширения поведения тестов
- Узнайте о возможностях [фильтрации тестов](/ru/docs/filtering)
- Попробуйте [модуль Sample](/ru/docs/sample-module) для параметризованного тестирования с провайдерами данных
