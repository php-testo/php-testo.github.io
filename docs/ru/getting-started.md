# Начало работы

Это руководство поможет вам начать работу с Testo в вашем PHP проекте.

## Установка

Установите Testo через Composer:

```bash
composer require --dev php-testo/testo
```

## Написание первого теста

Создайте файл теста в директории `tests`:

```php
<?php

use function Testo\{test, expect};

test('базовая математика работает', function () {
    expect(1 + 1)->toBe(2);
});

test('строки можно объединять', function () {
    $greeting = 'Привет, ' . 'Мир!';
    expect($greeting)->toBe('Привет, Мир!');
});
```

## Запуск тестов

Запустите тесты с помощью CLI Testo:

```bash
vendor/bin/testo
```

Вы увидите вывод:

```
PASS  tests/ExampleTest.php
  ✓ базовая математика работает
  ✓ строки можно объединять

Tests: 2 passed
Time:  0.05s
```

## Следующие шаги

- Изучите Утверждения
- Узнайте про Организацию тестов
- Настройте Параллельное выполнение
