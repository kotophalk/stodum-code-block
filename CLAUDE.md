# CLAUDE.md — AI Agent Context for StoDum Code Block

> Этот файл содержит контекст для ИИ-агентов (Claude, GPT, Gemini и др.), работающих с данным проектом.
> Прочитай этот файл **первым** перед началом любой работы.

## Идентификация проекта

- **Название**: StoDum Code Block
- **Тип**: WordPress плагин (Gutenberg-блок с Server-Side Rendering)
- **Версия**: 1.0.7
- **Лицензия**: GPL-2.0-or-later
- **Автор**: kotophalk
- **Репозиторий**: https://github.com/kotophalk/stodum-code-block

## Назначение

Легковесный блок кода для WordPress Gutenberg с:
- Подсветкой синтаксиса через Highlight.js (CDN)
- Автоматическим определением языка (эвристики)
- Переключением светлой/тёмной темы
- 14 цветовых палитрами
- Инструментом миграции со старых `core/code` / `core/preformatted` блоков
- Автоматической конвертацией скопированного Markdown с code fences

## Технический стек

| Компонент | Технология | Версия |
|---|---|---|
| PHP | WordPress Plugin API | 7.4+ |
| WordPress | Gutenberg Block API v3 | 6.0+ |
| Highlight.js | CDN (cdnjs.cloudflare.com) | 11.11.1 |
| JavaScript | Vanilla JS (IIFE, no build step) | ES5+ |
| CSS | Vanilla CSS с Custom Properties | — |
| i18n | WordPress l10n (PHP + JS) | — |

## Структура файлов

```
stodum-code-block/
├── stodum-code-block.php          # Точка входа. Главный класс StoDum_Code_Block.
│                                  # Рендеринг блока (SSR), регистрация ассетов,
│                                  # реестр цветовых тем, lazy enqueuing.
│
├── includes/
│   ├── class-stodum-settings.php  # Класс StoDum_Settings.
│   │                              # Страница Tools → StoDum Code Block.
│   │                              # Settings API (тема, палитра). UI мигратора.
│   │
│   └── class-stodum-migrator.php  # Класс StoDum_Migrator.
│                                  # AJAX-обработчики миграции. Эвристики
│                                  # определения языка. parse_blocks → serialize_blocks.
│
├── blocks/code/
│   ├── block.json                 # Метаданные блока (apiVersion 3, атрибуты,
│   │                              # supports, asset handles).
│   └── editor.js                  # Edit-компонент Gutenberg (IIFE, без JSX).
│                                  # Transforms, paste interceptor, guessLanguage().
│
├── assets/
│   ├── code-block.js              # Frontend JS: hljs init, copy, theme toggle,
│   │                              # line numbers. Swift Guard.
│   ├── code-block.css             # Frontend CSS: wrapper, toolbar, code body,
│   │                              # line numbers gutter. CSS custom properties.
│   ├── code-block-editor.css      # Editor CSS: textarea, toolbar, buttons.
│   ├── convert.js                 # Editor: auto-detect core/code blocks, show
│   │                              # convert toast, INI/TOML section merge.
│   ├── code-migrate.js            # Admin JS: migrator page (scan, preview, migrate).
│   └── code-migrate.css           # Admin CSS: migrator table, modal, spinner.
│
├── languages/
│   ├── stodum-code-block.pot      # Шаблон переводов.
│   ├── stodum-code-block-ru_RU.po # Русский перевод (source).
│   └── stodum-code-block-ru_RU.mo # Русский перевод (compiled).
│
├── uninstall.php                  # Очистка опций при удалении плагина.
├── .gitignore
├── README.md
├── CLAUDE.md                      # ← Этот файл.
├── CONVENTIONS.md                 # Стандарты кода и конвенции.
└── CHANGELOG.md                   # История версий.
```

## Ключевые классы и точки входа

### PHP

| Класс | Файл | Назначение |
|---|---|---|
| `StoDum_Code_Block` | `stodum-code-block.php` | Регистрация блока, SSR-рендер, ассеты, тема-реестр |
| `StoDum_Settings` | `includes/class-stodum-settings.php` | Admin UI, Settings API, мигратор UI |
| `StoDum_Migrator` | `includes/class-stodum-migrator.php` | AJAX миграции, парсинг/конвертация блоков |

### JavaScript

| Скрипт | Контекст | Handle |
|---|---|---|
| `editor.js` | Block Editor | `stodum-code-block-editor-script` |
| `convert.js` | Block Editor | `stodum-convert` |
| `code-block.js` | Frontend | `stodum-code-block-frontend` |
| `code-migrate.js` | Admin (Tools page) | `stodum-code-migrate` |

### WordPress опции (wp_options)

