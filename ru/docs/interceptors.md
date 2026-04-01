# Перехватчики

::: tip Coming Soon
Документация в процессе написания.
:::

## Атрибуты с автоматическим подключением интерцептора

Интерцептор можно подключить автоматически через PHP-атрибут, без явной регистрации в пайплайне.

Для этого создайте атрибут, реализующий интерфейс <class>\Testo\Pipeline\Attribute\Interceptable</class>, и пометьте его мета-атрибутом <attr>\Testo\Pipeline\Attribute\FallbackInterceptor</attr>. Когда Testo обнаруживает такой атрибут на тесте, указанный интерцептор подключается автоматически.

```php
use Testo\Pipeline\Attribute\FallbackInterceptor;
use Testo\Pipeline\Attribute\Interceptable;

#[\Attribute(\Attribute::TARGET_METHOD | \Attribute::TARGET_CLASS)]
#[FallbackInterceptor(SlowTestInterceptor::class)]
final readonly class SlowTest implements Interceptable
{
    public function __construct(
        public int $thresholdMs = 1000,
    ) {}
}
```

После этого атрибут можно использовать на тестах, и `SlowTestInterceptor` будет автоматически подключен к пайплайну:

```php
#[SlowTest(thresholdMs: 500)]
public function heavyComputation(): void
{
    // Если тест выполняется дольше 500 мс,
    // SlowTestInterceptor может пометить его или залогировать
}
```

Этот подход удобен, когда поведение привязано к конкретным тестам. Именно так устроены атрибуты <attr>\Testo\Retry</attr>, <attr>\Testo\Inline\TestInline</attr> и <attr>\Testo\Bench</attr>.
