---
outline: [2, 3]
llms: true
llms_description: "How to test Laravel 13 applications with the third-party ichinya/laratesto bridge. Configure LaravelPlugin and LaravelConfig, write HTTP and database tests with LaravelTestCase or InteractsWithLaravel, migrate PHPUnit tests with the separate ichinya/laratesto-rector package, and install optional Agent Skills."
---

# Laravel (Laratesto)

[Laratesto](https://github.com/ichinya/laratesto) boots a Laravel application around each Testo test. It provides HTTP, database, authentication, session, facade and Artisan helpers, so you can test application behavior through Laravel itself.

The bridge is a **third-party package maintained by [ichinya](https://github.com/ichinya)**. Its Composer name is [`ichinya/laratesto`](https://packagist.org/packages/ichinya/laratesto); it has its own repository and releases.

<plugin-info class="\Laratesto\LaravelPlugin" name="Laravel" github="https://github.com/ichinya/laratesto" />

## Installation

Start in the root of a configured Laravel 13 application. The bridge requires PHP 8.3+ and Testo `^0.10.56`; its current compatibility matrix covers PHP 8.3–8.5. This guide uses Laratesto 0.8.2 and the separately released migrator 0.2.1.

```bash
composer require --dev ichinya/laratesto:^0.8.2
```

Composer installs Testo as a dependency. **The runtime does not require `phpunit/phpunit`.** Existing PHPUnit or Pest suites can keep their own runner while you adopt Testo. The quick start uses a separate `tests/Testo` directory so it does not discover those suites.

## Quick start

### Configure the suite

Create `testo.php` in the application root. If it already exists, add this suite to its configuration:

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

`basePath` points to the application root containing `bootstrap/app.php`. The bridge sets `APP_ENV` before bootstrap, so Laravel can load `.env.testing`. The `config` overrides apply after bootstrap; settings needed by a service provider during bootstrap belong in the testing environment instead.

The database example below needs PDO SQLite. Use a disposable test database: database attributes can run migrations or truncate tables.

### Write an HTTP test

Add a JSON route to `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/laratesto/ping', static fn() => response()->json(['message' => 'pong']));
```

Create `tests/Testo/HttpTest.php`:

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

Run it from the application root:

```bash
php vendor/bin/testo run --suite=Laravel
```

The request passes through Laravel's HTTP kernel. The bridge returns <class>\Laratesto\Testing\LaravelResponse</class>, whose assertions report to Testo.

Put <attr>\Testo\Test</attr> on **test methods**, not on the whole Laravel test class: class-level discovery would also select public bridge helpers. If your suite uses `test*()` method names instead, add <plugin>Convention</plugin> explicitly.

### Use a trait instead of a base class

When a test already has a project-specific base class, use <class>\Laratesto\Testing\InteractsWithLaravel</class>. The suite still needs <plugin>Laravel</plugin>. For example, `tests/Testo/ContainerTest.php` can contain:

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

## Application lifecycle and helpers

Each test gets a fresh application. Application-dependent setup belongs in the protected <func>\Laratesto\Testing\InteractsWithLaravel::setUpLaravel()</func> hook, after injection; cleanup that needs the application belongs in <func>\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel()</func>. The bridge then clears Laravel state. Testo can reuse the test class instance, so initialize per-test fields in setup rather than relying on a new constructor call.

Both the base class and the trait provide:

- HTTP and JSON requests, response assertions, middleware controls, and cookies carried between requests within one test.
- Authentication, session and database assertions.
- Access to the service container, facades and Laravel fakes. A bundled compatibility shim supports framework assertions without installing PHPUnit; it is not a PHPUnit runner or a complete MockObject implementation.
- Artisan command execution and assertions on exit codes and output.

See the [Laratesto README](https://github.com/ichinya/laratesto#http-helpers) for supported methods and compatibility boundaries. Use sequential application tests; only native Fiber Solo scheduling is supported, not interleaving application tests.

## Database isolation

Use the bridge's attributes from `Laratesto\Attribute`, rather than Laravel's PHPUnit database traits:

| Attribute | Behavior |
|-----------|----------|
| <attr>\Laratesto\Attribute\RefreshDatabase</attr> | Prepares the schema, then rolls the test's transaction back; supports seeding and selected connections. |
| <attr>\Laratesto\Attribute\DatabaseTransactions</attr> | Wraps the test in a transaction; the schema must already exist. |
| <attr>\Laratesto\Attribute\DatabaseMigrations</attr> | Runs migrations before the test and rolls migrations back afterwards. |
| <attr>\Laratesto\Attribute\DatabaseTruncation</attr> | Migrates and truncates the configured databases between tests. |

Database preparation runs before <func>\Laratesto\Testing\InteractsWithLaravel::setUpLaravel()</func>; database cleanup runs after <func>\Laratesto\Testing\InteractsWithLaravel::tearDownLaravel()</func>. For a standard Laravel application's user model and migration, add `tests/Testo/DatabaseTest.php`:

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

## Migrate PHPUnit tests

The migration CLI and Laravel-specific Rector rules live in the separate [`ichinya/laratesto-rector`](https://github.com/ichinya/laratesto-rector) package. Install it alongside the runtime from Packagist; no custom repository or development branch is needed:

```bash
composer require --dev ichinya/laratesto-rector:^0.2.1
php artisan package:discover
```

Commit the test sources first. Preview the migration, review the result, then apply it:

```bash
php artisan laratesto:migrate-rector
php artisan laratesto:migrate-rector --apply
git diff -- tests
```

The default scope is `tests`; repeat `--path` to choose narrower inputs. A successful dry-run preserves source files but writes `laratesto-residuals.json`. Exit `2` means manual residuals remain; exit `1` means a safety, configuration or processing failure. Review residual markers and converted code, then run every converted test. An empty report alone does not prove behavioral equivalence.

The quick-start suite only scans `tests/Testo`. Add converted feature-test paths to its `location` and keep separate unit suites as needed before running Testo; otherwise those migrated tests will not execute. For the default Laravel skeleton, use `location: ['tests']` to verify all converted examples with the configured Laravel suite:

```bash
php vendor/bin/testo run --suite=Laravel
```

The migrator reuses suitable generic rules from `testo/bridge-rector` and retains Laravel-specific compatibility guards. See its [migration guide](https://github.com/ichinya/laratesto-rector/blob/main/MIGRATING.md) for options, residuals and supported constructs. The older built-in `laratesto:migrate-phpunit` converter is deprecated.

## Optional Agent Skills

Laratesto ships `laratesto-configure`, `laratesto-write-tests` and `laratesto-migrate-from-phpunit` skills. They complement [Testo's agent guidance](../intro/ai-agents.md) and are included in the runtime distribution; the migration package remains a separate dependency.

To synchronize them, install the optional [`llm/skills`](https://github.com/roxblnfk/skills) Composer plugin. Allow it when Composer asks, then choose your agent's target directory and trusted packages in the initializer:

```bash
composer require --dev llm/skills
composer skills:init
composer skills:update ichinya/laratesto testo/testo --no-discovery
```

Your application owns `skills.json`, trust, target and auto-sync choices. Installing Laratesto alone does not enable the plugin or choose agent settings. For manual copying and the full skill list, see [Laratesto's skills guide](https://github.com/ichinya/laratesto/tree/v0.8.2/skills).
