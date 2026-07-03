---
outline: [2, 3]
faqLevel: false
---

# Rector

[Rector](https://github.com/rectorphp/rector) — инструмент, который автоматически преобразует PHP-код по заданным правилам, работая на уровне синтаксического дерева (AST). Пакет `testo/bridge-rector` предоставляет две вещи: набор готовых правил, которые **конвертируют тесты между Pest, PHPUnit и Testo**, и обвязку для **тестирования собственных правил Rector**.

<plugin-info class="\Testo\Bridge\Rector\Testing\RectorTestingPlugin" name="RectorTesting" />

## Установка

```bash
composer require --dev testo/bridge-rector rector/rector
```

## Правила конвертации

Правила нужны, чтобы перевести уже написанный набор тестов с одного фреймворка на другой без ручной переписки: например, мигрировать проект с PHPUnit или Pest на Testo, уйти обратно на PHPUnit или получить зеркальную PHPUnit-копию тестов для запуска сторонним раннером.

Конвертация работает в трёх направлениях, и каждое из них оформлено как готовый набор правил Rector. Ссылаться на набор удобно через константу <class>\Testo\Bridge\Rector\Set\TestoRectorSetList</class> — так не придётся ни держать в голове путь, ни вручную собирать список отдельных правил.

| Направление | Константа набора |
|-------------|------------------|
| Testo → PHPUnit | `TestoRectorSetList::TESTO_TO_PHPUNIT` |
| PHPUnit → Testo | `TestoRectorSetList::PHPUNIT_TO_TESTO` |
| Pest → Testo | `TestoRectorSetList::PEST_TO_TESTO` |


### Запуск конвертации

Своей CLI-команды адаптер не добавляет — конвертация запускается штатным Rector. Подключите нужный набор в конфиге `rector.php`, укажите папку с тестами и запустите обработку:

```php
// rector.php
use Rector\Config\RectorConfig;
use Testo\Bridge\Rector\Set\TestoRectorSetList;

return RectorConfig::configure()
    ->withPaths([__DIR__ . '/tests'])
    ->withSets([TestoRectorSetList::PHPUNIT_TO_TESTO]);
```

```bash
vendor/bin/rector process
```

Rector пройдёт по указанным файлам и перепишет их на месте, поэтому результат удобно просмотреть обычным `git diff` перед коммитом.

::: info Не всё конвертируется
Часть конструкций перевести нельзя — у них просто нет точного аналога в целевом фреймворке. Набор их не трогает: код остаётся как есть, чтобы вы могли доперевести такие места вручную.
:::

::: question Что происходит с тестом, который нельзя сконвертировать?
Зависит от того, что именно неконвертируемо. Отдельную конструкцию без аналога (мок, PHPUnit-constraint, `arch()`-тест Pest) набор оставляет в коде как есть — остальное в тесте переписывается, а это место вы дочищаете руками. Если же целому тесту нужен живой рантайм Testo (направление Testo → PHPUnit), он превращается в видимый `markTestSkipped()` с причиной, а остальные тесты класса продолжают работать. Молча не удаляется ничего.
:::

## Тестирование своих правил

Если вы пишете собственные правила Rector, Testo предлагает для их тестирования более удобную обвязку. Она никак не связана с конвертацией тестов — это самостоятельный инструмент для авторов правил, и пользоваться им можно в любом проекте, где есть Testo.

Тестирование правил через PHPUnit требует на каждое правило отдельный класс-наследник `AbstractRectorTestCase` с одинаковым Data-Provider'ом и методом теста. Вместо этого боилерплейта достаточно **одного атрибута прямо на правиле**: Testo сам находит его фикстуры и превращает каждую в отдельный набор данных — тот же принцип, что у плагина <plugin>Inline</plugin>.

Вдобавок вход и ожидаемый выход каждой фикстуры выводятся в канал мессенджера, так что прямо в отчёте видно «было → стало» по каждому случаю:

![Фикстуры Rector в каналах мессенджера](/docs/bridge/rector-fixtures-channels.png)

### Настройка

Обвязка подключается как обычный плагин комплекта тестов. Заведите комплект, который сканирует исходники ваших правил, и добавьте в него <class>\Testo\Bridge\Rector\Testing\RectorTestingPlugin</class>:

```php
// suites.php
use Testo\Application\Config\FinderConfig;
use Testo\Application\Config\SuiteConfig;
use Testo\Bridge\Rector\Testing\RectorTestingPlugin;

return [
    new SuiteConfig(
        name: 'Rector',
        location: new FinderConfig(include: [__DIR__ . '/src']),
        plugins: [new RectorTestingPlugin()],
    ),
];
```

Плагин находит все правила с атрибутом <attr>\Testo\Bridge\Rector\Testing\TestRectorFixtures</attr> и прогоняет их фикстуры.

<signature h="3" name="#[\Testo\Bridge\Rector\Testing\TestRectorFixtures(string ...$paths)]">
<short>Объявляет фикстуры, которые проверяют правило Rector.</short>
<description>
Ставится на класс правила. Принимает один или несколько путей к фикстурам — папки или отдельные файлы; в папке ищутся фикстуры `*.php.inc`.

Плагин разворачивает правило в один набор данных на каждую фикстуру — так же, как <attr>\Testo\Data\DataProvider</attr> разворачивает параметризованный тест.
</description>
<param name="$paths">Пути к папкам или файлам с фикстурами — относительные (от файла правила) или абсолютные, в пределах проекта.</param>
<example>
```php
#[TestRectorFixtures('Fixture/AssertCallToTestoRector')]
final class AssertCallToTestoRector extends AbstractRector { /* … */ }
```
</example>
</signature>

### Формат фикстуры

Фикстура — это файл `*.php.inc`, в котором вход и ожидаемый выход разделены строкой `-----`. Если разделителя нет, правило обязано оставить вход **без изменений** — удобно для случаев «сюда не лезть»:

```php
<?php

class SomeTest
{
    public function test()
    {
        $this->markTestIncomplete('todo');
    }
}
-----
<?php

class SomeTest
{
    public function test()
    {
        throw new \Testo\Core\Exception\SkipTest('Incomplete: todo');
    }
}
```

Каждая фикстура прогоняется через свежесозданный контейнер Rector и выводится как отдельный набор данных, поэтому неудавшаяся конвертация сразу указывает на проблемный файл.
