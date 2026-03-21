---
outline: [2, 3]
faqLevel: 2
llms_description: "#[Bench] attribute for comparing implementation performance. Attribute parameters: callables, arguments, calls, iterations. Results table: Mean, Median, RStDev, outlier rejection (Rej., Mean*, RStDev*), Warnings. Stability target RStDev < 2%. CI integration: test fails if baseline is slower than alternatives."
---

# Benchmarks

The plugin lets you compare performance of multiple implementations using the `#[Bench]` attribute. The method with the attribute serves as the baseline, and alternative implementations are passed as parameters. Testo measures execution time, collects statistics, and determines which implementation is faster.

<plugin-info name="Bench" class="\Testo\Bench\BenchmarkPlugin" included="\Testo\Application\Config\Plugin\SuitePlugins" />

## Basic Usage

Say you want to find out what's faster: summing numbers with a `for` loop or via `array_sum`. Put the `#[Bench]` attribute on one method and specify the other in `callables`:

```php
#[Bench(
    callables: [
        'sumInArray' => [self::class, 'sumInArray'],
    ],
    arguments: [1, 5_000],
)]
public static function sumInCycle(int $a, int $b): int
{
    $result = 0;
    for ($i = $a; $i <= $b; ++$i) {
        $result += $i;
    }

    return $result;
}

public static function sumInArray(int $a, int $b): int
{
    return \array_sum(\range($a, $b));
}
```

The `sumInCycle` method is the baseline that others are compared against. `callables` lists the alternative implementations, and `arguments` are the inputs all functions will receive.

After running, Testo outputs a results table:

```
Results for sumInCycle:
+----------------------------+----------------------------------------------+---------+
| BENCHMARK SETUP            | TIME RESULTS                                 | SUMMARY |
| Name       | Iters | Calls | Mean             | Median           | RStDev | Place   |
+------------+-------+-------+------------------+------------------+--------+---------+
| current    | 10    | 200   | 37.49µs          | 37.50µs          | ±1.53% | 2nd     |
| sumInArray | 10    | 200   | 11.26µs (-70.0%) | 11.20µs (-70.1%) | ±1.52% | 1st     |
+------------+-------+-------+------------------+------------------+--------+---------+
```

In the **Name** column, `current` refers to the method with the attribute (the baseline), and `sumInArray` is the alternative. The percentage in parentheses shows how much faster or slower an implementation is compared to the baseline: `(-70.0%)` means `sumInArray` ran 70% faster. The **Place** column is the final ranking.

## Attribute Parameters

### `callables`

Alternative implementations to compare against the baseline. Passed as an associative array where the key is the display name in the results table, and the value is any valid PHP callable:

```php
callables: [
    'array_sum' => [self::class, 'sumInArray'],
    'formula'   => [self::class, 'sumLinear'],
]
```

Supports the same callable formats as PHP: `[Class::class, 'method']`, `'function'`, closures.

### `arguments`

Arguments passed to all functions — both the baseline and alternatives. Every implementation receives the same inputs to ensure a fair comparison:

```php
arguments: [1, 5_000]
```

### `calls`

How many times each function is called per iteration. By default, Testo calls the function multiple times in a row and measures the total time, so that a single call isn't too short for accurate measurement. For very fast functions (microseconds), you should increase this value:

```php
calls: 2000
```

### `iterations`

How many times to repeat the measurement. Each iteration is an independent run of all `calls` invocations, and results are averaged across iterations. Multiple iterations are needed to filter out random spikes: background processes, OS activity, and other factors can affect any single measurement, but their impact is smoothed out through averaging:

```php
iterations: 10
```

## Results

The results table is split into three column groups:

**BENCHMARK SETUP** — run parameters:

| Column | Description |
|--------|-------------|
| **Name** | Implementation name. `current` refers to the baseline method. |
| **Iters** | How many iterations were performed. |
| **Calls** | How many times the function was called per iteration. |

**TIME RESULTS** — measurement results:

| Column | Description |
|--------|-------------|
| **Mean** | Arithmetic mean across all iterations. The percentage in parentheses is the difference relative to the baseline. |
| **Median** | Median. Unlike the mean, it is not affected by single anomalously fast or slow runs. |
| **RStDev** | Relative standard deviation — shows how stable the measurements are across iterations. Lower is better. |

**SUMMARY** — conclusion:

| Column | Description |
|--------|-------------|
| **Place** | Final ranking. First place is the fastest implementation. |

### Extended Table

With enough iterations, Testo can show extended statistics with automatic outlier filtering. A **FILTERED RESULTS** group is added to the base columns:

