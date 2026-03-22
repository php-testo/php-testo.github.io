# Повторный запуск

Плагин предоставляет атрибут <attr>\Testo\Retry</attr> и интерцептор, которые перезапускают упавший тест указанное количество раз. Если тест проходит при повторной попытке, он помечается как нестабильный (flaky). Атрибут можно повесить на метод, функцию или целый класс — в последнем случае политика применяется ко всем тестам в классе.

<plugin-info name="Retry" />

<signature h="2" name="#[\Testo\Retry(int $maxAttempts = 3, bool $markFlaky = true)]">
<short>Объявляет политику повторного запуска теста при падении.</short>
<description>
Можно использовать на любом типе тестов: обычных, встроенных, бенчмарках. При размещении на классе (Test Case) применяется ко всем тестам внутри.
</description>
<param name="$maxAttempts">Максимальное количество попыток, включая первый запуск. Например, `3` означает не более двух повторных попыток после первого падения.</param>
<param name="$markFlaky">Помечать ли тест как нестабильный (flaky), если он прошёл только при повторной попытке. По умолчанию `true`.</param>
<example>
Перезапустить тест до 3 раз:

```php
#[Retry]
public function flakyExternalService(): void
{
    $response = HttpClient::get('https://api.example.com/health');
    Assert::same(200, $response->statusCode);
}
```
</example>
<example>
На классе — все тесты внутри получат политику повторного запуска:

```php
#[Retry(maxAttempts: 5, markFlaky: false)]
final class ExternalApiTest
{
    public function checkHealth(): void { /* ... */ }

    public function checkStatus(): void { /* ... */ }
}
```
</example>
</signature>

## Политика повторов на уровне Test Suite

Атрибут задаёт политику для конкретного теста или класса. Если нужно применить повторный запуск ко всему Test Suite, используйте интерцептор <class>\Testo\Retry\Interceptor\RetryPolicyRunInterceptor</class> напрямую — добавьте его в пайплайн через плагин:

```php
return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Integration',
            location: ['tests/Integration'],
            plugins: [
                // ...
                new class implements PluginConfigurator {
                    #[\Override]
                    public function configure(Container $container): void
                    {
                        $container->get(InterceptorProvider::class)->addInterceptor(
                            $container->make(RetryPolicyRunInterceptor::class, [new Retry(maxAttempts: 3)]),
                        );
                    }
                },
            ],
        ),
    ],
);
```

В этом случае все тесты в Test Suite - Integration будут перезапускаться до 3 раз при падении, без необходимости расставлять атрибуты на каждом тесте.

::: question Что будет, если задать политику повторов на нескольких уровнях?
При множественном определении политики повторов применяется только ближайшая к тесту. Например, если на Test Suite задано `maxAttempts: 3`, на классе — `2`, а на методе — `5`, тест будет повторяться **до 5 раз**. Политики не накапливаются.
:::
