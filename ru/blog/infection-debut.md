---
title: "Infection + Testo"
date: 2026-05-17
description: "Infection 0.33.0 вышел со встроенной поддержкой Testo. Мутационное тестирование теперь работает из коробки."
image: /blog/infection-debut/preview.png
author: Алексей Гагарин
---

# Infection + Testo

Свершилось: [Infection 0.33.0](https://github.com/infection/infection/releases/tag/0.33.0) вышел со встроенной поддержкой Testo. Мутационное тестирование теперь работает из коробки.

Если вы вдруг ещё не в теме, что такое мутационное тестирование и зачем оно вам нужно — у меня есть [отдельная статья](/ru/docs/theory/mutation-testing.md), где я разбираю, почему 100% line coverage ничего не гарантирует, и как мутанты находят те дыры, которые ваши тесты пропускают мимо.

## Что значит «из коробки»

До этого момента Infection знал про три фреймворка: PHPUnit, PhpSpec и Codeception. В 0.33.0 Testo встал в общий ряд четвёртым.

Phar-архив Infection уже содержит адаптер внутри себя — если вы запускаете Infection через Phar, больше ничего ставить не нужно, Testo подхватится автоматически.

Если вы предпочитаете ставить Infection через Composer, понадобится отдельный пакет — `testo/bridge-infection`. В `infection.json` указываете `"testFramework": "testo"`, в `testo.php` регистрируете плагин <plugin>Codecov</plugin> с отчётом <class>\Testo\Codecov\Report\PhpUnitXmlReport</class>. Дальше можно поставить адаптер руками:

```bash
composer require --dev infection/infection testo/bridge-infection
```

А можно просто запустить `vendor/bin/infection` — он увидит `testFramework: testo` в конфиге и сам предложит подтянуть пакет.

Подробная инструкция со всеми нюансами лежит на странице [бриджа Infection](/ru/docs/bridge/infection.md).

## Дальше будет проще

Сейчас в конфигах ещё приходится прописывать пару путей: временную директорию в `infection.json` и coverage-XML в `testo.php`. План — спрятать их в адаптер, чтобы для Infection не приходилось трогать `testo.php` вовсе.

А ещё в планах — отдельные [скиллы](/ru/blog/skills) под Infection: как запускать мутационное тестирование и как эффективнее раскидывать выживших мутантов.

::: tip
Если у вас уже стоит Testo и написаны тесты — попробуйте прогнать по ним Infection. Скорее всего, вас ждёт несколько сюрпризов.
:::
