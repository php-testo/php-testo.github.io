---
llms: "footer"
llms_description: "Best practices for writing tests with Testo: when to add PHPDoc, how to avoid duplication with parameterized tests, and tips for generating comprehensive test coverage."
llms_priority: 1
---

## Best Practices

1. **Mark the class as a test.** Put `\Testo\Test` on the class, not on every method — every public `void`/`never` method is picked up automatically. Use method-level `\Testo\Test` only when the class isn't a pure test case or a test method is private.
2. **Add PHPDoc only when the name isn't enough.** The block becomes the test description in reports. Skip it when the method name already says everything — an empty description beats a redundant one.
3. **Declare the coverage scope with `\Testo\Codecov\Covers`.** Place it on the class; move down to a method only when that test targets something different. The attribute is repeatable. For free functions pass the FQN as a string: `#[Covers('Acme\\format_price')]`. Use `\Testo\Codecov\CoversNothing` for smoke checks that shouldn't affect coverage.
4. **Follow Arrange-Act-Assert.** Separate the three phases with a single blank line — no `// arrange` / `// act` / `// assert` comments. If a phase gets unreadable, use semantic comments, or extract a helper or split the test.
5. **Parameterize when only data differs.** Pick the right attribute for the shape of the data:
   - `\Testo\Data\DataSet` — inline cases declared right on the test method; reach for it whenever a separate provider would be overkill.
   - `\Testo\Data\DataProvider` — large or reused sets, or when data generation needs logic; returns `iterable`, string keys become labels.
   - `\Testo\Data\DataCross` — combine separate providers, typically to pair inputs with their expected outcomes.

   Each dataset label appears in failure reports — make it describe the scenario, not the data.
6. **Cover both positive and negative paths.** Verify expected behaviour, invalid input, and boundary values: off-by-one (`0`, `1`, `n-1`, `n`, `n+1`), empty/null, type limits (`PHP_INT_MAX`, `PHP_INT_MIN`), transitions between valid and invalid ranges. These matter most for mutation testing.

### Examples

A typical test class — `\Testo\Test` and `\Testo\Codecov\Covers` on the class, AAA in every test body separated by blank lines, PHPDoc only where the method name leaves something unsaid:

```php
use Testo\Assert;
use Testo\Codecov\Covers;
use Testo\Test;

#[Test]
#[Covers(UserService::class)]
final class UserServiceTest
{
    public function createsUser(): void
    {
        $service = new UserService(new InMemoryRepository());

        $user = $service->create('Alice', 'alice@example.com');

        Assert::same('Alice', $user->name);
    }

    /**
     * Null is returned instead of throwing when the user is missing,
     * so callers can handle the case without try/catch.
     */
    public function returnsNullForUnknownId(): void
    {
        $service = new UserService(new InMemoryRepository());

        $user = $service->find(999);

        Assert::null($user);
    }
}
```

Boundary values fit `\Testo\Data\DataSet` well — each case is one attribute on the method, the values live next to the assertion they drive, and adding another boundary is a one-line change:

```php
#[DataSet([12,  false], 'below minimum')]
#[DataSet([13,  true],  'minimum')]
#[DataSet([120, true],  'maximum')]
#[DataSet([121, false], 'above maximum')]
public function rejectsAgesOutsideRange(int $age, bool $accepted): void
{
    $service = new UserService(new InMemoryRepository());

    Assert::same($accepted, $service->canRegister($age));
}
```

Reach for `\Testo\Data\DataProvider` when the cases need code to produce — generated programmatically or loaded from a fixture file:

```php
#[DataProvider('emailFixtures')]
public function validatesEmail(string $email, bool $expected): void
{
    Assert::same($expected, UserService::isValidEmail($email));
}

public static function emailFixtures(): iterable
{
    $cases = json_decode(file_get_contents(__DIR__ . '/fixtures/emails.json'), true);
    foreach ($cases as $label => [$input, $expected]) {
        yield $label => [$input, $expected];
    }
}
```

When the same dataset feeds several tests, lift it into an invokable provider class and reference it by instance — one source of truth, no copy-paste:

```php
final class CommonPasswords
{
    public function __invoke(): iterable
    {
        yield 'too short'     => ['abc'];
        yield 'all digits'    => ['12345678'];
        yield 'leaked top-10' => ['password'];
    }
}

#[DataProvider(new CommonPasswords())]
public function rejectsCommonPassword(string $password): void { ... }

#[DataProvider(new CommonPasswords())]
public function suggestsStrongerPassword(string $password): void { ... }
```

When positive and negative cases come from separate providers, pair each with its expected outcome via `\Testo\Data\DataCross`:

```php
#[DataCross(new DataProvider('validEmails'), new DataSet([true]))]
#[DataCross(new DataProvider('invalidEmails'), new DataSet([false]))]
#[Covers(UserService::class, 'isValidEmail')]
public function validatesEmail(string $email, bool $expected): void
{
    Assert::same($expected, UserService::isValidEmail($email));
}
```

A test that should be excluded from coverage entirely:

```php
#[Test]
#[CoversNothing]
public function smokeBootstrap(): void { ... }
```
