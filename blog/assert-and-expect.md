# Testo. Assert and Expect

![Testo Assert and Expect](/blog/assert-and-expect/img-1.jpg)

Let's talk about the pitfalls of reinventing the wheel that I've already stumbled upon while building a new testing framework [Testo](https://github.com/php-testo/testo).

PHPUnit provides multiple ways to write the same assertions in tests:

```php
self::assertTrue(...);
$this->assertTrue(...);
assertTrue(...);
```

All these calls lead to one place — the `Assert` facade with ~2300 lines.

::: info 🤔
Did you know that PHPUnit has neither a standalone `expectException()` function nor a method with the same name in the `Assert` facade?
In test code, you can only write `$this->expectException()`.
:::

That's because in PHPUnit tests inherit from `TestCase` (~2400 lines, extends `Assert`), which stores and handles all the test state. Reminds me of Symfony Console architecture, the worst I've encountered so far.

How are test state and `assertException` related? The thing is, `expect` (expectation) differs slightly from `assert` (assertion) in both semantics and mechanics:

- Assertions are checked here and now, "check and forget" style.
- Expectations are checked later (after test completion), i.e., "remember now, check at the end".

**Testo has a different policy.**

From Testo's perspective, the test class belongs to the developer, not the framework. All meta-information and runtime data needed by the framework is stored and processed elsewhere.

That's why test classes don't need to inherit from `TestCase`. In Testo, a test case doesn't run itself and doesn't even know its name in the test environment. This allows for cleaner code, and we can use the constructor however we want.

Tests can even be plain user-defined functions!

```php
#[Test]
function simpleTest(): void
{
    // test something
}
```

::: tip 🧠
But now we face a tricky question with lots of room for imagination: **how do we provide a convenient API for assertions?**
:::

Sure, we could eventually create a hundred functions, a trait, and a base class with PHPUnit-like syntax... But hey, let's try to find something better first!

## Shorter and clearer

I decided to start like the [webmozarts/assert](https://github.com/webmozarts/assert) library: since we no longer need to write `self::` or `$this->`, let's keep it simple: `Assert::same()`. I chose the familiar PHPUnit parameter order: **$expected** first, then **$actual** (webmozart puts the value being checked first, then the expected value, which actually **looks more logical**).

Off we went. Made `::same()`, `::notSame`, `::null()`, `::true()`, `::false()`, `::equals()`, `::notEquals()`.

Then we got to `Assert::greaterThan()`. In PHPUnit, the argument order is the same: **$expected** first, then **$actual**.

So if we want to say `$foo is greater than 42`, we have to write `greaterThan(42, $foo)`.

![greaterThan](/blog/assert-and-expect/img-2.png)

Looks disgusting, since everywhere else we use mathematical notation like `$foo > 42`.

After some deliberation, the most understandable, short, and readable option won.
Can you guess which one?

```php
Assert::compare($foo, '>', 42);

Assert::satisfies($foo, '>', 42);

Assert::that($foo)->greaterThan(42);

Assert::true($foo > 42);
```

::: warning ☝
This led us to a strategic decision: provide only "complex" assertions that save characters or entire lines of code.
:::

---

When it came to `expectException()`, the `Assert` facade started feeling uncomfortable.
Initially it looked like `Assert::exception()`. The awkwardness stems from that difference mentioned at the beginning: the semantics (meaning) and mechanics of assertions (checking "here and now").

What are we asserting here? That we assert that we expect an exception to be thrown from the test?

This bugged me for a long time. Lucky Bergmann with his inheritance — no need to think about naming semantics in facades — just shove everything into `$this` and problem solved.

Eventually I came to the conclusion that we need a second facade `Expect`, which would provide post-check assertions.

Pros:

- Developers immediately recognize which check will be performed afterwards.
- No naming dissonance.

Cons:

- No autocomplete from the `Assert` facade, and you need to remember about the second facade. Well, you just have to get used to it.

![Meme](/blog/assert-and-expect/img-3.jpg)

---

## Trying something new

Instead of adding tons of sugar like `::stringContains()`, `::stringEndsWith()` (and 20 more `string*` methods) into one facade, we can group methods by semantics or type:

```php
// Strings
Assert::string($string)->contains("str");

// Files
Assert::file("foo.txt")->notExists();

// Exceptions
Expect::exception(Failure::class)
    ->fromMethod(Service::class, 'process')
    ->withMessage("foo bar");
```

This way, at the start of the pipe in `Assert::string()`, we immediately verify that we're actually receiving a string, and in `->contains(...)` we perform the check already confident we're working with the right type.

Code takes less space, facades aren't bloated. Now this is what looks truly elegant. Whether it's usable or not — practice will tell.

![Pipe assertions](/blog/assert-and-expect/img-4.jpg)

---

So we made several of these pipe assertions.

```php
#[Test]
public function checkIterableTraitMethods(): void
{
    Assert::instanceOf(\DateTimeInterface::class, new \DateTimeImmutable());
    // Shorthand for Assert::object($object)->instanceOf($class);

    Assert::int(15)->greaterThan(10);

    Assert::array([1,2,3])->allOf('int')->contains(3)->hasKeys(0)->sameSizeAs([4,5,6,7]);
}
```

Can we turn this into useful output?

In Testo, I planned for assertion logging per test from the start. This mechanism had to be reworked a bit for composites after pipe assertions appeared, but that's beside the point.

Let's try displaying the assertion list and see what comes out of it.

**Compact variant.** I like it, but it looks a bit rough and might not appeal to those who dislike abbreviations over language constructs.

![Compact variant](/blog/assert-and-expect/img-5.png)

**Fuller variant.** Here all checks in the pipe are listed separated by semicolons. Reads like a book, and the nested tree element contains the full exception text.

![Fuller variant](/blog/assert-and-expect/img-6.png)

How to improve all this — unclear for now. Maybe go back to compact?

We're also trying out how it would look in an IDE. Will this be useful?

![In IDE](/blog/assert-and-expect/img-7.png)

There's also an option to output each assertion as a nested checkmark in the test tree (like DataSet), but I think that would be too cluttered.

::: tip ☝
It might seem like there are only more open questions. But over time, not only questions appear, but expertise grows too: each answer to a closed question is backed by mental or practical experience.
:::

The final word on assert/expect hasn't been said. But while Testo hasn't reached a stable release, we can afford any experiments.

I won't be surprised if in the future we decide that **$expected** should come after **$actual**, that pipe assertions aren't as convenient and we need functions, and that assertion history output is overkill.

---

[Join](https://t.me/spiralphp/10863) the discussion or development, propose your wildest ideas or features. It's interesting.

Special thanks to:

- [@petrdobr](https://github.com/petrdobr) for help with assertion implementation.
- [@xepozz](https://github.com/xepozz/) for the [IDE plugin](https://plugins.jetbrains.com/plugin/28842-testo), which needs your stars.
