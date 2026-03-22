---
llms_description: "#[Retry] attribute for retrying failed tests, maxAttempts, markFlaky, class-level and method-level usage, flaky test detection"
---

# Retry

The plugin provides the <attr>\Testo\Retry</attr> attribute and an interceptor that retry a failed test a specified number of times. If the test passes on retry, it's marked as flaky. The attribute can be placed on a method, function, or an entire class — in the latter case, the policy applies to all tests in the class.

<plugin-info name="Retry" />

<signature h="2" name="#[\Testo\Retry(int $maxAttempts = 3, bool $markFlaky = true)]">
<short>Declares a retry policy for a test on failure.</short>
<description>
Works with any test type: regular tests, inline tests, benchmarks. When placed on a class (Test Case), applies to all tests within it.
</description>
<param name="$maxAttempts">Maximum number of attempts, including the first run. For example, `3` means up to two retries after the initial failure.</param>
<param name="$markFlaky">Whether to mark the test as flaky if it only passed on retry. Defaults to `true`.</param>
<example>
Retry a test up to 3 times:

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
On a class — all tests inside inherit the retry policy:

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

## Suite-Level Policy

The attribute sets a retry policy for a specific test or class. To apply retries to an entire Test Suite, use the <class>\Testo\Retry\Interceptor\RetryPolicyRunInterceptor</class> directly — add it to the pipeline via a plugin:

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

This way all tests in the Integration Test Suite will be retried up to 3 times on failure, without placing the attribute on each test individually.

::: question What happens if a retry policy is defined at multiple levels?
When multiple retry policies are defined, only the closest one to the test applies. For example, if the Test Suite has `maxAttempts: 3`, the class has `2`, and the method has `5`, the test will retry **up to 5 times**. Policies do not stack.
:::
