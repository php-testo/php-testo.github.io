---
outline: [2, 3]
llms: true
llms_description: "How to test Laravel applications with Testo through the third-party ichinya/laratesto package: register LaravelPlugin with LaravelConfig in a suite, write HTTP, database and Artisan tests with LaravelTestCase or the InteractsWithLaravel trait, prepare state in setUpLaravel(), isolate the database with #[RefreshDatabase], #[DatabaseTransactions], #[DatabaseMigrations] or #[DatabaseTruncation], and convert PHPUnit tests with the ichinya/laratesto-rector migrator."
---

# Laravel (Laratesto)

[Laratesto](https://packagist.org/packages/ichinya/laratesto) helps you test Laravel applications with Testo. It boots a fresh Laravel application for every test and brings the helpers you know from Laravel's own testing layer: HTTP requests, authentication, session and database assertions, facades with their fakes, and Artisan commands.

::: info Third-party package
Laratesto is developed and maintained by a third-party developer, [ichinya](https://github.com/ichinya). Report issues and follow releases in [its repository](https://github.com/ichinya/laratesto).
:::

<plugin-info class="\Laratesto\LaravelPlugin" name="Laravel" github="https://github.com/ichinya/laratesto" />

## Installation

Laratesto needs a Laravel 13 application and PHP 8.3 or newer. Run this in the application root:

```bash
composer require --dev ichinya/laratesto
```

Composer pulls in a compatible version of Testo along with it. You can move over step by step: existing PHPUnit or Pest tests keep running on their own runner.

## Setup

Register <class>\Laratesto\LaravelPlugin</class> in the `plugins` section of the Test Suite whose tests need a running Laravel application, usually feature tests. Unit tests are better kept in a separate suite without the plugin, so an application isn't booted for each of them. If Testo isn't configured in the project yet, start with [Getting Started](../intro/getting-started.md#configuration).

```php
use Laratesto\Config\LaravelConfig;
use Laratesto\LaravelPlugin;
use Testo\Application\Config\SuiteConfig;

new SuiteConfig(
    name: 'Laravel',
    location: ['tests/Feature'],
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
);
```

<signature h="3" name="new \Laratesto\Config\LaravelConfig(string $basePath, string $environment = 'testing', array $config = [])">
<short>Configures how Laratesto boots the Laravel application for each test.</short>
<param name="$basePath">The application root, the directory that contains `bootstrap/app.php`.</param>
<param name="$environment">Becomes `APP_ENV`. Laratesto sets it before the application boots, so Laravel loads `.env.testing` as usual.</param>
<param name="$config">Overrides configuration values. They are applied after the application has booted, so a service provider that reads a setting while booting won't see the override: put such settings in `.env.testing` instead.</param>
</signature>

::: warning Use a throwaway database
The database attributes described below run migrations and truncate tables. Point tests at a database you don't mind losing, like the in-memory SQLite from the example (it needs the PDO SQLite extension).
:::

## Writing tests

### Extending the base class

The easiest way to start is to extend <class>\Laratesto\Testing\LaravelTestCase</class>. Let's add a JSON route to `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/laratesto/ping', static fn() => response()->json(['message' => 'pong']));
```

And a test for it in `tests/Feature/HttpTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use Laratesto\Testing\LaravelTestCase;
use Testo\Test;

#[Test]
final class HttpTest extends LaravelTestCase
{
    public function returnsJson(): void
    {
        $this->get('/laratesto/ping')
            ->assertOk()
            ->assertExactJson(['message' => 'pong']);
    }
}
```

When the test runs, the request goes through Laravel's real HTTP kernel, without a web server. The response comes back as <class>\Laratesto\Testing\LaravelResponse</class>: its assertions look just like Laravel's, but they report to Testo.

### Using the trait

If your tests already extend a base class of your own, use the <class>\Laratesto\Testing\InteractsWithLaravel</class> trait instead: it gives a class the same helpers. The suite still needs the <plugin>Laravel</plugin> plugin. For example, `tests/Feature/ContainerTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use Laratesto\Testing\InteractsWithLaravel;
use Testo\Assert;
use Testo\Test;

#[Test]
final class ContainerTest
{
    use InteractsWithLaravel;

    public function usesTheTestingEnvironment(): void
    {
        Assert::same($this->app()->environment(), 'testing');
    }
}
```

### Available helpers

The base class and the trait provide the same set of protected helpers:

- HTTP requests (`get()`, `postJson()` and others), custom headers, bearer tokens and the option to disable middleware. Cookies from a response are sent with the next request in the same test, just like in a browser.
- Authentication (`actingAs()`, `assertAuthenticated()`), the session, and database assertions (`assertDatabaseHas()`, `assertModelExists()` and others).
- The service container, facades and their fakes (`Queue::fake()`, `Event::fake()`).
- Running Artisan commands and checking their exit code and output.

Laravel's fakes check their expectations through PHPUnit assertions. Laratesto ships a small stand-in for those classes, so the fakes work without PHPUnit installed. It isn't a full PHPUnit replacement, though: there's no `createMock()`, for example. For mocks, use <plugin>Mockery</plugin>. The full list of helpers and their limitations is in the [Laratesto README](https://github.com/ichinya/laratesto#http-helpers).

## Application lifecycle

Every test gets a new application instance. Setup that needs the application (the container, configuration, facades) goes into the <func>\Laratesto\Testing\InteractsWithLaravel::setUpLaravel()</func> hook, and cleanup that still needs it goes into <func>\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel()</func>. Here's the order of a single test:

1. Laratesto boots the application and passes it to the test.
2. If the test has a database attribute, the database is prepared.
3. `setUpLaravel()` runs.
4. The test itself runs.
5. `tearDownLaravel()` runs.
6. The database transaction or migrations are rolled back, and Laratesto resets Laravel's state.

<signature compact name="\Laratesto\Testing\InteractsWithLaravel::setUpLaravel(): void">
<short>Protected hook called before each test, once the application is ready and the database is prepared.</short>
</signature>

<signature compact name="\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel(): void">
<short>Protected hook called after each test, while the application is still available.</short>
</signature>

Keep in mind that Testo creates one instance of a test class and reuses it for all its tests (see <plugin>Lifecycle</plugin>). The constructor runs only once, so reset per-test properties in `setUpLaravel()`.

::: warning One test at a time
Laravel keeps a lot of global state, so application tests must run strictly one after another. If you use <attr>\Testo\Fiber\RunInFiber</attr>, keep the default <enum>\Testo\Fiber\Schedule::Solo</enum>: with <enum>\Testo\Fiber\Schedule::RoundRobin</enum> or <enum>\Testo\Fiber\Schedule::Random</enum> on a class, tests would interleave, so Laratesto stops them with an error.
:::

## Database isolation

Laravel's `RefreshDatabase` and similar traits are built for PHPUnit. With Laratesto, use attributes with the same names from the `Laratesto\Attribute` namespace instead. You can put any of them on a test method or on the whole class.

For a standard Laravel application with the default `User` model and its migration, a database test looks like this (`tests/Feature/DatabaseTest.php`):

```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Laratesto\Attribute\RefreshDatabase;
use Laratesto\Testing\LaravelTestCase;
use Testo\Test;

#[Test]
final class DatabaseTest extends LaravelTestCase
{
    #[RefreshDatabase]
    public function persistsAUser(): void
    {
        $user = User::factory()->create();

        $this->assertDatabaseHas('users', ['id' => $user->getKey()]);
    }
}
```

<signature h="3" name="#[\Laratesto\Attribute\RefreshDatabase(bool $seed = false, ?string $seeder = null, bool $dropViews = false, bool $dropTypes = false, ?array $connections = null)]">
<short>Migrates the database once, then wraps each test in a transaction that is rolled back.</short>
<description>

The fastest option for most applications. `migrate:fresh` runs once per process (and again if the schema disappears), then every test runs inside a transaction that is rolled back afterward.

</description>
</signature>

<signature h="3" name="#[\Laratesto\Attribute\DatabaseTransactions(?array $connections = null)]">
<short>Wraps each test in a transaction that is rolled back, without running migrations.</short>
<description>

Use it when the schema is already in place, for example when it is created outside the tests.

</description>
</signature>

<signature h="3" name="#[\Laratesto\Attribute\DatabaseMigrations(bool $seed = false, ?string $seeder = null, bool $dropViews = false, bool $dropTypes = false)]">
<short>Runs `migrate:fresh` before each test and rolls the migrations back after it.</short>
<description>

The slowest option, but every test starts with a freshly built schema.

</description>
</signature>

<signature h="3" name="#[\Laratesto\Attribute\DatabaseTruncation(bool $seed = false, ?string $seeder = null, bool $dropViews = false, bool $dropTypes = false, ?array $connections = null, ?array $tables = null, ?array $exceptTables = null)]">
<short>Truncates tables before each test.</short>
<description>

Useful when the code under test can't run inside a transaction. The first time, the database is migrated with `migrate:fresh`; after that, the tables are truncated before each test and, if requested, seeded again. Nothing is cleaned up after the test.

</description>
</signature>

::: tip Seeding inside a test
`$this->seed()` from Laravel's `TestCase` isn't available. Use the attribute's `seed` / `seeder` parameters, or call `Artisan::call('db:seed', ['--force' => true])` in the test.
:::

## Migrating from PHPUnit

Laratesto has a companion package, [`ichinya/laratesto-rector`](https://github.com/ichinya/laratesto-rector), that converts existing Laravel PHPUnit tests to Testo. It is built on Rector and reuses the generic rules of the [Rector integration](./rector.md), adding Laravel-specific ones on top: for example, it turns the `RefreshDatabase` trait into the attribute of the same name and puts <attr>\Testo\Test</attr> on test methods.

```bash
composer require --dev ichinya/laratesto-rector
```

Commit your tests before migrating: the migrator refuses to apply changes to files with uncommitted edits. Then run it twice, first to preview and then to apply:

```bash
php artisan laratesto:migrate-rector          # preview: files stay untouched
php artisan laratesto:migrate-rector --apply  # rewrite the tests
git diff -- tests
```

By default, the command processes the `tests` directory; to narrow it down, pass one or more `--path` options. Some constructs can't be converted safely, for example a database trait with non-trivial configuration. The migrator leaves such spots as they are, marks them with a `laratesto-residual` comment and lists them in `laratesto-residuals.json`. Fix them by hand, review the diff and run the tests. An empty report doesn't guarantee the tests behave exactly as before, so running them is the real check.

The command's exit code tells you how it went: `2` means some spots need manual work, and `1` means the migration failed.

The full list of options and supported constructs is in the migrator's [migration guide](https://github.com/ichinya/laratesto-rector/blob/main/MIGRATING.md).

## Skills for AI agents

Laratesto ships skills for AI agents. They are installed the same way as Testo's, through [`llm/skills`](../intro/ai-agents.md#skills-for-agents).
