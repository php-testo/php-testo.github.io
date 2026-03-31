---
llms: "optional"
llms_description: "Convention-based test discovery: *Test class suffix, test* method/function prefix"
---

# Naming Conventions

The plugin discovers tests by class, method, and function naming conventions — no attributes required.

<plugin-info name="Convention" class="\Testo\Convention\NamingConventionPlugin" />

Recognized patterns:

- **Class + Method** — `*Test` suffix on class and `test*` prefix on methods
- **Function** — `test*` prefix on function

```php
final class UserServiceTest
{
    public function testCreatesUser(): void { /* ... */ }

    public function testDeletesUser(): void { /* ... */ }

    public function testUpdatesProfile(): void { /* ... */ }
}

function testEmailValidator(): void { /* ... */ }
```

You can customize suffixes and prefixes, and allow or disallow private method discovery:

```php
new SuiteConfig(
    // ...
    plugins: [
        new NamingConventionPlugin(
            caseSuffix: 'Test',
            testPrefix: 'test',
            allowPrivate: false,
        ),
    ]
),
```

## When to Use

Use naming conventions when:

- You prefer **implicit** test discovery without extra attributes
- You're migrating from PHPUnit or other frameworks that use similar patterns
- You want tests to be recognizable at a glance by their names
