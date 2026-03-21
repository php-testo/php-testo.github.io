# Benchmarks

<plugin-info class="\Testo\Bench\BenchmarkPlugin" name="Benchmark" included="\Testo\Application\Config\Plugin\SuitePlugins" />




::: question Why does the attribute need a method if you can just pass a list of equal callables?
The `#[Bench]` attribute on a method defines the **baseline implementation** — the reference point that others are compared against. Callables in the parameter are alternative implementations for comparison. This allows you to automatically fail the test if the baseline is slower than an alternative, and use benchmarks as checks in CI.
:::