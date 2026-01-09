# Testo Documentation

**Testo** - extensible PHP testing framework. Tests without TestCase inheritance, middleware architecture, PSR-14 events, separate Assert/Expect facades.

## Structure

```
docs/         # English (root)
├── index.md  # Home page
├── docs/     # Documentation pages
└── .vitepress/
    ├── config.mts       # Config: nav, sidebar, locales
    └── theme/style.css  # Custom styles (dough colors)

ru/           # Russian locale (same structure)
```

## Style Guide

**Tone:** Informal but technically accurate. Code examples over explanations.

**Home page rules:**
- DON'T show code in features (text only, 1 sentence each)
- Don't mention competitors, use "old solutions"

**Markdown:** Use `::: tip`, `::: warning`, `::: info` blocks

## Working with Content

**Adding pages:**
1. Create both `docs/page.md` (EN) and `ru/docs/page.md` (RU)
2. Add to sidebar in `.vitepress/config.mts` for both locales
3. Internal links: `./page` or `/docs/page` (no `.html`)

**Dead links:** Create stub with `::: tip Coming Soon` block

**Styles:** `.vitepress/theme/style.css` - brand colors `--vp-c-brand-1`, responsive breakpoints 960px/640px

## VitePress Commands

```bash
npm run docs:dev      # Dev server at localhost:5173
npm run docs:build    # Build to .vitepress/dist/
npm run docs:preview  # Preview build
```

## Configuration

**File:** `.vitepress/config.mts`

- `locales`: root (EN) + `ru` (RU) with separate nav/sidebar
- `cleanUrls: true`, `lastUpdated: true`, `search.provider: 'local'`
- Nav and Sidebar defined in `themeConfig` for each locale
- Sidebar sections: Introduction, Guide, Customization

---

# Гайдлайн по переводу документации на Русский язык

## Основные принципы

1. **Естественность важнее дословности**
   - Перевод должен звучать так, как говорят русские разработчики
   - Избегать кальки с английского, если это звучит неестественно

2. **Сохранять технические термины**
   - Не переводить названия классов, методов, атрибутов, пакетов
   - Оставлять код примеры без изменений

## Терминология

### Устоявшиеся термины

| Английский | ❌ Неправильно | ✅ Правильно | Примечание |
|------------|----------------|--------------|------------|
| test | — | тест | Один метод теста или InlineTest |
| test case | тестовый случай | Test Case / тест-кейс / тестовый класс / класс тестов / набор тестов | Класс/файл с тестами. Выбор зависит от контекста |
| test suite | тестовый набор | Test Suite / комплект тестов | Глобальная группа (Unit, Feature). Предпочтительно без перевода |
| data provider | поставщик данных | провайдер данных | |
| dataset | — | датасет / набор данных | Оба допустимы |
| callable | вызываемый | вызываемый объект | В контексте |
| closure | закрытие | замыкание | |

### Специфичные фразы

| Английский | ❌ Неправильно | ✅ Правильно |
|------------|----------------|--------------|
| Simple as that | Просто как это | Вот так просто |
| right on the method | прямо на методе | непосредственно над методом |

## Стилистика

1. **Избегать канцеляризмов**
   - Вместо "тестовый случай" → "тест"
   - Вместо "осуществить проверку" → "проверить"

2. **Сохранять тон оригинала**
   - Если оригинал неформальный и дружелюбный — перевод тоже
   - Технические термины оставлять точными

3. **Порядок слов**
   - Использовать естественный русский порядок слов
   - Не копировать английскую структуру предложения

4. **Термин + конкретное значение**
   - При упоминании технического термина с конкретным значением использовать дефис для разделения
   - Примеры:
     - ✅ "Test Suite - Unit" (не "Test Suite Unit")
     - ✅ "комплект тестов Unit" (альтернатива)
     - ✅ "провайдер данных - UserDataProvider"

## Проверка качества

Перед финализацией перевода задать вопросы:
- Так ли говорят русские разработчики?
- Звучит ли фраза естественно при чтении вслух?
- Сохранен ли технический смысл оригинала?
