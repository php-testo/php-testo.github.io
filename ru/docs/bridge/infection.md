---
outline: [2, 3]
---

# Infection

[Infection](https://infection.github.io/) — инструмент [мутационного тестирования](/ru/docs/theory/mutation-testing.md) для PHP. Testo подключается к нему через отдельный адаптер `testo/bridge-infection`.

::: info Пакет
`testo/bridge-infection` — расширение для Infection. Регистрируется само через Composer, добавлять плагин в `testo.php` не нужно.
:::

## Настройка

Поставьте Infection и пакет интеграции как dev-зависимости:

```bash
composer require --dev infection/infection testo/bridge-infection
```

::: warning
Если вы используете [Phar-архив Infection](https://infection.github.io/guide/installation.html#Phar), то адаптер устанавливать не нужно — он уже включён в состав Phar.
:::

В настройках Infection (обычно `infection.json`) достаточно указать, что тесты запускаются через Testo:

```json
{
    "$schema": "vendor/infection/infection/resources/schema.json",
    "source": {
        "directories": ["src"]
    },
    "testFramework": "testo"
}
```

Для сбора покрытия понадобится расширение PCOV или XDebug. О настройке расширений и компромиссах между ними подробно написано на странице <plugin>Codecov</plugin>.

Дальше запускайте мутационное тестирование как обычно — через [плагин для IDE](https://plugins.jetbrains.com/plugin/28650-infection) или из консоли:

```bash
vendor/bin/infection
```

## Как это работает

Этот раздел — для тех, кому интересны детали. Для обычной работы достаточно настройки выше.

### Какие отчёты нужны Infection

Infection берёт у Testo два отчёта:

- **Coverage XML** — папка с XML-файлами в формате PHPUnit Coverage. По нему Infection понимает, какими тестами покрыта каждая строка кода, чтобы для каждого мутанта запускать только нужный набор тестов. **Обязательно**.
- **JUnit XML** — единый файл с результатами тестов. Помогает Infection быстро сопоставлять тест с файлом, в котором он лежит, чтобы эффективнее пользоваться фильтрами Testo. **Опционально**, но рекомендуется.

Оба отчёта адаптер запрашивает у Testo автоматически: на начальном прогоне он передаёт `--coverage`, `--coverage-xml=<tmpDir>/infection/coverage-xml` и `--log-junit=<tmpDir>/infection/junit.xml`. Эти флаги активируют теневой плагин <plugin>Codecov</plugin> из набора по умолчанию, поэтому отчёты генерируются, даже если в `testo.php` нет ни одного плагина покрытия.

Infection ищет отчёты в фиксированной структуре относительно своей временной директории `tmpDir`:

```
└── <tmpDir>/
    └── infection/
        ├── coverage-xml/*.xml
        └── junit.xml
```

`tmpDir` — опция конфига Infection (`infection.json`); по умолчанию это системная временная папка. Подпапку `infection/` внутри неё Infection дописывает сам, а адаптер передаёт Testo уже готовые пути.

### Двойной прогон

Infection прогоняет Testo дважды:

1. **Начальный прогон** — запускает все тесты против оригинального кода и параллельно собирает покрытие и JUnit-лог. Это медленная фаза: тесты идут целиком, а драйвер покрытия активен.
2. **Прогон мутантов** — для каждого мутанта Infection берёт только те тесты, которые задевают изменённые строки, и запускает их. Покрытие здесь уже не собирается, поэтому каждый мутант проверяется быстро.

::: info Бенчмарки исключены
На обоих прогонах адаптер передаёт `--type=!bench`: бенчмарки медленные и привязаны ко времени, не дают осмысленного вердикта pass/fail для мутационного тестирования, поэтому из прогонов Infection они исключаются.
:::

### Переиспользование готового покрытия

Если отчёт о покрытии уже сгенерирован — например, на предыдущем шаге CI — его можно подсунуть Infection вместо нового прогона Testo с помощью [флага `--coverage`](https://infection.github.io/guide/command-line-options.html#coverage):

```bash
vendor/bin/infection --coverage=runtime/infection
```

В этом режиме Infection пропускает свой начальный прогон, а указанная директория должна содержать уже готовые отчёты.

Чтобы получить эти отчёты, запустите Testo с теми же флагами, что использует адаптер на начальном прогоне:

```bash
vendor/bin/testo run --coverage \
    --coverage-xml=runtime/infection/coverage-xml \
    --log-junit=runtime/infection/junit.xml
```

Важно, чтобы структура папок и имена файлов совпадали с тем, что ожидает Infection.

### Дополнительные отчёты

Если помимо мутационного тестирования вам нужны и другие отчёты (например, Clover для Codecov.io), добавьте свой <class>\Testo\Codecov\CodecovPlugin</class> с нужными генераторами. Он не конфликтует с флагами адаптера — оба набора отчётов сливаются в один сбор покрытия (см. раздел [«Активация через CLI»](/ru/docs/plugins/codecov.md) плагина Codecov):

```php
use Testo\Application\Config\ApplicationConfig;
use Testo\Codecov\CodecovPlugin;
use Testo\Codecov\Report\CloverReport;

return new ApplicationConfig(
    src: ['src'],
    plugins: [
        new CodecovPlugin(
            reports: [
                new CloverReport(__DIR__ . '/runtime/clover.xml', 'MyProject'),
            ],
        ),
    ],
);
```
