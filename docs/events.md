# Events

Testo emits events throughout the test execution lifecycle. Events are your primary extension point for customizing test behavior, collecting metrics, or integrating with external tools.

## Event System Basics

Events in Testo are classes, following [PSR-14](https://www.php-fig.org/psr/psr-14/) event dispatcher standard.

Event characteristics:
- **Immutable** - you cannot modify event objects. Listen and react, don't mutate.
- **Type-safe** - every event is a concrete class with typed properties.
- **Hierarchical** - events are organized by scope: suite → case → test.
- **Polymorphic** - you can listen to parent classes or interfaces to catch multiple event types.

## Registering Event Listeners

Register listeners via `EventListenerCollector` interface in your plugins. See [plugins](./plugins.md) for plugin development.

```php
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
        // React to test completion
        $testInfo = $event->testInfo;
        $result = $event->testResult;
    }
}
```

**Priority:** Higher values execute first. Default is `0`.

## Event Hierarchy

Events fire at three levels of granularity:

### Test Suite Level

Test Suite (Unit, Integration, etc.) defined in configuration. Contains multiple test cases (classes).

```
TestSuitePipelineStarting      # Before test suite interceptors
  TestSuiteStarting            # Test suite execution begins
    ... test cases run ...
  TestSuiteFinished            # Test suite execution ends
TestSuitePipelineFinished      # After test suite interceptors
```

### Test Case Level

One test class = one test case. Contains multiple test methods.

```
TestCasePipelineStarting       # Before test case interceptors
  TestCaseStarting             # Test case execution begins
    ... test methods run ...
  TestCaseFinished             # Test case execution ends
TestCasePipelineFinished       # After test case interceptors
```

### Test Method Level

One test method. May contain multiple test runs (via data providers or retries).

```
TestPipelineStarting           # Before test method interceptors
  TestBatchStarting            # Batch begins (for data providers/retries)
    TestStarting               # Single test run starts
      ... test execution ...
    TestFinished               # Single test run ends
    TestRetrying               # (optional) Test will be retried
    TestStarting               # Retry attempt starts
      ... test execution ...
    TestFinished               # Retry attempt ends
  TestBatchFinished            # Batch ends
TestPipelineFinished           # After test method interceptors
```

## Event Ordering Rules

1. **Pipeline events** always wrap execution:
   - `*PipelineStarting` fires first
   - `*PipelineFinished` fires last

2. **Starting/Finished pairs** always match:
   - Every `*Starting` has a corresponding `*Finished`
   - Even if execution fails or is skipped

3. **Hierarchy flows downward:**
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

4. **Batches group runs:**
   - `TestBatchStarting` fires once per test method
   - Contains multiple `TestStarting`/`TestFinished` pairs
   - Ends with `TestBatchFinished` containing aggregated result

5. **Retries fire between runs:**
   - `TestFinished` (failed)
   - `TestRetrying` (decision to retry)
   - `TestStarting` (retry attempt begins)

## Polymorphic Listeners

Since events are classes, you can listen to parent classes or interfaces to handle multiple event types in one listener.

### Listen to All Test Events

```php
$events->addListener(TestEvent::class, function (TestEvent $event) {
    // Fires for: TestStarting, TestFinished, TestRetrying, TestBatchStarting, etc.
    $this->logger->debug("Test event: " . get_class($event));
});
```

### Listen to All Events with Results

```php
$events->addListener(TestResultEvent::class, function (TestResultEvent $event) {
    // Fires for: TestFinished, TestBatchFinished, TestPipelineFinished
    if ($event->testResult->isFailed()) {
        $this->notifyFailure($event);
    }
});
```

### Listen to All Test Case Events

```php
$events->addListener(TestCaseEvent::class, function (TestCaseEvent $event) {
    // Fires for all TestCase* events (test case level)
    $this->trackCase($event->caseInfo);
});
```

This is useful when you don't care about the specific event type, only the data it carries.

## Custom Event Dispatcher

Testo uses PSR-14 compliant event dispatcher. You can replace it via the [plugin system](./plugins.md) by providing your own `EventDispatcherInterface` and `EventListenerCollector` implementations (PSR-14 doesn't define listener configuration, so Testo uses `EventListenerCollector` as the API for this).

**Warning:** While Testo's core doesn't depend on events, many components do. Using a `NullDispatcher` or non-functional dispatcher will break:
- Built-in renderers (progress reporting, output formatting)
- Plugins that rely on events
- Integration with external tools

Only replace the dispatcher if you understand the implications.

## Important Notes

- **Events are read-only.** You cannot change test outcomes by modifying events.
- **Listeners execute synchronously.** Heavy processing will slow down test execution.
- **Exceptions in listeners will halt execution.** Handle errors gracefully.
- **Priority matters.** If listener order is important, use explicit priorities.
- **Pipeline events** exist to separate interceptor boundaries from logical test boundaries.
- **Polymorphic listeners** let you catch multiple event types with one handler by listening to parent classes.
