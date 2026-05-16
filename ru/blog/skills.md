---
title: "Скиллы для AI-агентов"
date: 2026-05-14
description: "В Testo приехал набор AI-скиллов для агентов. И заодно — Composer-плагин, чтобы тащить скиллы из вендора в проект автоматически."
image: /blog/skills/preview.png
author: Алексей Гагарин
outline: deep
faqLevel: false
---

# Скиллы для AI-агентов

Сегодня добавил в Testo набор **AI-скиллов** — небольших инструкций, которые подгружает агент (Claude Code, Codex и компания), когда видит подходящую задачу. Лежат в папке [`skills/`](https://github.com/php-testo/testo/tree/1.x/skills).

## Что внутри

Девять скиллов, по одному на сценарий:

- [`testo-write-tests`](https://github.com/php-testo/testo/blob/1.x/skills/testo-write-tests/SKILL.md) — написать обычный <attr>\Testo\Test</attr>-класс с `Assert` / `Expect` / lifecycle-хуками.
- [`testo-data-driven`](https://github.com/php-testo/testo/blob/1.x/skills/testo-data-driven/SKILL.md) — параметризовать тест: <attr>\Testo\Data\DataSet</attr>, <attr>\Testo\Data\DataProvider</attr>, <attr>\Testo\Data\DataUnion</attr>, <attr>\Testo\Data\DataZip</attr>, <attr>\Testo\Data\DataCross</attr>.
- [`testo-flaky-tests`](https://github.com/php-testo/testo/blob/1.x/skills/testo-flaky-tests/SKILL.md) — <attr>\Testo\Retry</attr> vs <attr>\Testo\Repeat</attr>: представляете, между ними есть разница.
- [`testo-inline-tests`](https://github.com/php-testo/testo/blob/1.x/skills/testo-inline-tests/SKILL.md) — <attr>\Testo\Inline\TestInline</attr> прямо на методах в `src`.
- [`testo-benchmarks`](https://github.com/php-testo/testo/blob/1.x/skills/testo-benchmarks/SKILL.md) — <attr>\Testo\Bench</attr> и как читать Mean / Median / RStDev.
- [`testo-coverage`](https://github.com/php-testo/testo/blob/1.x/skills/testo-coverage/SKILL.md) — настройка `CodecovPlugin`, <attr>\Testo\Codecov\Covers</attr>, отчёты Clover / Cobertura / PHPUnit XML.
- [`testo-migrate-from-phpunit`](https://github.com/php-testo/testo/blob/1.x/skills/testo-migrate-from-phpunit/SKILL.md) — миграция тестов с PHPUnit — хит.
- [`testo-plugin-author`](https://github.com/php-testo/testo/blob/1.x/skills/testo-plugin-author/SKILL.md) — написать собственный плагин Testo.
- [`testo-configure`](https://github.com/php-testo/testo/blob/1.x/skills/testo-configure/SKILL.md) — собрать или поправить `testo.php`.

::: question А зачем вообще скиллы, если есть `llms.txt`?
[`llms.txt`](https://php-testo.github.io/llms.txt) — это **что** в API есть. Скиллы — это **когда** что применять и **где грабли**. Они короткие, активируются по триггерам (фразам пользователя), и каждый отправляет агента читать `llms.txt` за уточнениями. Так документация не дублируется, а скиллы не протухают вместе с API.
:::

## Но копировать их в каждый проект — лень

Сейчас, чтобы агент увидел эти скиллы, их надо положить в `.claude/skills/` (или куда там настроен ваш агент). А значит — либо копи-пастить из `vendor/testo/testo/skills/`, либо ставить симлинки, либо… забить и не использовать.

Поэтому запилил отдельный пакет — **[`llm/skills`](https://github.com/roxblnfk/skills)**.

## `llm/skills` — Composer-плагин для скиллов

Идея простая: Composer-пакет объявляет в `composer.json`, что он "донор" скиллов:

```json
{
    "extra": {
        "skills": {
            "source": "skills"
        }
    }
}
```

А проект-потребитель ставит [`llm/skills`](https://packagist.org/packages/llm/skills), и при `composer install` скиллы из доверенных пакетов **автоматически** едут в `.agents/skills/` (или куда настроите).

Никаких ручных копирований, никаких симлинков, никакого "ой, я забыл обновить SKILL.md после `composer update`".

## Присоединяйтесь к тестированию

Только что выкатил [`llm/skills`](https://github.com/roxblnfk/skills) **v1.0.0**. Я не знаю, насколько он окажется востребованным, поэтому фичей особо не накидывал — собрал минимальный жизнеспособный механизм:

- Две команды: `composer skills:update` синкает, `composer skills:show` — read-only инспектор, который показывает, что синкается, что пропущено и почему. У `update` есть `--dry-run` для превью без записи.
- Декларирование папки со скиллами через `extra.skills.source` в `composer.json` зависимостей.
- Auto-discovery: поиск скиллов в пакетах без `extra.skills` по папке `skills` в корне.
- Whitelist доверенных вендоров: `extra.skills.trusted` + `--trust=PATTERN`, поддержка wildcards (`acme/*`, `*`) и встроенный список уже доверенных пакетов.
- Шорткат «назвал — значит доверяю»: `composer skills:update acme/foo` обходит trust-список на время команды и попутно включает auto-discovery для этого пакета.
- Транзакционность: если два донора объявили скилл с одинаковым именем — sync падает *до* того, как тронет файлы. Никаких полусобранных состояний.
- Non-destructive merge: локальные правки в `target/<skill>/` переживают синк, перезаписывается только то, что реально несёт донор. Можно дописать `local.md` к чужому скиллу — он сохранится.

Если поставите и наткнётесь на грабли — кидайте [issue в репозиторий](https://github.com/roxblnfk/skills/issues). Особенно интересно услышать про сценарии, до которых я сам не додумался: чужие агенты, нестандартные раскладки, политики безопасности у больших команд.

::: warning
Пакет навайбкожен на 95%, но переживать об этом не стоит: всё покрыто тестами с [высоким MSI](/ru/docs/theory/mutation-testing.md).
:::

## Быстрый старт

1. Прописать настройки в `composer.json`:

    ```json
    {
        "extra": {
            "skills": {
                "target": ".agents/skills",
                "aliases": [".claude/skills", ".cursor/skills"],
                "trusted": ["my-vendor/*"],
                "discovery": true,
                "auto-sync": true
            }
        }
    }
    ```

    - `target` — реальная папка со скиллами (дефолт `.agents/skills`).
    - `aliases` — дополнительные пути-зеркала (junction на Windows, symlink на POSIX), указывающие на `target`. Удобно, когда в проекте живут несколько агентов: Claude Code, Cursor и компания читают один и тот же набор через свои привычные пути, без дублирования файлов.
    - `trusted` — доверенные вендоры в формате `vendor/*` или `vendor/package`. Testo и часть других пакетов уже сидят во встроенном whitelist'е, так что сюда обычно добавляют что-то своё.
    - `discovery` — подбирать скиллы из пакетов, у которых нет `extra.skills`, но есть папка `skills/` в корне. По умолчанию `false`.
    - `auto-sync` — гонять `skills:update` автоматически после `composer install` / `update`.

2. Поставить плагин — он сразу же подхватит и разложит скиллы по указанным путям:

    ```bash
    composer require --dev llm/skills
    ```

    Composer спросит разрешение запустить плагин (`allow-plugins`) — соглашайтесь.

3. Посмотреть, что ещё можно синкнуть.

    `composer skills:show` — read-only инспектор: показывает, что уже синкается, что пропущено и почему. Полезные флаги:

    ```bash
    composer skills:show                      # текущая раскладка
    composer skills:show --discovery          # + пакеты с папкой skills/ без extra.skills
    composer skills:show --trust='acme/*'     # + что окажется доступным, если расширить трасты
    ```

    Заметили `[skip] not trusted` напротив интересного пакета — добавьте его в `trusted`, и при следующем синке скиллы приедут. Для однократного синка можно указать пакет прямо в команде `skills:update acme/foo`

::: tip
Плагин можно поставить глобально — тогда `composer skills:show` / `skills:update` будут доступны в любом проекте, а настройки (`target`, `aliases`, `trusted`) всё равно читаются из локального `composer.json`:

```bash
composer global require llm/skills
```
:::
