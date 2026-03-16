---
title: "To the Collider!"
date: 2026-03-05
description: "Benchmarking isn't hard. One attribute, one run, and you know exactly what's faster. Putting it to practice with Testo."
image: /blog/collider/img-00.jpg
author: Aleksei Gagarin
---

::: info 🤔 The Problem
Write a function that calculates the sum of all numbers from `$a` to `$b`.

For example, if `$a = 1` and `$b = 5`, the result is `1 + 2 + 3 + 4 + 5 = 15`.
:::

1. The simplest solution that comes to mind:
   iteratively add `$i` to `$a` in a `for` loop until we reach `$b`, but that's too obvious.
2. Imagination takes over and you want to solve it with arrays:
   fill an array with values from `$a` to `$b` and pass it to `sum()`.

![To the Collider!](/blog/collider/img-01.png)

## Comparing the Solutions

PHP performs very well in synthetic benchmarks, outpacing Python and all that. With JIT enabled and a few tricks, it can even catch up to C++.

We won't be comparing PHP with other languages right now — instead, let's just compare these two approaches against each other.

Here's my reasoning:

> The array solution should be slower than the `for` loop, since extra resources go into computing hashes for the hash table when creating the array, and more memory is needed for intermediate values.

Let's verify this: we'll write the functions and add the `#[BenchWith]` attribute to one of them.

```php
#[BenchWith(
    callables: [
        'in_array' => [self::class, 'sumInArray'],
    ],
    arguments: [1, 5_000],
    calls: 100,
    iterations: 1,
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

With the `#[BenchWith]` attribute, we're telling Testo that:
- we want to compare the performance of the current function (`sumInCycle`) with another function (`sumInArray`);
- both functions will receive the same arguments: `1` and `5_000`;
- to measure execution time, each function will be called 100 times in a row (`calls: 100`).

Place your bets and let's run it.

```
Summary:
+---+-------------+-------+-------+--------+-------------------+
| # | Name        | Iters | Calls | Memory | Avg Time          |
+---+-------------+-------+-------+--------+-------------------+
| 2 | current     | 1     | 100   | 0      | 38.921ms          |
| 1 | sumInArray  | 1     | 100   | 0      | 21.472ms (-44.8%) |
+---+-------------+-------+-------+--------+-------------------+
```

`sumInArray` takes first place, completing the task almost twice as fast as `sumInCycle`.

> Wait, what? The array-based function won by a wide margin?!


![Statistical Artifact](/blog/collider/img-02.png)

## Statistical Artifact

Indeed, this could just be a "statistical artifact."

Each benchmark rerun produces different results, sometimes varying significantly from the previous ones.
This can be caused by background tasks, user activity, or other phenomena that affect performance at the moment.

::: warning ⚠️ We need guarantees that we're comparing genuinely stable results, not just random outliers.
:::