```
+----------------------------+-------------------------------------------------+------------------------------------+--------------------------------------------------------------+
| BENCHMARK SETUP            | TIME RESULTS                                    | FILTERED RESULTS                   | SUMMARY                                                      |
| Name       | Iters | Calls | Mean              | Median            | RStDev  | Rej. | Mean*             | RStDev* | Place | Warnings                                             |
+------------+-------+-------+-------------------+-------------------+---------+------+-------------------+---------+-------+------------------------------------------------------+
| current    | 10    | 20    | 44.03µs           | 43.68µs           |  ±2.35% | 1    | 43.69µs           |  ±0.42% | 3rd   |                                                      |
| calcBar    | 10    | 20    | 13.72µs (-68.8%)  | 13.26µs (-69.6%)  |  ±7.77% | 2    | 13.23µs (-69.7%)  |  ±0.52% | 2nd   |                                                      |
| calcBaz    | 10    | 20    | 110.50ns (-99.7%) | 105.00ns (-99.8%) | ±16.50% | 1    | 106.11ns (-99.8%) | ±12.52% | 1st   | High variance, low iter time. Insufficient iter time |
+------------+-------+-------+-------------------+-------------------+---------+------+-------------------+---------+-------+------------------------------------------------------+
```

The following columns are added to the base ones:

| Column | Description |
|--------|-------------|
| **Rej.** | How many iterations Testo rejected as outliers — they deviated significantly from the rest and would have skewed the statistics. |
| **Mean\*** | Mean after outlier removal. This is the primary value to focus on when comparing. |
| **RStDev\*** | Deviation after outlier removal. |
| **Warnings** | Data quality warnings — for example, that measurements are unstable or execution time is too short for accurate measurement. |

If Testo detects data quality issues, recommendations appear below the table:

```
Recommendations:
  ⚠ High variance, low iter time: Measurement overhead may dominate — increase calls per iteration.
  ⚠ Insufficient iter time: Timer jitter exceeds useful signal — increase calls per iteration.
```

::: question How do I read the results table?
The `current` row is the method with the `#[Bench]` attribute (the baseline), and the other rows are alternative implementations.

1. Check the **Rej.** column — how many iterations were rejected as anomalous. If more than one or two, the results aren't reliable yet: increase `calls` or `iterations`, close unnecessary processes, and rerun the test. If the column is missing, there were no outliers.
2. Check **RStDev\*** (or **RStDev** if the extended table isn't shown). Aim for under 2%. If higher, the measurements aren't stable enough yet.
3. Compare implementations by **Mean\*** (or **Mean**) — this is the average execution time, cleaned of anomalies. The percentage in parentheses shows the difference relative to the baseline: negative means faster, positive means slower.
:::

## Result Stability

Each benchmark run may produce slightly different results — this is normal. Background processes, OS activity, and other factors affect performance at any given moment. To draw conclusions, you need stable measurements.

Stability is assessed by the **RStDev** column (relative standard deviation). It shows how much iteration results are spread around the mean. The target is **RStDev < 2%**: at this level of spread, you can confidently say one implementation is faster than another.

If RStDev is too high, there are two ways to bring it down:

- Increase **`iterations`**. More repeated measurements means more data to average. This helps when instability is caused by external factors like background system load.
- Increase **`calls`**. If a function runs in microseconds, the time of a single call can be comparable to the timer's own precision. By increasing the number of calls per iteration, you get a longer and more accurate measurement.

::: tip
For fast functions (microseconds), start by increasing `calls`. For slower ones (milliseconds and above), increasing `iterations` is usually sufficient.
:::

Testo automatically rejects anomalous measurements (outliers) and recalculates statistics without them. The `Mean*` and `RStDev*` columns in the extended table show results after this filtering.

## Usage in CI

A benchmark with the `#[Bench]` attribute is a full test that can run in CI. If the baseline implementation turns out slower than any of the alternatives, the test is considered failed.

Say you wrote your own serializer instead of the standard `json_encode` because it's faster for your data structures. The benchmark captures this as a fact. If after a refactor your implementation is no longer faster than the standard one — something has changed and it's worth investigating before it reaches production.

```php
// Our serializer should be faster than standard json_encode.
// If that stops being true, the test will fail.
#[Bench(
    callables: [
        'json_encode' => [self::class, 'viaJsonEncode'],
    ],
    arguments: [new UserDto(name: 'John', age: 30)],
    calls: 1000,
    iterations: 5,
)]
public static function serialize(UserDto $dto): string
{
    return DtoSerializer::serialize($dto);
}

public static function viaJsonEncode(UserDto $dto): string
{
    return json_encode($dto);
}
```

::: warning
Benchmark results depend on the environment. On shared CI servers, result variance may be higher than on a local machine, so it's worth using larger `iterations` and `calls` values for reliability.
:::
