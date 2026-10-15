---
outline: [2, 3]
---

# Laravel (Laratesto)

[Laratesto](https://github.com/ichinya/laratesto) позволяет тестировать Laravel-приложения на Testo. Пакет поднимает новое приложение для каждого теста и даёт знакомые по тестам Laravel хелперы: HTTP-запросы, проверки аутентификации, сессии и базы данных, фасады с их фейками и Artisan-команды.

::: info Сторонний пакет
Laratesto разрабатывает [ichinya](https://github.com/ichinya), а не команда Testo. Пакет опубликован на Packagist как [`ichinya/laratesto`](https://packagist.org/packages/ichinya/laratesto). Сообщать об ошибках и следить за релизами можно в [его репозитории](https://github.com/ichinya/laratesto).
:::

<plugin-info class="\Laratesto\LaravelPlugin" name="Laravel" github="https://github.com/ichinya/laratesto" />

## Установка

Для Laratesto нужны приложение на Laravel 13 и PHP 8.3 или новее. Выполните в корне приложения:

```bash
composer require --dev ichinya/laratesto
```

Подходящую версию Testo Composer установит вместе с пакетом. PHPUnit для Laratesto не нужен, поэтому существующие тесты на PHPUnit или Pest могут работать со своим раннером, пока вы постепенно переходите на Testo.

## Настройка {#setup}

Создайте `testo.php` в корне приложения или добавьте Test Suite в уже существующий конфиг. В примере тесты Testo лежат в отдельном каталоге `tests/Testo`, чтобы новый Test Suite не подхватил старые тесты:

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

У <class>\Laratesto\Config\LaravelConfig</class> три параметра:

- `basePath` — корень приложения, то есть каталог с `bootstrap/app.php`.
- `environment` становится значением `APP_ENV`. Laratesto выставляет его до загрузки приложения, так что Laravel, как обычно, прочитает `.env.testing`.
- `config` переопределяет значения конфигурации. Они применяются уже после загрузки приложения, и сервис-провайдер, который читает настройку во время загрузки, их не увидит. Такие настройки задавайте в `.env.testing`.

::: warning Не используйте рабочую базу
Атрибуты для работы с БД, о которых речь пойдёт ниже, запускают миграции и очищают таблицы. Подключайте тесты к базе, которую не страшно потерять, например к SQLite в памяти, как в примере (для неё нужно расширение PDO SQLite).
:::

## Пишем тесты

### Наследование от базового класса

Проще всего начать с наследования от <class>\Laratesto\Testing\LaravelTestCase</class>. Добавим JSON-маршрут в `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/laratesto/ping', static fn() => response()->json(['message' => 'pong']));
```

И тест для него в `tests/Testo/HttpTest.php`:

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

Запустите Test Suite из корня приложения:

```bash
vendor/bin/testo run --suite=Laravel
```

Запрос проходит через настоящее HTTP-ядро Laravel, веб-сервер для этого не нужен. В ответ приходит <class>\Laratesto\Testing\LaravelResponse</class>: его проверки выглядят так же, как в Laravel, но засчитываются в Testo.

::: warning Помечайте методы, а не класс
Ставьте <attr>\Testo\Test</attr> на каждый тестовый метод. Если поставить атрибут на класс, тестами станут все его публичные методы, включая служебные методы, унаследованные от базового класса. Если вам привычнее называть тесты `test*()`, подключите к Test Suite плагин <plugin>Convention</plugin>.
:::

### Трейт вместо базового класса

Если ваши тесты уже наследуют собственный базовый класс, подключите трейт <class>\Laratesto\Testing\InteractsWithLaravel</class>: он даёт классу те же хелперы. Плагин <plugin>Laravel</plugin> в Test Suite нужен и в этом случае. Например, `tests/Testo/ContainerTest.php`:

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

### Что есть под рукой

Базовый класс и трейт дают одинаковый набор защищённых хелперов:

- HTTP-запросы (`get()`, `postJson()` и другие), свои заголовки, bearer-токены и отключение middleware. Cookies из ответа уходят со следующим запросом того же теста, как в браузере.
- Аутентификация (`actingAs()`, `assertAuthenticated()`), сессия и проверки базы данных (`assertDatabaseHas()`, `assertModelExists()` и другие).
- Сервис-контейнер, фасады и их фейки (`Queue::fake()`, `Event::fake()`).
- Запуск Artisan-команд с проверкой кода выхода и вывода.

Фейки Laravel проверяют ожидания через ассерты PHPUnit. Laratesto содержит небольшую замену этих классов, поэтому фейки работают и без установленного PHPUnit. Полноценным PHPUnit она при этом не является: например, `createMock()` в ней нет, а для моков стоит взять <plugin>Mockery</plugin>. Полный список хелперов и их ограничения описаны в [README Laratesto](https://github.com/ichinya/laratesto#http-helpers).

## Жизненный цикл приложения

Каждый тест получает новый экземпляр приложения. Если для подготовки теста нужно само приложение (контейнер, конфигурация, фасады), вынесите её в хук <func>\Laratesto\Testing\InteractsWithLaravel::setUpLaravel()</func>. Очистку, которой тоже нужно приложение, поместите в <func>\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel()</func>. Один тест проходит так:

1. Laratesto загружает приложение и передаёт его в тест.
2. Если у теста есть атрибут для БД, база подготавливается.
3. Вызывается `setUpLaravel()`.
4. Выполняется сам тест.
5. Вызывается `tearDownLaravel()`.
6. Транзакция или миграции откатываются, и Laratesto сбрасывает состояние Laravel.

<signature compact name="\Laratesto\Testing\InteractsWithLaravel::setUpLaravel(): void">
<short>Защищённый хук перед каждым тестом: приложение уже загружено, база подготовлена.</short>
</signature>

<signature compact name="\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel(): void">
<short>Защищённый хук после каждого теста, пока приложение ещё доступно.</short>
</signature>

Учтите, что Testo создаёт один экземпляр тестового класса и использует его для всех тестов этого класса (подробнее в <plugin>Lifecycle</plugin>). Конструктор вызывается только один раз, поэтому свойства, которые нужны каждому тесту заново, сбрасывайте в `setUpLaravel()`.

::: warning По одному тесту за раз
Laravel хранит много глобального состояния, поэтому тесты приложения должны выполняться строго друг за другом. Если вы используете <attr>\Testo\Fiber\RunInFiber</attr>, оставьте режим по умолчанию <enum>\Testo\Fiber\Schedule::Solo</enum>. С режимами <enum>\Testo\Fiber\Schedule::RoundRobin</enum> и <enum>\Testo\Fiber\Schedule::Random</enum> тесты класса чередовались бы, поэтому Laratesto завершит их с ошибкой.
:::

## Изоляция базы данных

Трейты Laravel вроде `RefreshDatabase` рассчитаны на PHPUnit. С Laratesto вместо них используются одноимённые атрибуты из пространства имён `Laratesto\Attribute`. Любой из них можно поставить как на тестовый метод, так и на весь класс.

Если в приложении остались стандартная модель `User` и её миграция, тест с базой выглядит так (`tests/Testo/DatabaseTest.php`):

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

<signature h="3" name="#[\Laratesto\Attribute\RefreshDatabase(bool $seed = false, ?string $seeder = null, bool $dropViews = false, bool $dropTypes = false, ?array $connections = null)]">
<short>Один раз накатывает миграции, а каждый тест оборачивает в транзакцию с откатом.</short>
<description>

Самый быстрый вариант для большинства приложений. `migrate:fresh` выполняется один раз за процесс (и повторно, если схема пропала), а дальше каждый тест работает внутри транзакции, которая после него откатывается.

</description>
</signature>

<signature h="3" name="#[\Laratesto\Attribute\DatabaseTransactions(?array $connections = null)]">
<short>Оборачивает каждый тест в транзакцию с откатом, миграции не запускает.</short>
<description>

Подходит, когда схема уже готова, например если её создают вне тестов.

</description>
</signature>

<signature h="3" name="#[\Laratesto\Attribute\DatabaseMigrations(bool $seed = false, ?string $seeder = null, bool $dropViews = false, bool $dropTypes = false)]">
<short>Выполняет `migrate:fresh` перед каждым тестом и откатывает миграции после него.</short>
<description>

Самый медленный вариант, зато каждый тест начинается с заново построенной схемы.

</description>
</signature>

<signature h="3" name="#[\Laratesto\Attribute\DatabaseTruncation(bool $seed = false, ?string $seeder = null, bool $dropViews = false, bool $dropTypes = false, ?array $connections = null, ?array $tables = null, ?array $exceptTables = null)]">
<short>Очищает таблицы перед каждым тестом.</short>
<description>

Пригодится, если тестируемый код не может работать внутри транзакции. В первый раз база создаётся через `migrate:fresh`, а дальше перед каждым тестом таблицы очищаются и при необходимости заново заполняются сидерами. После теста ничего не убирается.

</description>
</signature>

::: tip Сидеры внутри теста
Метода `$this->seed()` из `TestCase` Laravel здесь нет. Используйте параметры атрибута `seed` и `seeder` или вызовите в тесте `Artisan::call('db:seed', ['--force' => true])`.
:::

## Миграция с PHPUnit

У Laratesto есть отдельный пакет [`ichinya/laratesto-rector`](https://github.com/ichinya/laratesto-rector), который переводит существующие тесты Laravel с PHPUnit на Testo. Он построен на Rector и использует общие правила [интеграции с Rector](./rector.md), добавляя к ним правила для Laravel. Например, он заменяет трейт `RefreshDatabase` одноимённым атрибутом и ставит <attr>\Testo\Test</attr> на тестовые методы.

```bash
composer require --dev ichinya/laratesto-rector
```

Перед миграцией закоммитьте тесты: если в файлах есть незакоммиченные правки, мигратор откажется их менять. Затем запустите его дважды: сначала для предпросмотра, потом чтобы применить изменения.

```bash
php artisan laratesto:migrate-rector          # предпросмотр: файлы не меняются
php artisan laratesto:migrate-rector --apply  # переписать тесты
git diff -- tests
```

По умолчанию команда обрабатывает каталог `tests`. Чтобы сузить область, укажите один или несколько параметров `--path`. Некоторые конструкции безопасно преобразовать нельзя, например трейт БД с нестандартной настройкой. Такие места мигратор оставляет как есть, помечает комментарием `laratesto-residual` и перечисляет в отчёте `laratesto-residuals.json`. Поправьте их вручную, просмотрите diff и запустите тесты. Пустой отчёт ещё не гарантирует, что тесты ведут себя как раньше, так что настоящая проверка — их запуск.

Код выхода команды показывает результат: `2` — часть мест нужно доработать вручную, `1` — миграция не удалась.

Test Suite из раздела [Настройка](#setup) ищет тесты только в `tests/Testo` и преобразованных тестов не увидит. Добавьте их каталог в `location`: в стандартном скелете Laravel тесты приложения лежат в `tests/Feature`. Unit-тесты, которым приложение не нужно, лучше вынести в отдельный Test Suite без плагина <plugin>Laravel</plugin>, чтобы приложение не поднималось ради каждого из них.

Полный список параметров и поддерживаемых конструкций есть в [руководстве по миграции](https://github.com/ichinya/laratesto-rector/blob/main/MIGRATING.md).

## Скиллы для AI-агентов

В Laratesto есть скиллы для AI-агентов. Устанавливаются они так же, как скиллы Testo, через [`llm/skills`](../intro/ai-agents.md#скиллы-для-агентов).
