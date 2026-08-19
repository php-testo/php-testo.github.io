---
outline: [2, 3]
llms: true
llms_description: "How to test asynchronous Revolt/amphp code. #[RunInRevolt] runs a test on the Revolt event loop so it can await timers, streams, and Future::await(); suspension works only through Revolt Suspension; tests enter the loop one at a time to keep test state isolated."
---

# Revolt

[Revolt](https://revolt.run) is the standard event loop for asynchronous PHP: a loop that waits for timers, sockets, and streams to become ready, then resumes the coroutines waiting on them, one at a time. It powers the [amphp](https://amphp.org) libraries. This plugin adds the <attr>\Testo\Bridge\Revolt\RunInRevolt</attr> attribute, which runs a test on the process-wide Revolt loop, where it can await asynchronous work (timers, streams, <func>\Amp\Future::await()</func>) without blocking the process.

<plugin-info name="Revolt" packagist="testo/bridge-revolt" />

## Installation

```bash
composer require --dev testo/bridge-revolt
```

<signature h="2" name="#[\Testo\Bridge\Revolt\RunInRevolt()]">
<short>Runs the test on the Revolt event loop.</short>
<description>

The test body runs on the event loop, but from the outside the call is still an ordinary blocking one: the pipeline waits for the test to finish.

Can be applied to a **method** or a **class** (Test Case). On a class, the attribute sends every test in the case through the loop, but **one at a time**: the next test enters the loop only after the previous one has fully finished.

</description>
<example>

Await real asynchronous work (a Revolt timer) inside a test:

```php
use Revolt\EventLoop;
use Testo\Assert;
use Testo\Bridge\Revolt\RunInRevolt;
use Testo\Test;

#[Test]
#[RunInRevolt]
public function resolvesAfterDelay(): void
{
    $suspension = EventLoop::getSuspension();
    EventLoop::delay(0.1, static fn() => $suspension->resume('ready'));

    Assert::same('ready', $suspension->suspend()); // the loop keeps spinning while we wait
}
```

</example>
</signature>

::: warning Suspend only through <class>\Revolt\EventLoop\Suspension</class>
The test's fiber belongs to the Revolt event loop, so suspend through a <class>\Revolt\EventLoop\Suspension</class> tied to a loop event (a timer, I/O): nothing on the loop will ever resume a bare <func>\Fiber::suspend()</func>. And if what you want is bare fibers managed by Testo itself, that's a different job — reach for <attr>\Testo\Fiber\RunInFiber</attr> from the <plugin>Fiber</plugin> plugin.

The reverse is also true: <func>\Amp\Future::await()</func> and <class>\Revolt\EventLoop\Suspension</class> only work on the Revolt event loop, that is, under <attr>\Testo\Bridge\Revolt\RunInRevolt</attr>.
:::


## One test at a time

<attr>\Testo\Bridge\Revolt\RunInRevolt</attr> doesn't run tests in parallel: only the **test body** goes onto the event loop, and tests never share a loop run. Data providers, retries, and Testo's own plumbing run outside the loop, and the next test in the case enters it only after the previous one has fully finished.

This is a deliberate trade-off: test isolation matters more than interleaving. If interleaving tests to hunt for races is exactly what you need, use <attr>\Testo\Fiber\RunInFiber</attr> from the <plugin>Fiber</plugin> plugin: it runs on plain fibers that Testo manages itself.

::: question Why can't all tests run at once, like with RunInFiber?
It comes down to who controls the fibers. Isolation under <attr>\Testo\Fiber\RunInFiber</attr> from the <plugin>Fiber</plugin> plugin relies on guards: the test body runs inside the guard's nested fiber, so every <func>\Fiber::suspend()</func> passes through the guard, which detaches its test's state on suspend and restores it on resume. Under <attr>\Testo\Bridge\Revolt\RunInRevolt</attr>, the fibers belong to Revolt: it suspends and resumes them itself, bypassing the guards, so the state never gets switched. If several tests landed on the loop at once, their contexts would bleed into each other: assertions, messages, and coverage would be credited to the wrong tests.
:::

::: question RunInRevolt or RunInFiber?
<attr>\Testo\Bridge\Revolt\RunInRevolt</attr> is about **asynchrony**: give the test an event loop so it can await real I/O (amphp, Revolt timers and streams), isolated from other tests. <attr>\Testo\Fiber\RunInFiber</attr> is about **concurrency**: interleave the tests in a case on plain fibers to flush out races in cooperative code. They solve different problems: `#[RunInRevolt]` doesn't run tests in parallel, and `#[RunInFiber]` doesn't spin an event loop.
:::
