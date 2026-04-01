---
faqLevel: 2
outline: [2, 3]
llms: true
llms_description: "How to extend Testo with plugins. PluginConfigurator interface with three extension points: interceptors (InterceptorCollector), event listeners (EventListenerCollector, PSR-14), and container bindings (bind/set/make/get). Container scopes per Test Suite. Full examples: failure logger plugin, GitHub PR flaky reporter. Plugins without configurator via FallbackInterceptor."
---

# Plugins

A plugin in Testo is an independent module responsible for a specific framework feature. Test discovery, assertions (<plugin>Assert</plugin>), lifecycle hooks (<plugin>Lifecycle</plugin>), benchmarks (<plugin>Bench</plugin>), filtering (<plugin>Filter</plugin>) — these are all separate plugins. The more plugins you enable, the more capabilities you get. Any of them can be disabled, replaced, or extended with your own.

A plugin can consist of a configurator, interceptors, attributes, event listeners — in any combination. For example, the <plugin>Assert</plugin> plugin uses a configurator to register interceptors, while <plugin>Retry</plugin> has no configurator and works entirely through an attribute or interceptor.

## Plugin configurator

A configurator is a class implementing the <class>\Testo\Common\PluginConfigurator</class> interface:

```php
interface PluginConfigurator
{
    public function configure(Container $container): void;
}
```

