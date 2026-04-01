---
faqLevel: 2
outline: [2, 3]
---

# Плагины

Плагин в Testo — это независимый модуль, отвечающий за конкретную функциональность фреймворка. Обнаружение тестов, проверки (<plugin>Assert</plugin>), жизненный цикл (<plugin>Lifecycle</plugin>), бенчмарки (<plugin>Bench</plugin>), фильтрация (<plugin>Filter</plugin>) — всё это отдельные плагины. Чем больше плагинов подключено, тем больше возможностей. Любой из них можно отключить, заменить или дополнить собственным.

Плагин может состоять из конфигуратора, интерцепторов, атрибутов, слушателей событий — в любой комбинации. Например, плагин <plugin>Assert</plugin> использует конфигуратор для регистрации интерцепторов, а <plugin>Retry</plugin> обходится без конфигуратора и работает исключительно через атрибут или интерцептор.

## Конфигуратор плагина

Конфигуратор — это класс, реализующий интерфейс <class>\Testo\Common\PluginConfigurator</class>:

```php
interface PluginConfigurator
{
    public function configure(Container $container): void;
}
```

При загрузке модуля вызывается метод `configure()`, в который передаётся внутренний DI-контейнер Testo. Через него конфигуратор получает доступ к API фреймворка. Конфигураторы подключаются на двух уровнях: приложения и Test Suite — подробности и примеры на странице [Конфигурация — Плагины](./configuration.md#плагины).

Основных точек расширения три:

### Интерцепторы

Интерцепторы (перехватчики) — это мидлвари, которые встраиваются в пайплайны поиска и выполнения тестов. Подробнее о пайплайнах и интерцепторах в разделе [перехватчики](./interceptors.md).

Интерцепторы регистрируются через <class>\Testo\Pipeline\InterceptorCollector</class>:

```php
$container->get(InterceptorCollector::class)->addInterceptor(new MyInterceptor());
```

### Слушатели событий

Testo генерирует [события](./events.md) на каждом этапе выполнения: старт и завершение сессии, Test Suite, Test Case и отдельных тестов. Конфигуратор может подписаться на любое из этих событий через <class>\Testo\Common\EventListenerCollector</class>:

```php
$container->get(EventListenerCollector::class)->addListener(
    TestFinished::class,
    function (TestFinished $event) {
        // Реакция на завершение теста
    },
);
```

Этот механизм использует стандарт [PSR-14](https://www.php-fig.org/psr/psr-14/) с одним лишь ограничением: события **всегда** иммутабельны. Это ограничение рекомендуется применять и к пользовательским событиям, если вы решите их создавать.

Подробнее о доступных событиях — на странице [События](./events.md).

### Биндинги в контейнере

Конфигуратор может регистрировать сервисы в DI-контейнере, которые затем будут доступны интерцепторам и другим компонентам фреймворка.

::: info
Каждый Test Suite запускается в собственной области видимости контейнера. Это значит, что биндинги и закешированные сервисы из конфигуратора уровня Test Suite изолированы — разные Test Suite не будут делить состояние.
:::

```php
// Фабрика — сервис создаётся лениво при первом обращении
$container->bind(MyService::class, static fn(Container $c) => new MyService(
    $c->get(EventDispatcherInterface::class),
));

// Готовый экземпляр — сразу доступен через get()
$container->set(new MyConfig(timeout: 30));

// Получение сервиса из контейнера
$dispatcher = $container->get(EventDispatcherInterface::class);

// Создание экземпляра без сохранения в контейнере
$handler = $container->make(MyHandler::class, ['verbose' => true]);
```

## Создание плагина

### Логгер упавших тестов

Допустим, вы хотите логировать информацию о каждом упавшем тесте в файл. Для этого достаточно создать конфигуратор, который слушает событие <class>\Testo\Event\Test\TestPipelineFinished</class> и записывает результат:

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

Несколько моментов, на которые стоит обратить внимание:

- Конфигуратор принимает параметр `$logFile` в конструкторе. Это позволяет настраивать поведение при регистрации в конфигурации.
- Событие <class>\Testo\Event\Test\TestPipelineFinished</class> срабатывает после прохождения всех интерцепторов, поэтому содержит финальный результат теста.
- Метод `$event->testResult->status->isFailure()` возвращает `true` для статусов `Failed` и `Error`.


### Отчёт о Flaky в Pull Request

Давайте напишем плагин, который собирает flaky-тесты (прошедшие только после повторной попытки через <plugin>Retry</plugin>) и оставляет комментарий в GitHub PR с их списком:

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

Конфигуратор подписывается на два события: <class>\Testo\Event\Test\TestPipelineFinished</class> для сбора нестабильных тестов и <class>\Testo\Event\Framework\SessionFinished</class> для отправки комментария в конце сессии. При локальном запуске переменные окружения отсутствуют, поэтому `configure()` завершается досрочно и слушатели не регистрируются — плагин просто ничего не делает.

::: info
Этот плагин нужно регистрировать на уровне приложения (`ApplicationConfig::$plugins`), а не Test Suite: событие <class>\Testo\Event\Framework\SessionFinished</class> выбрасывается вне области видимости Test Suite.

```php
return new ApplicationConfig(
    suites: [...],
    plugins: [
        new FlakyPRCommentPlugin(),
    ],
);
```
:::

Демонстрация работы этого плагина в [php-testo/testo#107](https://github.com/php-testo/testo/pull/107).

::: question Как настроить GitHub Actions для этого плагина?
Дайте workflow разрешение на запись в PR и прокиньте токен в шаге запуска тестов:

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

## Плагины без конфигуратора

Не все плагины требуют конфигуратора. Некоторые, например <plugin>Retry</plugin> и <plugin>Data</plugin>, работают исключительно через PHP-атрибуты с активацией интерцепторов. Подробнее об этом механизме читайте на странице [перехватчиков](./interceptors.md).
