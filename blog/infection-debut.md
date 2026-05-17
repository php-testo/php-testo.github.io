---
title: "Infection + Testo"
date: 2026-05-17
description: "Infection 0.33.0 ships with built-in Testo support. Mutation testing now works out of the box."
image: /blog/infection-debut/preview.png
author: Aleksei Gagarin
---

# Infection + Testo

It's here: [Infection 0.33.0](https://github.com/infection/infection/releases/tag/0.33.0) is out with built-in Testo support. Mutation testing now works out of the box.

If you're not yet familiar with mutation testing and why it matters — I have a [dedicated article](/docs/theory/mutation-testing.md) where I unpack why 100% line coverage guarantees nothing, and how mutants find the holes your tests quietly miss.

## What "out of the box" means

Until now, Infection knew about three frameworks: PHPUnit, PhpSpec, and Codeception. In 0.33.0 Testo joins the lineup as the fourth.

The Infection Phar archive already contains the adapter inside it — if you run Infection from the Phar, there's nothing extra to install, Testo is picked up automatically.

If you prefer installing Infection via Composer, you'll need a separate package — `testo/bridge-infection`. Set `"testFramework": "testo"` in `infection.json` and register the <plugin>Codecov</plugin> plugin with a <class>\Testo\Codecov\Report\PhpUnitXmlReport</class> entry in `testo.php`. After that, you can install the adapter yourself:

```bash
composer require --dev infection/infection testo/bridge-infection
```

Or just run `vendor/bin/infection` — it will spot `testFramework: testo` in the config and offer to pull the package for you.

The full walkthrough with every detail lives on the [Infection bridge](/docs/bridge/infection.md) page.

## It'll get easier

Right now the configs still need a couple of paths spelled out: a temp directory in `infection.json` and the coverage-XML location in `testo.php`. The plan is to hide them inside the adapter so that running Infection doesn't require touching `testo.php` at all.

Also on the roadmap — dedicated [skills](/blog/skills) for Infection: how to run mutation testing and how to take down surviving mutants more effectively.

::: tip
If Testo is already in your project and you have a test suite — try running Infection over it. Chances are you're in for a few surprises.
:::
