# Конвенции именования

Плагин обнаруживает тесты согласно конвенции по именованию классов, методов и функций без необходимости использования атрибутов.

<plugin-info name="Convention" class="\Testo\Convention\NamingConventionPlugin" />

Распознаваемые паттерны:

- **Класс + Метод** — суффикс `*Test` на классе и префикс `test*` на методах
- **Функция** — префикс `test*` на функции

```php
final class UserServiceTest
{
    public function testCreatesUser(): void { /* ... */ }

    public function testDeletesUser(): void { /* ... */ }

    public function testUpdatesProfile(): void { /* ... */ }
}

function testEmailValidator(): void { /* ... */ }
```

Вы можете настроить суффиксы и префиксы, а также разрешить или запретить обнаружение приватных методов:

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

## Когда использовать

Используйте конвенции именования, когда:

- Предпочитаете **неявное** обнаружение тестов без дополнительных атрибутов
- Мигрируете с PHPUnit или других фреймворков с похожими паттернами
- Хотите, чтобы тесты были узнаваемы по именам с первого взгляда
