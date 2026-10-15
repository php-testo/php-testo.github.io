---
outline: [2, 3]
---

# Laravel (Laratesto)

[Laratesto](https://github.com/ichinya/laratesto) поднимает Laravel-приложение для каждого теста Testo. Бридж даёт доступ к HTTP, базе данных, авторизации, сессиям, фасадам и Artisan — тесты работают с самим Laravel и проверяют поведение приложения.

Это **сторонний пакет, который поддерживает [ichinya](https://github.com/ichinya)**. Он называется [`ichinya/laratesto`](https://packagist.org/packages/ichinya/laratesto) в Composer и выпускается в собственном репозитории.

<plugin-info class="\Laratesto\LaravelPlugin" name="Laravel" github="https://github.com/ichinya/laratesto" />

## Установка

Начните в корне настроенного приложения на Laravel 13. Нужны PHP 8.3+ и Testo `^0.10.56`; текущая матрица совместимости бриджа охватывает PHP 8.3–8.5. В этом руководстве используются Laratesto 0.8.2 и отдельный пакет мигратора 0.2.1.

```bash
composer require --dev ichinya/laratesto:^0.8.2
```

Composer установит Testo как зависимость. **Для runtime не нужен `phpunit/phpunit`.** Существующие тесты PHPUnit или Pest могут продолжать работать со своим раннером, пока вы переходите на Testo. Для примеров выделим каталог `tests/Testo`, чтобы новый suite не подхватил старые тесты.

## Быстрый старт

### Настройка suite

Создайте `testo.php` в корне приложения. Если конфигурация уже есть, добавьте в неё этот suite:

```php
<?php

declare(strict_types=1);

use Laratesto\Config\LaravelConfig;
use Laratesto\LaravelPlugin;
use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Laravel',
            location: ['tests/Testo'],
            plugins: [
                new LaravelPlugin(new LaravelConfig(
                    basePath: __DIR__,
                    environment: 'testing',
                    config: [
                        'database.default' => 'sqlite',
                        'database.connections.sqlite.database' => ':memory:',
                        'cache.default' => 'array',
                        'session.driver' => 'array',
                    ],
                )),
            ],
        ),
    ],
);
```

`basePath` указывает на корень приложения с файлом `bootstrap/app.php`. Бридж задаёт `APP_ENV` до загрузки приложения, поэтому Laravel может прочитать `.env.testing`. Значения из `config` применяются после bootstrap; настройки, которые нужны service provider во время загрузки, задавайте в тестовом окружении.

Для примера с базой ниже нужен PDO SQLite. Используйте отдельную тестовую базу: атрибуты работы с БД могут запускать миграции и очищать таблицы.

### HTTP-тест

Добавьте JSON-маршрут в `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/laratesto/ping', static fn() => response()->json(['message' => 'pong']));
```

Создайте `tests/Testo/HttpTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Testo;

use Laratesto\Testing\LaravelTestCase;
use Testo\Test;

final class HttpTest extends LaravelTestCase
{
    #[Test]
    public function returnsJson(): void
    {
        $this->get('/laratesto/ping')
            ->assertOk()
            ->assertExactJson(['message' => 'pong']);
    }
}
```

Запустите тест из корня приложения:

```bash
php vendor/bin/testo run --suite=Laravel
```

Запрос проходит через HTTP kernel Laravel. Ответ оборачивается в <class>\Laratesto\Testing\LaravelResponse</class>, а результаты проверок попадают в Testo.

Ставьте <attr>\Testo\Test</attr> **на тестовые методы**, а не на весь Laravel-класс: иначе Testo обнаружит и публичные служебные методы бриджа. Если в suite уже принято называть тестовые методы `test*()`, явно подключите <plugin>Convention</plugin>.

### Трейт вместо базового класса

Если тест уже наследует базовый класс проекта, подключите <class>\Laratesto\Testing\InteractsWithLaravel</class>. Плагин <plugin>Laravel</plugin> в конфигурации suite всё равно нужен. Например, создайте `tests/Testo/ContainerTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Testo;

use Laratesto\Testing\InteractsWithLaravel;
use Testo\Assert;
use Testo\Test;

final class ContainerTest
{
    use InteractsWithLaravel;

    #[Test]
    public function usesTheTestingEnvironment(): void
    {
        Assert::same($this->app()->environment(), 'testing');
    }
}
```

## Жизненный цикл и возможности бриджа

Каждый тест получает свежее приложение. Подготовку, которой нужен Laravel, выполняйте в защищённом хуке <func>\Laratesto\Testing\InteractsWithLaravel::setUpLaravel()</func> после инъекции приложения; очистку с доступом к приложению — в <func>\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel()</func>. Затем бридж сбросит состояние Laravel. Testo может переиспользовать экземпляр тестового класса, поэтому поля для отдельного теста инициализируйте в setup, не рассчитывая на повторный вызов конструктора.

И базовый класс, и трейт предоставляют:

- HTTP- и JSON-запросы, проверки ответов, управление middleware и передачу cookies между запросами одного теста.
- Авторизацию, проверки сессии и базы данных.
- Контейнер сервисов, фасады и Laravel fakes. Встроенный слой совместимости позволяет использовать проверки фреймворка без PHPUnit; это не раннер PHPUnit и не полная реализация MockObject.
- Запуск Artisan-команд и проверки кода завершения и вывода.

Поддерживаемые методы и границы совместимости описаны в [README Laratesto](https://github.com/ichinya/laratesto#http-helpers). Выполняйте тесты приложения последовательно: из нативных Fiber-режимов поддерживается только Solo, без чередования тестов приложения.

## Изоляция базы данных

Используйте атрибуты бриджа из `Laratesto\Attribute` вместо PHPUnit-трейтов Laravel для работы с БД:

| Атрибут | Поведение |
|---------|-----------|
| <attr>\Laratesto\Attribute\RefreshDatabase</attr> | Подготавливает схему и откатывает транзакцию теста; поддерживает сидинг и выбор соединений. |
| <attr>\Laratesto\Attribute\DatabaseTransactions</attr> | Оборачивает тест в транзакцию; схема должна быть готова заранее. |
| <attr>\Laratesto\Attribute\DatabaseMigrations</attr> | Запускает миграции перед тестом и откатывает их после. |
| <attr>\Laratesto\Attribute\DatabaseTruncation</attr> | Выполняет миграции и очищает настроенные базы между тестами. |

Подготовка БД выполняется до <func>\Laratesto\Testing\InteractsWithLaravel::setUpLaravel()</func>, очистка — после <func>\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel()</func>. Если в приложении используются стандартные модель пользователя и миграция Laravel, добавьте `tests/Testo/DatabaseTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Testo;

use App\Models\User;
use Laratesto\Attribute\RefreshDatabase;
use Laratesto\Testing\LaravelTestCase;
use Testo\Test;

final class DatabaseTest extends LaravelTestCase
{
    #[Test]
    #[RefreshDatabase]
    public function persistsAUser(): void
    {
        $user = User::factory()->create();

        $this->assertDatabaseHas('users', ['id' => $user->getKey()]);
    }
}
```

## Миграция с PHPUnit

CLI миграции и Laravel-правила Rector находятся в отдельном пакете [`ichinya/laratesto-rector`](https://github.com/ichinya/laratesto-rector). Установите его рядом с runtime из Packagist — дополнительные репозитории и dev-ветки не нужны:

```bash
composer require --dev ichinya/laratesto-rector:^0.2.1
php artisan package:discover
```

Сначала закоммитьте исходники тестов. Просмотрите план миграции, затем примените изменения:

```bash
php artisan laratesto:migrate-rector
php artisan laratesto:migrate-rector --apply
git diff -- tests
```

По умолчанию обрабатывается каталог `tests`; для более узкой области можно несколько раз указать `--path`. Успешный dry-run не меняет исходники, но записывает `laratesto-residuals.json`. Код завершения `2` означает, что остались ручные доработки — residuals. Код `1` сообщает об ошибке проверки безопасности, конфигурации или обработки. Просмотрите маркеры и преобразованный код, затем запустите все мигрированные тесты. Сам по себе пустой отчёт не доказывает сохранение поведения.

Suite из быстрого старта сканирует только `tests/Testo`. До запуска Testo добавьте преобразованные feature-тесты в его `location`, сохранив отдельные unit suites там, где они нужны; иначе мигрированные тесты не выполнятся. Для стандартного скелета Laravel укажите `location: ['tests']`, чтобы проверить все преобразованные примеры в настроенном Laravel suite:

```bash
php vendor/bin/testo run --suite=Laravel
```

Мигратор переиспользует подходящие общие правила `testo/bridge-rector` и сохраняет проверки совместимости для Laravel. Параметры, residuals и поддерживаемые конструкции описаны в его [руководстве по миграции](https://github.com/ichinya/laratesto-rector/blob/main/MIGRATING.md). Старый встроенный конвертер `laratesto:migrate-phpunit` объявлен устаревшим.

## Необязательные Agent Skills

В Laratesto входят skills `laratesto-configure`, `laratesto-write-tests` и `laratesto-migrate-from-phpunit`. Они дополняют [инструкции Testo для агентов](../intro/ai-agents.md) и поставляются вместе с runtime; пакет миграции остаётся отдельной зависимостью.

Для синхронизации установите необязательный Composer-плагин [`llm/skills`](https://github.com/roxblnfk/skills). Разрешите его при запросе Composer, затем выберите каталог вашего агента и доверенные пакеты в инициализаторе:

```bash
composer require --dev llm/skills
composer skills:init
composer skills:update ichinya/laratesto testo/testo --no-discovery
```

Настройки `skills.json`, доверие, каталог назначения и auto-sync принадлежат вашему приложению. Установка одного Laratesto не включает плагин и не выбирает настройки агента. Ручное копирование и полный список описаны в [руководстве по skills Laratesto](https://github.com/ichinya/laratesto/tree/v0.8.2/skills).
