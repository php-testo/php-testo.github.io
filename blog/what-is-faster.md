---
title: "What's Faster"
date: 2026-07-26
description: "Benchmarking three runners on the same codebase: Tempest Testing, PHPUnit and Testo. The runners land within a couple of seconds of each other, while a bad test setup turned 20 seconds into 5 minutes."
image: /blog/what-is-faster/preview.png
author: Aleksei Gagarin
---

# What's Faster

Ever since the beta, people have been asking whether I benchmarked Testo against PHPUnit.
I always said no, and usually added that it's probably a bit slower: every feature in Testo is built as a pipeline of middleware, and you tend to pay for flexibility and convenience with performance.

I never got around to measuring it. Then a good excuse turned up.

## The excuse

Brent recently [posted a tweet](https://x.com/brendt_gd/status/2081263436118319306) where his Tempest Testing wipes the floor with PHPUnit: roughly 3 seconds against 30.

<Tweet id="2080542442621726731" user="brendt_gd" caption="Both suites side by side, in one video" />

Same codebase, same tests. The frameworks are the only difference.

The first thing that comes to mind is parallelism. But no — the tweet says everything runs in a single process.

Fibers then? Is Tempest already async? Easy enough to check — the codebase is public: [brendt/stitcher.io](https://github.com/brendt/stitcher.io), branch `testing`.

So here's a project where two runners already sit side by side on identical tests. The perfect moment to add a third and see where Testo lands between async Tempest and sequential PHPUnit.

## The setup

I brought PHPUnit back from the main branch into its own folder next to the Tempest tests, and made one more folder for Testo. An AI agent ported the PHPUnit tests to Testo — that's exactly what Testo's [skills](/blog/skills) and [Rector rules](/docs/bridge/rector.md#conversion-rules) are for: converting tests between frameworks.

Along the way I had to restore the environment and [send a fix](https://github.com/tempestphp/tempest-testing/pull/1) to Tempest Testing, because the thing simply wouldn't run.

I adjusted the infrastructure too. Tests on MySQL are painfully slow — two minutes on Tempest — so I switched everything to SQLite. And instead of Redis I went straight for Valkey.

## First runs

- PHPUnit — 5 minutes 22 seconds.
- Tempest — around 12 seconds.
- Testo — around 17 seconds.

PHPUnit trailing that far behind looked suspicious, especially next to Testo. I went digging and turned up a couple of things:

1. PHPUnit was rebuilding the entire framework Kernel for every single test. Tempest just reset the state of an already-built one. That one change cut the time from 5 minutes to 30 seconds.
2. The `#[Before]` attribute was sitting on `setUp()`, which already runs as a `Before` hook. Funnily enough, PHPUnit seems to call `setUp()` twice in that case. Another quarter of the time gone.

I never did find any fibers in Tempest, by the way. Its whole lead came from better plumbing around the tests, not from being async.

## Results

I synced everything that affects timing across all three runners: state resets, migrations, event bus hacks. Here's the outcome:

| runner  | processes   | run 1 | run 2 | average |
|---------|-------------|------:|------:|--------:|
| tempest | 1           | 24.5s | 24.3s |   24.4s |
| tempest | 5 (default) | 12.5s | 12.3s |   12.4s |
| testo   | 1           | 21.1s | 21.2s |   21.1s |
| phpunit | 1           | 22.5s | 22.6s |   22.5s |

Honestly, I'm surprised Testo came out fastest in a single process. Tempest on its default five processes predictably runs almost twice as fast as its own single-process pass. Parallel execution is coming to Testo too — it's firmly on the 1.0 roadmap.

There's a far more interesting number here, though. According to Testo's metrics, running the test functions themselves took less than a second across the whole suite.
Subtract that one second for the testing framework itself, and the remaining twenty-something seconds are all plumbing: booting the application, applying migrations, resetting state between tests...

::: tip Advice
All a runner does is find the tests, call them and collect the results. So before switching runners for the sake of speed, look at what your `setUp()` is actually doing.
:::
