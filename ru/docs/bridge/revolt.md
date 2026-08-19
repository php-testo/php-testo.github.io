---
outline: [2, 3]
---

# Revolt

[Revolt](https://revolt.run) — стандартный event loop для асинхронного PHP: цикл, который ждёт готовности ввода-вывода (таймеров, сокетов, потоков) и по очереди возобновляет корутины, которые этого ждали. На нём работают библиотеки [amphp](https://amphp.org). Плагин предоставляет атрибут <attr>\Testo\Bridge\Revolt\RunInRevolt</attr>: тест выполняется на общем для процесса цикле Revolt и может дожидаться асинхронной работы (таймеры, потоки, <func>\Amp\Future::await()</func>), не блокируя процесс.

<plugin-info name="Revolt" packagist="testo/bridge-revolt" />

## Установка

```bash
composer require --dev testo/bridge-revolt
```

<signature h="2" name="#[\Testo\Bridge\Revolt\RunInRevolt()]">
<short>Запускает тест на event loop Revolt.</short>
<description>

Тело теста уходит на event loop, а снаружи вызов остаётся обычным блокирующим: пайплайн ждёт, пока тест доработает.

Работает на **методе** и на **классе** (Test Case). На классе атрибут прогоняет через цикл каждый тест, но **по одному за раз**: следующий тест попадает на цикл только после того, как предыдущий полностью завершился.

</description>
<example>

Дождаться реальной асинхронной работы (таймер Revolt) внутри теста:

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

    Assert::same('ready', $suspension->suspend()); // цикл крутится, пока мы ждём
}
```

</example>
</signature>

::: warning Приостановка — только через <class>\Revolt\EventLoop\Suspension</class>
Файбером теста владеет event loop Revolt, поэтому приостанавливаться нужно через <class>\Revolt\EventLoop\Suspension</class>, привязанную к событию цикла (таймеру, вводу-выводу): голый <func>\Fiber::suspend()</func> на цикле возобновить некому. А если нужны голые файберы под управлением самого Testo, это уже <attr>\Testo\Fiber\RunInFiber</attr> из плагина <plugin>Fiber</plugin>, другая задача.

Валидно и обратное: <func>\Amp\Future::await()</func> и <class>\Revolt\EventLoop\Suspension</class> работают только в event loop Revolt (под атрибутом <attr>\Testo\Bridge\Revolt\RunInRevolt</attr>).
:::


## Один тест за раз

<attr>\Testo\Bridge\Revolt\RunInRevolt</attr> не выполняет тесты параллельно: на event loop уходит **только тело теста**, и тесты никогда не делят прогон цикла. Провайдер данных, ретраи и служебная обвязка Testo выполняются снаружи, а следующий тест кейса входит на цикл лишь после того, как полностью завершился предыдущий.

Это осознанный размен: изоляция тестов важнее чередования. Если нужно именно чередовать тесты между собой в поисках гонок, возьмите <attr>\Testo\Fiber\RunInFiber</attr> из плагина <plugin>Fiber</plugin>: он работает на обычных файберах, которыми управляет сам Testo.

::: question Почему нельзя запустить все тесты одновременно, как с RunInFiber?
Дело в том, кто управляет файберами. Изоляция под <attr>\Testo\Fiber\RunInFiber</attr> модуля <plugin>Fiber</plugin> держится на гардах: тело теста выполняется во вложенном файбере гарда, поэтому каждый <func>\Fiber::suspend()</func> проходит сквозь гард, и тот на приостановке снимает состояние своего теста, а на возобновлении подставляет обратно. Под <attr>\Testo\Bridge\Revolt\RunInRevolt</attr> файберы переходят под контроль Revolt: он приостанавливает и возобновляет их сам, мимо гардов, и переключать состояние некому. Окажись на цикле несколько тестов разом, контекст тестов утёк бы: проверки, сообщения и покрытие засчитывались бы чужим тестам.
:::

::: question RunInRevolt или RunInFiber?
<attr>\Testo\Bridge\Revolt\RunInRevolt</attr> — про **асинхронность**: дать тесту event loop, чтобы он ждал реальный ввод-вывод (amphp, таймеры и потоки Revolt), изолированно от других тестов. <attr>\Testo\Fiber\RunInFiber</attr> — про **конкурентность**: чередовать тесты кейса на обычных файберах, чтобы находить гонки в кооперативном коде. Это разные задачи: `#[RunInRevolt]` не запускает тесты параллельно, а `#[RunInFiber]` не крутит event loop.
:::
