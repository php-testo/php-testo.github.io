---
llms_description: "How to repeat a test multiple times to check stability. #[Repeat] attribute with times, maxFailures and markFlaky parameters. Works on methods, functions, and classes. Combination with #[Retry]. When to choose Repeat over Retry."
---

# Repeat

The plugin provides the <attr>\Testo\Repeat</attr> attribute and an interceptor that run a test a fixed number of times in a row. Unlike <attr>\Testo\Retry</attr>, Repeat does not care whether the first run passed — it always executes the full cycle. Use it when you want to verify that a test is stable across many runs, or stress a piece of logic that may have hidden non-determinism. The attribute can be placed on a method, function, or an entire class — in the latter case, the policy applies to all tests inside.

<plugin-info name="Repeat" />

<signature h="2" name="#[\Testo\Repeat(int $times = 2, int $maxFailures = 0, bool $markFlaky = true)]">
<short>Runs a test a fixed number of times and decides the outcome by a failure threshold.</short>
<description>
Works with any test type: regular tests, inline tests, benchmarks. When placed on a class (Test Case), applies to all tests within it. If a repetition is Skipped, Cancelled, or Aborted, the loop terminates immediately and that status is reported as the final result.
</description>
<param name="$times">Total number of test runs — not extra repetitions on top of an initial execution. `times: 1` runs the test once, `times: 3` runs it three times in total. Must be at least `1`. Mirrors the semantics of Kotlin's `repeat(times)` and JUnit's `@RepeatedTest`.</param>
<param name="$maxFailures">How many failed runs are tolerated before the whole loop is reported as failed. With the default `0`, any single failure stops the loop and fails the test.</param>
<param name="$markFlaky">Whether to mark the test as flaky when at least one run failed but the failure count stayed within `$maxFailures`. Defaults to `true`.</param>
<example>
Run the same test 5 times — any single failure fails the whole test:

```php
#[Repeat(times: 5)]
public function orderCalculationIsStable(): void
{
    $order = new Order([new Item('A', 10), new Item('B', 20)]);
    Assert::same(30, $order->total());
}
```
</example>
<example>
Tolerate up to two failures out of ten — useful when the underlying system is known to be slightly noisy:

```php
#[Repeat(times: 10, maxFailures: 2)]
public function externalServiceReturnsExpectedShape(): void
{
    $response = HttpClient::get('https://api.example.com/users/1');
    Assert::same(200, $response->statusCode);
}
```
</example>
<example>
On a class — all tests inside inherit the repetition policy:

```php
#[Repeat(times: 3)]
final class StabilityTest
{
    public function firstCheck(): void { /* ... */ }

    public function secondCheck(): void { /* ... */ }
}
```
</example>
</signature>

## Tolerating Some Failures

By default `maxFailures: 0` means the loop stops as soon as a run fails — useful when you want every single run to be green. Raising the threshold turns Repeat into a soft stability check: the test counts how many of N runs failed and reports failure only when the count exceeds the limit.

When the loop survives within the threshold but at least one run did fail, the test status becomes `Flaky` (unless you pass `markFlaky: false`). This makes intermittent failures visible in reports instead of silently hiding them.

```php
// Passes if at most 1 of 5 runs fails. With markFlaky: false the test is just green.
#[Repeat(times: 5, maxFailures: 1, markFlaky: false)]
public function tolerantStabilityCheck(): void { /* ... */ }
```

## Combining with Retry

Repeat and <attr>\Testo\Retry</attr> can be used together — they are orthogonal:

- **Repeat** runs the test N times to verify stability.
- **Retry** retries a single failed run to recover from a transient hiccup.

When both attributes are present, Repeat runs *inside* Retry: each retry attempt executes the full repeat cycle, and if the number of failed runs in the cycle exceeds `maxFailures`, Retry kicks in for the whole cycle.

```php
#[Retry(maxAttempts: 3)]
#[Repeat(times: 5, maxFailures: 1)]
public function noisyButImportantCheck(): void { /* ... */ }
```

Here the test runs 5 times per attempt; if more than one run fails, the whole cycle is considered a failure and Retry starts a new attempt (up to 3 total).

## Repeat vs Retry

The two plugins look similar but solve opposite problems. Pick the one that matches the question you are asking about the test:

- Use <attr>\Testo\Retry</attr> when **the test should pass once**, and you want to forgive a single transient failure. Retry stops as soon as the test goes green, so a successful first run costs nothing extra.
- Use <attr>\Testo\Repeat</attr> when **the test should pass every time** (or almost every time), and you want to prove stability. Repeat always executes the full cycle, even if the first run was green.

| | <attr>\Testo\Retry</attr> | <attr>\Testo\Repeat</attr> |
|---|---|---|
| Purpose | Recover from a flaky failure | Verify stability across runs |
| Stops early on first success | Yes | No — always performs `$times` runs |
| Failure tolerance | Implicit: one success is enough | Explicit via `$maxFailures` |
| Typical scenario | External API, network call, slow CI | Race conditions, time-dependent logic, warm-up |
| Cost on a healthy test | One run | N runs every time |

::: question What happens if a repetition is skipped or aborted?
The loop terminates immediately and the test reports the corresponding status — Skipped, Cancelled, or Aborted. Only completed runs (passed or failed) count toward `$maxFailures`.
:::