Statistics comes to the rescue with the [coefficient of variation](https://en.wikipedia.org/wiki/Coefficient_of_variation), which measures the relative variability of data.
The smaller this coefficient, the more stable the results.

All we need to do is collect more data spread over time — that is, rerun the benchmarks multiple times.
The `#[BenchWith]` attribute has an `iterations` parameter responsible for the number of benchmark reruns.

Let's set `iterations: 10` and rerun:

```
Summary:
+---+-------------+-------+-------+--------+-------------------+---------+
| # | Name        | Iters | Calls | Memory | Avg Time          | RStDev  |
+---+-------------+-------+-------+--------+-------------------+---------+
| 2 | current     | 10    | 100   | 0      | 38.474ms          | ±2.86%  |
| 1 | sumInArray  | 10    | 100   | 0      | 12.501ms (-67.5%) | ±27.20% |
+---+-------------+-------+-------+--------+-------------------+---------+
```

Now `sumInArray` runs 3x faster, but the coefficient of variation (`RStDev` column) is 27.2%, which is quite high.
To claim stable results, you typically aim for RStDev < 2%.

Let's think about how to reduce this variation. Our functions execute quite fast, and even small performance fluctuations can heavily impact the results, especially with a low number of runs.
For fast code like ours, increasing the number of `calls` per iteration can help. Let's bump it to 2000:

```
Summary:
+---+-------------+-------+-------+--------+-------------------+--------+
| # | Name        | Iters | Calls | Memory | Avg Time          | RStDev |
+---+-------------+-------+-------+--------+-------------------+--------+
| 2 | current     | 10    | 2000  | 0      | 37.888ms          | ±1.38% |
| 1 | sumInArray  | 10    | 2000  | 0      | 11.395ms (-69.9%) | ±1.72% |
+---+-------------+-------+-------+--------+-------------------+--------+
```

As you can see, with a 3x performance difference, even ±27.2% variation wouldn't have saved the `for` loop from defeat. But now we can confidently claim the results are stable (RStDev < 2%).

![Fine, arrays are faster](/blog/collider/img-03.png)


By the way, did you notice that `memory=0` in both cases? This means no additional memory was allocated for the arrays — what was already allocated at benchmark startup was enough.

Of course, you could experiment with a larger range, enable JIT, and prove that in some cases the loop would be faster,
but I want to draw your attention to how quick it is to benchmark something now!


## BenchWith

![Shock](/blog/collider/img-04.png)

Benchmarking right in your code without extra boilerplate. Like [inline tests](/docs/plugins/inline.md), but for benchmarks.

[Dragon Code](https://github.com/TheDragonCode/benchmark) once showed that benchmarks can be simple and convenient: instead of tons of boilerplate, just call a single class and pass closures for comparison.
Testo takes this to the next level: from intent to result in just one attribute.

Run it with a single click in your IDE:
![IDE](/blog/collider/screen.png)

But that's not all. Behind the simplicity on the surface lie serious algorithms backed by statistics.

Testo automatically detects deviations in the data, discards outliers, and produces metrics that help you understand how stable the results are.
For those who don't find raw numbers very telling, there's a summary with recommendations and alerts.

Here's what it looks like right now:

```
Results for calcFoo:
+----------------------------+-------------------------------------------------+------------------------------------+--------------------------------------------------------------+
| BENCHMARK SETUP            | TIME RESULTS                                    | FILTERED RESULTS                   | SUMMARY                                                      |
| Name       | Iters | Calls | Mean              | Median            | RStDev  | Rej. | Mean*             | RStDev* | Place | Warnings                                             |
+------------+-------+-------+-------------------+-------------------+---------+------+-------------------+---------+-------+------------------------------------------------------+
| current    | 10    | 20    | 44.03µs           | 43.68µs           |  ±2.35% | 1    | 43.69µs           |  ±0.42% | 3rd   |                                                      |
| calcBar    | 10    | 20    | 13.72µs (-68.8%)  | 13.26µs (-69.6%)  |  ±7.77% | 2    | 13.23µs (-69.7%)  |  ±0.52% | 2nd   |                                                      |
| calcBaz    | 10    | 20    | 110.50ns (-99.7%) | 105.00ns (-99.8%) | ±16.50% | 1    | 106.11ns (-99.8%) | ±12.52% | 1st   | High variance, low iter time. Insufficient iter time |
+------------+-------+-------+-------------------+-------------------+---------+------+-------------------+---------+-------+------------------------------------------------------+
Recommendations:
  ⚠ High variance, low iter time: Measurement overhead may dominate — increase calls per iteration.
  ⚠ Insufficient iter time: Timer jitter exceeds useful signal — increase calls per iteration.
```

I know, it looks overwhelming, but this isn't the release version yet. In the future I envision it being even simpler: an attribute with automatic settings, no need to dive into the details.

## Back to the Collider

Alright, you obviously know that the range sum problem can be solved in `O(1)` using a simple mathematical formula.
I'll deprive you of the pleasure of pointing this out in the comments.

Here's the function and a benchmark against the previous solutions:

```php
public static function sumLinearF(int $a, int $b): int
{
    $d = $b - $a + 1;
    return (int) (($d - 1) * $d / 2) + $a * $d;
}
```

```
Summary:
+---+-------------+-------+-------+-------------------+--------+
| # | Name        | Iters | Calls | Avg Time          | RStDev |
+---+-------------+-------+-------+-------------------+--------+
| 4 | current     | 10    | 2000  | 40.102ms          | ±1.09% |
| 2 | sumInArray  | 10    | 2000  | 12.232ms (-69.5%) | ±0.93% |
| 1 | sumLinear   | 10    | 2000  | 77.065µs (-99.8%) | ±3.05% |
+---+-------------+-------+-------+-------------------+--------+
```

Microseconds instead of milliseconds. Pretty cool, right?

And even here there's room for optimization. You've probably heard that division isn't always the fastest operation.
Dividing by 2 can be replaced with multiplying by 0.5.

![Multiplication is faster!](/blog/collider/img-05.png)

```php
public static function multi(int $a, int $b): int
{
    $d = $b - $a + 1;
    return (int) (($d - 1) * $d * 0.5) + $a * $d;
}
```

```
+---+---------+-------+---------+--------+------------------+--------+
| # | Name    | Iters | Calls   | Memory | Avg Time         | RStDev |
+---+---------+-------+---------+--------+------------------+--------+
| 1 | current | 10    | 2000000 | 0      | 75.890µs         | ±0.79% |
| 2 | multi   | 10    | 2000000 | 0      | 78.821µs (+3.9%) | ±0.47% |
+---+---------+-------+---------+--------+------------------+--------+
```


::: info Division is faster than multiplication (╯°□°）╯︵ ┻━━┻

Expectations don't always match reality, and optimizations don't always work the way we think.
:::

Also, remembering that we're working with positive integers in binary, we can replace division with a bit shift, which in theory should be even faster.

![WTF](/blog/collider/img-06.png)


```php
public static function shift(int $a, int $b): int
{
    $d = $b - $a + 1;
    return ((($d - 1) * $d) >> 1) + $a * $d;
}
```

```
+---+---------+-------+---------+--------+------------------+--------+
| # | Name    | Iters | Calls   | Memory | Avg Time         | RStDev |
+---+---------+-------+---------+--------+------------------+--------+
| 2 | current | 10    | 2000000 | 0      | 75.890µs         | ±0.79% |
| 1 | shift   | 10    | 2000000 | 0      | 70.559µs (-7.0%) | ±0.70% |
+---+---------+-------+---------+--------+------------------+--------+
```

At least the bit shift didn't let us down.

Note that the 7% improvement doesn't mean bit shifting is exactly 7% faster than division.
The function contains several other mathematical operations, and the function call itself takes some time.
So 7% is the difference between two functions, not between two specific operations.

::: info 💡 It's always important to understand what exactly is being compared, so you can correctly interpret the results.
:::

![Benchmarks will tell](/blog/collider/img-07.png)


Use benchmarks, verify your assumptions, and find optimal solutions.
