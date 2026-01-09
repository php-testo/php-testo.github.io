# События

Testo генерирует события на протяжении всего жизненного цикла выполнения тестов. События - это ваша основная точка расширения для настройки поведения тестов, сбора метрик или интеграции с внешними инструментами.

## Основы системы событий

События в Testo являются классами, следуя стандарту [PSR-14](https://www.php-fig.org/psr/psr-14/) для диспетчеров событий.

Характеристики событий:
- **Неизменяемые** - вы не можете изменять объекты событий. Слушайте и реагируйте, не мутируйте.
- **Типизированные** - каждое событие является конкретным классом с типизированными свойствами.
- **Иерархические** - события организованы по уровням: набор → кейс → тест.
- **Полиморфные** - вы можете слушать родительские классы или интерфейсы, чтобы перехватывать несколько типов событий.

## Регистрация слушателей событий

Регистрируйте слушателей через интерфейс `EventListenerCollector` в ваших плагинах. См. [плагины](./plugins.md) для разработки плагинов.

```php
use Testo\Config\EventListenerCollector;
use Testo\Test\Event\Test\TestFinished;

class MyPlugin
{
    public function configure(EventListenerCollector $events): void
    {
        $events->addListener(
            TestFinished::class,
            fn(TestFinished $event) => $this->onTestFinished($event),
            priority: 100
        );
    }

    private function onTestFinished(TestFinished $event): void
    {
        // Реакция на завершение теста
        $testInfo = $event->testInfo;
        $result = $event->testResult;
    }
}
```

**Приоритет:** Более высокие значения выполняются первыми. По умолчанию `0`.

## Иерархия событий

События генерируются на трёх уровнях детализации:

### Уровень Test Suite

Test Suite (Unit, Integration и т.д.), определённые в конфигурации. Содержат несколько тестовых классов (Test Cases).

```
TestSuitePipelineStarting      # Перед перехватчиками Test Suite
  TestSuiteStarting            # Начинается выполнение Test Suite
    ... выполняются тестовые классы ...
  TestSuiteFinished            # Завершается выполнение Test Suite
TestSuitePipelineFinished      # После перехватчиков Test Suite
```

### Уровень Test Case

Один тестовый класс = один Test Case. Содержит несколько тестовых методов.

```
TestCasePipelineStarting       # Перед перехватчиками Test Case
  TestCaseStarting             # Начинается выполнение Test Case
    ... выполняются тестовые методы ...
  TestCaseFinished             # Завершается выполнение Test Case
TestCasePipelineFinished       # После перехватчиков Test Case
```

### Уровень тестового метода

Один тестовый метод. Может содержать несколько запусков теста (через провайдеры данных или повторные попытки).

```
TestPipelineStarting           # Перед перехватчиками тестового метода
  TestBatchStarting            # Начинается пакет (для провайдеров данных/повторов)
    TestStarting               # Начинается один запуск теста
      ... выполнение теста ...
    TestFinished               # Завершается один запуск теста
    TestRetrying               # (опционально) Тест будет повторён
    TestStarting               # Начинается попытка повтора
      ... выполнение теста ...
    TestFinished               # Завершается попытка повтора
  TestBatchFinished            # Завершается пакет
TestPipelineFinished           # После перехватчиков тестового метода
```

## Правила упорядочивания событий

1. **События Pipeline** всегда обёртывают выполнение:
   - `*PipelineStarting` генерируется первым
   - `*PipelineFinished` генерируется последним

2. **Пары Starting/Finished** всегда соответствуют друг другу:
   - Каждому `*Starting` соответствует `*Finished`
   - Даже если выполнение завершилось неудачно или было пропущено

3. **Иерархия течёт вниз:**
   ```
   Test Suite Pipeline Start            (TestSuitePipelineStarting)
     Test Suite Start                   (TestSuiteStarting)
       Test Case Pipeline Start         (TestCasePipelineStarting)
         Test Case Start                (TestCaseStarting)
           Test Method Pipeline Start   (TestPipelineStarting)
             Batch Start                (TestBatchStarting)
               Test Start               (TestStarting)
               Test Finish              (TestFinished)
             Batch Finish               (TestBatchFinished)
           Test Method Pipeline Finish  (TestPipelineFinished)
         Test Case Finish               (TestCaseFinished)
       Test Case Pipeline Finish        (TestCasePipelineFinished)
     Test Suite Finish                  (TestSuiteFinished)
   Test Suite Pipeline Finish           (TestSuitePipelineFinished)
   ```

4. **Пакеты группируют запуски:**
   - `TestBatchStarting` генерируется один раз на тестовый метод
   - Содержит несколько пар `TestStarting`/`TestFinished`
   - Завершается `TestBatchFinished`, содержащим агрегированный результат

5. **Повторы генерируются между запусками:**
   - `TestFinished` (неудачный)
   - `TestRetrying` (решение повторить)
   - `TestStarting` (начинается попытка повтора)

## Полиморфные слушатели

Поскольку события являются классами, вы можете слушать родительские классы или интерфейсы для обработки нескольких типов событий в одном слушателе.

### Слушать все события теста

```php
use Testo\Test\Event\Test\TestEvent;

$events->addListener(TestEvent::class, function (TestEvent $event) {
    // Срабатывает для: TestStarting, TestFinished, TestRetrying, TestBatchStarting, и т.д.
    $this->logger->debug("Test event: " . get_class($event));
});
```

### Слушать все события с результатами

```php
use Testo\Test\Event\Test\TestResultEvent;

$events->addListener(TestResultEvent::class, function (TestResultEvent $event) {
    // Срабатывает для: TestFinished, TestBatchFinished, TestPipelineFinished
    if ($event->testResult->isFailed()) {
        $this->notifyFailure($event);
    }
});
```

### Слушать все события Test Case

```php
use Testo\Test\Event\TestCase\TestCaseEvent;

$events->addListener(TestCaseEvent::class, function (TestCaseEvent $event) {
    // Срабатывает для всех событий TestCase* (уровень Test Case)
    $this->trackCase($event->caseInfo);
});
```

Это полезно, когда вас не интересует конкретный тип события, а только данные, которые оно несёт.

## Пользовательский диспетчер событий

Testo использует совместимый с PSR-14 диспетчер событий. Вы можете заменить его через [систему плагинов](./plugins.md), предоставив свои собственные реализации `EventDispatcherInterface` и `EventListenerCollector` (PSR-14 не определяет конфигурацию слушателей, поэтому Testo использует `EventListenerCollector` в качестве API для этого).

**Внимание:** Хотя ядро Testo не зависит от событий, многие компоненты зависят. Использование `NullDispatcher` или нефункционального диспетчера сломает:
- Встроенные рендереры (отчёты о прогрессе, форматирование вывода)
- Плагины, которые полагаются на события
- Интеграцию с внешними инструментами

Заменяйте диспетчер только если понимаете последствия.

## Важные замечания

- **События доступны только для чтения.** Вы не можете изменить результаты тестов, модифицируя события.
- **Слушатели выполняются синхронно.** Тяжёлая обработка замедлит выполнение тестов.
- **Исключения в слушателях остановят выполнение.** Обрабатывайте ошибки корректно.
- **Приоритет имеет значение.** Если порядок слушателей важен, используйте явные приоритеты.
- **События Pipeline** существуют для разделения границ перехватчиков от логических границ тестов.
- **Полиморфные слушатели** позволяют перехватывать несколько типов событий одним обработчиком, слушая родительские классы.
