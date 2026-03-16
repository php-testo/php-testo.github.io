---
llms_description: "Overview of test declaration approaches: methods in classes, standalone functions, inline attributes, discovery strategies"
---

# Writing Tests

Testo doesn't care where a test lives, as long as it can be executed.

## Where to Write Tests

- **In methods** — in regular classes without `TestCase` inheritance.
- **In functions** — in standalone functions outside classes.
- **In attributes** — directly on the method being tested. See [Inline Tests](plugins/inline.md).

## Test Discovery

Depending on the configured [plugins](plugins.md), Testo can discover tests in several ways:

- **Explicit** — the [#\[Test\] attribute](plugins/test.md) marks a method, function, or class.
- **Conventions** — [naming patterns](plugins/convention.md) like `testSomething()` methods or `*Test` classes.
- **Custom strategies** — you can implement your own test discovery, for example by function-call (like PEST) or by class parent, like PHPUnit.

All approaches can be combined in one project or even in one Test Suite.

## Less Code

- **Parameterization** — instead of copying a test for each data set, write one test and pass it different values via [data providers](plugins/data.md).
- **Interceptor attributes** — extract repetitive boilerplate into reusable attributes.
