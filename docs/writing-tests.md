# Writing Tests

Testo doesn't care where a test lives, as long as it can be wrapped in a Closure. Currently supported:

- **Classes** — tests are methods in regular classes, no base class inheritance required.
- **Functions** — tests can be standalone functions.
- **[Inline Tests](./inline-tests)** — for simple pure functions, tests as attributes directly on the method being tested.

Depending on the configuration, Testo can discover tests in several ways:

- **Explicit** — the [#\[Test\] attribute](./test-attribute) marks a method, function, or class.
- **Conventions** — [naming patterns](./naming-conventions) like `testSomething()` methods or `*Test` classes.
- **Custom strategies** — you can implement your own test discovery, for example by function-call (like PEST, but without execution) or by class parent, like PHPUnit.

All approaches can be combined in one project or even in one Test Suite.