When a plugin is loaded, Testo calls `configure()` and passes its internal DI container. The configurator uses the container to access the framework API. Configurators are registered at two levels: application and Test Suite — see [Configuration — Plugins](./configuration.md#plugins) for details.

The container provides three main extension points:

### Interceptors

Interceptors are middleware that hook into test discovery and execution pipelines. See the [interceptors](./interceptors.md) page for details.

Interceptors are registered via <class>\Testo\Pipeline\InterceptorCollector</class>:

```php
$container->get(InterceptorCollector::class)->addInterceptor(new MyInterceptor());
```

### Event listeners

Testo emits [events](./events.md) at every stage of execution: session start and finish, Test Suite, Test Case, and individual tests. A configurator can subscribe to any of these events via <class>\Testo\Common\EventListenerCollector</class>:

```php
$container->get(EventListenerCollector::class)->addListener(
    TestFinished::class,
    function (TestFinished $event) {
        // React to test completion
    },
);
```

This mechanism follows the [PSR-14](https://www.php-fig.org/psr/psr-14/) standard with one restriction: events are **always** immutable. The same applies to any custom events you create.

See the [Events](./events.md) page for the full list.

### Container bindings

A configurator can register services in the DI container that will be available to interceptors and other framework components.

::: info
Each Test Suite runs in its own container scope. This means that bindings and cached services from a Test Suite-level configurator are isolated — different Test Suites won't share state.
:::

```php
// Factory — service is created lazily on first access
$container->bind(MyService::class, static fn(Container $c) => new MyService(
    $c->get(EventDispatcherInterface::class),
));

// Ready instance — immediately available via get()
$container->set(new MyConfig(timeout: 30));

// Retrieving a service from the container
$dispatcher = $container->get(EventDispatcherInterface::class);

// Creating an instance without storing it in the container
$handler = $container->make(MyHandler::class, ['verbose' => true]);
```

## Creating a plugin

### Failed test logger

Suppose you want to log every failed test to a file. Here's a configurator that listens to the <class>\Testo\Event\Test\TestPipelineFinished</class> event and writes the result:

```php
use Internal\Container\Container;
use Testo\Common\EventListenerCollector;
use Testo\Common\PluginConfigurator;
use Testo\Event\Test\TestPipelineFinished;

final readonly class FailureLoggerPlugin implements PluginConfigurator
{
    public function __construct(
        private string $logFile = 'test-failures.log',
    ) {}

    #[\Override]
    public function configure(Container $container): void
    {
        $container->get(EventListenerCollector::class)->addListener(
            TestPipelineFinished::class,
            $this->onTestFinished(...),
        );
    }

    private function onTestFinished(TestPipelineFinished $event): void
    {
        if (!$event->testResult->status->isFailure()) {
            return;
        }

        $line = \sprintf(
            "[%s] %s %s::%s: %s\n",
            \date('Y-m-d H:i:s'),
            \strtoupper($event->testResult->status->name),
            $event->testInfo->caseInfo->definition->reflection?->getName(),
            $event->testInfo->testDefinition->reflection->getName(),
            \str_replace("\n", ' ', $event->testResult->failure?->getMessage() ?? 'unknown'),
        );

        \file_put_contents($this->logFile, $line, \FILE_APPEND);
    }
}
```

Things to note:

- The configurator accepts `$logFile` in its constructor, so you can customize it per registration.
- <class>\Testo\Event\Test\TestPipelineFinished</class> fires after all interceptors (including retries), so it carries the final result.
- `$event->testResult->status->isFailure()` returns `true` for both `Failed` and `Error`.


### Flaky report in Pull Request

Let's build a plugin that collects flaky tests (ones that only passed after a <plugin>Retry</plugin>) and posts a comment on the GitHub PR:

```php
use Internal\Container\Container;
use Testo\Common\EventListenerCollector;
use Testo\Common\PluginConfigurator;
use Testo\Core\Value\Status;
use Testo\Event\Framework\SessionFinished;
use Testo\Event\Test\TestPipelineFinished;

final class FlakyPRCommentPlugin implements PluginConfigurator
{
    #[\Override]
    public function configure(Container $container): void
    {
        // Check that we're in GitHub Actions and this is a PR
        $token = \getenv('GITHUB_TOKEN');
        $repo = \getenv('GITHUB_REPOSITORY'); // owner/repo
        $ref = (string) \getenv('GITHUB_REF'); // refs/pull/123/merge
        if (!$token || !$repo || !\preg_match('#^refs/pull/(\d+)/#', $ref, $m)) {
            return; // not in CI or not a PR — do nothing
        }

        $prNumber = $m[1];

        $listeners = $container->get(EventListenerCollector::class);
        $listeners->addListener(TestPipelineFinished::class, $this->onTestFinished(...));
        $listeners->addListener(
            SessionFinished::class,
            fn(SessionFinished $e) => $this->postComment($token, $repo, $prNumber),
        );
    }

    /** @var list<string> */
    private array $flakyTests = [];

    private function onTestFinished(TestPipelineFinished $event): void
    {
        if ($event->testResult->status !== Status::Flaky) {
            return;
        }

        $case = $event->testInfo->caseInfo->definition->reflection?->getShortName();
        $test = $event->testInfo->testDefinition->reflection->getName();
        $this->flakyTests[] = $case === null ? "{$test}()" : "{$case}::{$test}()";
    }

    private function postComment(string $token, string $repo, string $prNumber): void
    {
        if ($this->flakyTests === []) {
            return;
        }

        $list = \implode("\n", \array_map(
            static fn(string $name) => "- `{$name}`",
            $this->flakyTests,
        ));

        @\file_get_contents(
            "https://api.github.com/repos/{$repo}/issues/{$prNumber}/comments",
            context: \stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => \implode("\r\n", [
                        "Authorization: Bearer {$token}",
                        'Content-Type: application/json',
                        'User-Agent: Testo',
                    ]),
                    'content' => \json_encode([
                        'body' => "⚠️ **Flaky tests detected**\n\n{$list}",
                    ]),
                ],
            ]),
        );
    }
}
```

This configurator subscribes to two events: <class>\Testo\Event\Test\TestPipelineFinished</class> to collect flaky tests, and <class>\Testo\Event\Framework\SessionFinished</class> to post the comment once the session ends. When run locally, the environment variables are missing, so `configure()` returns early — no listeners, no side effects.

::: info
Register this plugin at the application level (`ApplicationConfig::$plugins`), not per Test Suite — the <class>\Testo\Event\Framework\SessionFinished</class> event fires outside the Test Suite scope.

```php
return new ApplicationConfig(
    suites: [...],
    plugins: [
        new FlakyPRCommentPlugin(),
    ],
);
```
:::

See this plugin in action: [php-testo/testo#107](https://github.com/php-testo/testo/pull/107).

::: question How to configure GitHub Actions for this plugin?
Give the workflow permission to write to PRs and pass the token in the test step:

```yaml
on: [ 'pull_request' ]

permissions:
  pull-requests: write

jobs:
  tests:
    steps:
      - run: vendor/bin/testo
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
:::

## Plugins without a configurator

Not all plugins need a configurator. Some, like <plugin>Retry</plugin> and <plugin>Data</plugin>, work entirely through PHP attributes with automatic interceptor activation. See [interceptors](./interceptors.md) for details.