| Ключ | Тип | По умолчанию | Описание |
|---|---|---|---|
| `stodum_code_default_theme` | `string` | `'dark'` | Режим по умолчанию: `dark` / `light` |
| `stodum_code_theme_pair` | `string` | `'atom-one'` | Slug цветовой палитры из theme registry |

### AJAX-действия

| Action | Метод | Capability | Описание |
|---|---|---|---|
| `stodum_migrate_scan` | `StoDum_Migrator::ajax_scan` | `manage_options` | Сканирование постов с legacy-блоками |
| `stodum_migrate_preview` | `StoDum_Migrator::ajax_preview` | `manage_options` | Превью конвертации для одного поста |
| `stodum_migrate_single` | `StoDum_Migrator::ajax_migrate_single` | `manage_options` | Миграция одного поста |
| `stodum_migrate_all` | `StoDum_Migrator::ajax_migrate_all` | `manage_options` | Массовая миграция |

## Архитектурные принципы

1. **Zero-Bloat**: Ассеты загружаются только при наличии блока на странице (lazy enqueuing через `maybe_enqueue_frontend()`).
2. **No jQuery**: Весь фронтенд-JS — чистый Vanilla JS.
3. **No Build Step**: JS написан как IIFE (ES5+), без webpack/babel/JSX. Плагин не требует `npm install`.
4. **No Custom Tables**: Все данные хранятся в стандартных Gutenberg-комментариях.
5. **Server-Side Rendering**: Блок рендерится через `render_callback` (PHP), `save()` возвращает `null`.
6. **CSS Custom Properties**: Тема-система через `--cs-*` переменные, устанавливаемые JS из PHP-конфигурации.

## Известный технический долг

### Дублирование JS-кода
Функции `cleanHtml()`, `normalizeLanguage()`, `guessLanguage()` и массив языковых опций дублированы в 3 файлах:
- `blocks/code/editor.js`
- `assets/convert.js`
- `includes/class-stodum-migrator.php` (PHP-версия)

**Рекомендация**: При изменении логики определения языка — обновлять **во всех трёх местах**. В будущем вынести в shared-модуль.

### CDN-зависимость
Highlight.js загружается с `cdnjs.cloudflare.com`. Это **блокирует публикацию на WordPress.org** (требуется локальный bundle). При переходе на локальный bundle:
1. Скачать highlight.js + нужные языки + темы в `vendor/hljs/`
2. Обновить `register_block()` в `stodum-code-block.php`
3. Обновить `.gitignore` при необходимости

### Отсутствие тестов
Нет PHPUnit или E2E тестов. Критичные функции для покрытия:
- `StoDum_Migrator::convert_single_block()` — парсинг и конвертация блоков
- `StoDum_Migrator::count_migrate_blocks()` — подсчёт legacy-блоков
- `guessLanguage()` (JS) — эвристики определения языка
- Frontend: hljs init, theme toggle, copy button

## Правила для ИИ-агентов

### Обязательно

1. **Не ломай рендер-блока**: `render_block()` использует `get_block_wrapper_attributes()`. Любые изменения в wrapper-div обязаны сохранить этот вызов.
2. **Обновляй ВСЕ копии**: При изменении `guessLanguage()` или `normalizeLanguage()` — обновляй editor.js, convert.js **и** class-stodum-migrator.php.
3. **Версии синхронно**: `stodum-code-block.php` (header + const), `block.json`, комментарии в CSS/JS, POT — всё должно иметь одинаковую версию.
4. **Nonce + capabilities**: Все AJAX-обработчики **обязаны** вызывать `check_ajax_referer()` и `current_user_can()`.
5. **Sanitize/Escape**: Весь вывод — через `esc_html()`, `esc_attr()`, `wp_kses_post()`. Все входные данные — через `intval()`, `sanitize_key()`, `sanitize_text_field()`.
6. **i18n**: Все строки, видимые пользователю — через `__()` / `esc_html_e()` с text domain `stodum-code-block`.

### Запрещено

1. **Не добавляй jQuery** на фронтенд.
2. **Не добавляй `console.log()`** в продакшн-код.
3. **Не используй `$wpdb->update()` для post_content** — только `wp_update_post()`.
4. **Не меняй `blockName`** (`stodum/code-block`) — это сломает все существующие блоки.
5. **Не используй `eval()` или `innerHTML` с пользовательским вводом**.

### Тестирование изменений

Без билд-пайплайна единственный способ тестирования:
1. Скопировать плагин в `wp-content/plugins/` инсталляции WordPress.
2. Активировать и проверить:
   - Блок появляется в Inserter
   - Создание и сохранение блока не вызывает «Invalid block»
   - Frontend: подсветка, copy, theme toggle работают
   - Admin: Tools → StoDum Code Block → Scan/Preview/Migrate
3. Или использовать WordPress Playground (см. `wp-playground` skill).
