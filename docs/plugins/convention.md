---
llms: "optional"
llms_description: "Convention-based test discovery: *Test class suffix, test* method/function prefix"
---

# Naming Conventions

Testo can discover tests by naming patterns — no attributes required.

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

## When to Use

Use naming conventions when:

- You prefer **implicit** test discovery without extra attributes
- You're migrating from PHPUnit or other frameworks that use similar patterns
- You want tests to be recognizable at a glance by their names
