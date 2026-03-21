# Configuration

By default, if no configuration file is provided, Testo will run tests from the `tests` folder with the default plugin set.

To configure Testo, create a `testo.php` file in the root of your project. The file must return an <class>\Testo\Application\Config\ApplicationConfig</class> instance:

```php
<?php

declare(strict_types=1);

use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: ['tests/Unit'],
        ),
        new SuiteConfig(
            name: 'Feature',
            location: ['tests/Feature'],
        ),
    ],
);
```

## ApplicationConfig

The root configuration object:

- `suites` — array of Test Suites. Must contain at least one element — an empty array will cause an error.
- `plugins` — application-level plugins. Loaded before Test Suites and act globally (see [Plugins](#plugins) section).

All parameters and their default values are described in the class itself — your IDE will show hints.

## SuiteConfig

Configuration for a single Test Suite: name, test location, and plugin set.

```php
// Simple form — array
new SuiteConfig(
    name: 'Unit',
    location: ['tests/Unit'],
    plugins: [new NamingConventionPlugin()],
),

// With customization — FinderConfig and SuitePlugins
new SuiteConfig(
    name: 'Unit',
    location: new FinderConfig(
        include: ['tests/Unit'],
        exclude: ['tests/Unit/Stubs'],
    ),
    plugins: SuitePlugins::without(BenchmarkPlugin::class),
),
```

::: info
Arrays in `location` and `plugins` are shorthands for `new FinderConfig(include: ...)` and `SuitePlugins::with(...)`. For more flexible configuration, use <class>\Testo\Application\Config\FinderConfig</class> and <class>\Testo\Application\Config\Plugin\SuitePlugins</class> directly.
:::

::: question Can I disable application-level plugins for a specific Test Suite?
No, application-level plugins are loaded before Test Suites and act globally.
:::

## FinderConfig

Defines the file search scope — which directories and files to include or exclude. Paths are relative to the project root. Glob patterns and regular expressions are not supported.

```php
new FinderConfig(
    include: ['tests'],
    exclude: ['tests/Fixtures', 'tests/Stubs'],
)
```

## Plugins

Testo is built on [plugins](plugins.md) — they define how tests are discovered, executed, and processed. Plugins are registered at two levels:

- **Application level** (`ApplicationConfig::$plugins`) — act globally across all Test Suites
- **Test Suite level** (`SuiteConfig::$plugins`) — act only within a specific Test Suite

If the `plugins` array is not specified, Testo uses the default plugin set.

::: question Which application plugins are enabled by default?
You can check the default plugin list in the <class>\Testo\Application\Config\Plugin\ApplicationPlugins</class> class.

Currently:
- [Filter](plugins/filter.md)
- **Terminal** and **Teamcity** depending on the `--teamcity` flag
:::

::: question Which Test Suite plugins are enabled by default?
You can check the default plugin list in the <class>\Testo\Application\Config\Plugin\SuitePlugins</class> class.

Currently:
- [Assert](plugins/assert.md)
- [Bench](plugins/bench.md)
- [Inline](plugins/inline.md)
- [Lifecycle](plugins/lifecycle.md)
- [Test](plugins/test.md)
:::

### Managing Plugins

Use the <class>\Testo\Application\Config\Plugin\SuitePlugins</class> and <class>\Testo\Application\Config\Plugin\ApplicationPlugins</class> facades to configure plugins (identical API):

::: code-group
```php [with()]
// Add NamingConventionPlugin to the default plugins
// Other Test Suite plugins are preserved
new SuiteConfig(
    plugins: SuitePlugins::with(
        new NamingConventionPlugin(),
    ),
)
```
```php [without()]
// Remove BenchmarkPlugin from the default set
// Other Test Suite plugins are preserved
new SuiteConfig(
    plugins: SuitePlugins::without(
        BenchmarkPlugin::class,
    ),
)
```
```php [only()]
// Only LifecyclePlugin — all others are disabled
// Completely replaces the default set
new SuiteConfig(
    plugins: SuitePlugins::only(
        new LifecyclePlugin(),
    ),
)
```
```php [Chaining]
// Add one plugin and remove another
// Methods can be chained together
new SuiteConfig(
    plugins: SuitePlugins::with(new NamingConventionPlugin())
        ->without(BenchmarkPlugin::class),
)
```
:::

## Monorepo

Since `suites` is a regular PHP array, configurations can be assembled from multiple modules. Each module has its own `testo.php` that works standalone and as a Test Suite source for the root config:

```php
// modules/billing/testo.php — works standalone
return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Billing',
            location: ['tests'],
        ),
    ],
);
```

```php
// testo.php — root config assembles Test Suites from modules
return new ApplicationConfig(
    suites: array_merge(
        (require 'modules/billing/testo.php')->suites,
        (require 'modules/shipping/testo.php')->suites,
    ),
);
```

Each module manages its own test configuration independently, while the root config runs everything together.