---
outline: [2, 3]
---

# Infection

[Infection](https://infection.github.io/) — инструмент мутационного тестирования для PHP. Он вносит в исходный код мелкие правки («мутации») — заменяет `>` на `>=`, убирает вызов метода, превращает `true` в `false` — и заново прогоняет ваши тесты против каждой такой версии. Если после мутации тесты всё ещё проходят, значит они на самом деле не проверяют то поведение, которое должны бы. Покрытие по строкам такого не покажет, а мутационное тестирование — да.

К Infection Testo подключается через отдельный пакет — `php-testo/bridge-infection`. Он регистрируется как расширение Infection и позволяет тому использовать Testo в качестве движка для запуска тестов.

::: info Пакет
`php-testo/bridge-infection` — расширение для Infection. Регистрируется автоматически через Composer. Никаких плагинов в `testo.php` добавлять не нужно.
:::

## Установка

Поставьте Infection и пакет интеграции как dev-зависимости:

```bash
composer require --dev infection/infection php-testo/bridge-infection
```

::: warning
Если вы используете [Phar-архив Infection](https://infection.github.io/guide/installation.html#Phar), то адаптер устанавливать не нужно — он уже включён в состав Phar.
:::

## Конфигурация

Для работы Infection требуются два отчёта от Testo:

- **Coverage XML** — папка с XML-файлами в формате PHPUnit Coverage. По нему Infection понимает, какими тестами покрываются строки кода, чтобы запускать только нужный набор тестов для каждого мутанта. **Обязательно**.
- **JUnit XML** — единый файл с результатами тестов. Помогает Infection быстро сопоставлять тест с файлом, в котором он лежит, чтобы эффективнее пользоваться фильтрами Testo. **Опционально**, но сильно рекомендуется.

Оба отчёта Infection ищет в фиксированной структуре:

```
└── <tmpDir>/
    └── infection/
        ├── coverage-xml/*.xml
        └── junit.xml
```

::: danger Важный момент:
`tmpDir` мы должны указать в настройках Infection а путь до `coverage-xml` — в `testo.php`.
::: 

### infection.json

В настройках Infection (обычно `infection.json`) укажите, что вы используете Testo, и настройте временную директорию:

```json
{
    "$schema": "vendor/infection/infection/resources/schema.json",
    "source": {
        "directories": ["src"]
    },
    "testFramework": "testo",
    "tmpDir": "runtime",
    "logs": {
        "text": "runtime/infection.log",
        "html": "runtime/infection.html"
    }
}
```

### testo.php

Зарегистрируйте плагин <plugin>Codecov</plugin> с отчётом <class>\Testo\Codecov\Report\PhpUnitXmlReport</class>, указывающим на папку `<tmpDir>/infection/coverage-xml`:

```php
use Testo\Application\Config\ApplicationConfig;
use Testo\Codecov\CodecovPlugin;
use Testo\Codecov\Report\PhpUnitXmlReport;

return new ApplicationConfig(
    src: ['src'],
    plugins: [
        new CodecovPlugin(
            reports: [
                new PhpUnitXmlReport(__DIR__ . '/runtime/infection/coverage-xml'),
            ],
        ),
    ],
);
```

::: info
Для сбора покрытия требуется расширение PCOV или XDebug. О настройке расширений и компромиссах между ними подробно написано на странице <plugin>Codecov</plugin>.
:::

## Запуск

```bash
XDEBUG_MODE=coverage vendor/bin/infection
```

Можно использовать PCOV — требования к драйверу покрытия диктует <plugin>Codecov</plugin>, а не Infection.

Infection прогоняет Testo дважды:

1. **Начальный прогон** — запускает все тесты против оригинального кода и параллельно собирает покрытие и JUnit-лог. Это медленная фаза: тесты идут целиком, а драйвер покрытия активен.
2. **Прогон мутантов** — для каждого мутанта Infection берёт только те тесты, которые задевают изменённые строки, и запускает их. Покрытие здесь уже не собирается, поэтому каждый мутант проверяется быстро.

### Переиспользование готового покрытия

Если отчёт о покрытии уже сгенерирован — например, на предыдущем шаге CI — его можно подсунуть Infection вместо нового прогона Testo с помощью [флага `--coverage`](https://infection.github.io/guide/command-line-options.html#coverage):

```bash
vendor/bin/infection --coverage=runtime/infection
```

В этом режиме Infection пропускает свой начальный прогон, а указанная директория должна содержать уже готовые отчёты.

Чтобы получить эти отчёты, запустите Testo с флагами `--coverage --log-junit=<tmpDir>/infection/junit.xml` — так же, как это делает адаптер для начального прогона. Важно, чтобы структура папок и имена файлов совпадали с тем, что ожидает Infection.
