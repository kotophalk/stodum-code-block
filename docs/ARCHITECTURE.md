# Архитектура — StoDum Code Block

## Обзор

StoDum Code Block — WordPress-плагин, реализующий кастомный Gutenberg-блок с подсветкой синтаксиса через Highlight.js. Плагин использует Server-Side Rendering (SSR) для фронтенда и включает встроенный инструмент миграции legacy-блоков.

## Диаграмма компонентов

```
┌─────────────────────────────────────────────────────────────────┐
│                        WordPress Core                           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Block Editor  │  │  REST / AJAX │  │   Frontend Renderer   │ │
│  │ (Gutenberg)   │  │              │  │   (the_content)       │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
└─────────┼─────────────────┼──────────────────────┼─────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│   Editor UI     │ │  Migrator    │ │   SSR Render Pipeline    │
│                 │ │  (AJAX)      │ │                          │
│ ┌─────────────┐ │ │ ┌──────────┐ │ │ render_block()           │
│ │ editor.js   │ │ │ │ scan     │ │ │   ├─ maybe_enqueue()     │
│ │ (edit comp) │ │ │ │ preview  │ │ │   ├─ get_block_wrapper() │
│ └─────────────┘ │ │ │ migrate  │ │ │   └─ ob_start/clean      │
│ ┌─────────────┐ │ │ │ mass mgr │ │ │                          │
│ │ convert.js  │ │ │ └──────────┘ │ │ ┌──────────────────────┐ │
│ │ (auto conv) │ │ │              │ │ │ code-block.js        │ │
│ └─────────────┘ │ │ ┌──────────┐ │ │ │ (hljs, copy, theme)  │ │
│                 │ │ │ UI page  │ │ │ └──────────────────────┘ │
│ ┌─────────────┐ │ │ │ migrate  │ │ │ ┌──────────────────────┐ │
│ │ editor.css  │ │ │ │ .js/.css │ │ │ │ code-block.css       │ │
│ └─────────────┘ │ │ └──────────┘ │ │ │ (CSS custom props)   │ │
│                 │ │              │ │ └──────────────────────┘ │
└─────────────────┘ └──────────────┘ └──────────────────────────┘
          │                 │                      │
          │                 │                      ▼
          │                 │              ┌──────────────────┐
          │                 │              │  Highlight.js    │
          │                 │              │  (CDN 11.11.1)   │
          └─────────────────┘              └──────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  StoDum_Settings │
          │  (Settings API)  │
          │  ┌──────────────┐│
          │  │ Theme pair   ││
          │  │ Default mode ││
          │  └──────────────┘│
          └──────────────────┘
```

## Потоки данных

### 1. Рендеринг блока (Frontend)

```
Post Content (DB)
  └─ parse_blocks()
       └─ stodum/code-block found
            └─ StoDum_Code_Block::render_block()
                 ├─ maybe_enqueue_frontend()  ──→  wp_enqueue (CSS/JS + hljs CDN)
                 │     └─ wp_localize_script()  ──→  stodumCodeConfig {}
                 ├─ get_block_wrapper_attributes()
                 └─ ob_start() → HTML → ob_get_clean()
                                          │
                                          ▼
                                    Browser DOM
                                          │
                                          ▼
                                    code-block.js
                                      ├─ hljs.highlightElement()
                                      ├─ Swift Guard
                                      ├─ Language badge
                                      ├─ Copy button
                                      ├─ Theme toggle (all blocks)
                                      └─ Line numbers toggle
```

### 2. Миграция блоков (Admin AJAX)

```
Admin: Tools → StoDum Code Block
  │
  ├─ [Scan Posts]
  │     └─ AJAX: stodum_migrate_scan
  │          └─ $wpdb->get_results() → parse_blocks() → count
  │
  ├─ [Preview]
  │     └─ AJAX: stodum_migrate_preview
  │          └─ get_migration_preview() → convert_single_block()
  │               ├─ Extract content from <code>/<pre> HTML
  │               ├─ Detect language:
  │               │    1. Block attrs (language, className)
  │               │    2. HTML class (language-xxx)
  │               │    3. Markdown fences (```lang)
  │               │    4. First-line detection
  │               │    5. CLI/comment heuristics
  │               └─ Return { original, converted } for diff view
  │
  ├─ [Migrate Single]
  │     └─ AJAX: stodum_migrate_single
  │          └─ convert_content() → wp_update_post()
  │
  └─ [Migrate All]
        └─ AJAX: stodum_migrate_all
             └─ foreach post_ids → convert_content() → wp_update_post()
```

### 3. Автоконвертация в редакторе

```
Gutenberg Editor
  │
  ├─ convert.js: subscribe → checkBlocks()
  │     └─ findCoreCodeBlocks() → если найдены:
  │          └─ Показать toast «N core code blocks found → Convert All»
  │               └─ convertAll() → replaceBlock() for each
  │
  ├─ convert.js: subscribe → checkAndMergeIniBlocks()
  │     └─ Если stodum/code-block + core/shortcode с [section]:
  │          └─ Автоматически слить обратно в code block
  │
  └─ editor.js: Global paste interceptor
        └─ Если вставляется текст с ``` fences:
             └─ Перехватить, парсить fences, создать stodum/code-block
```

## Тема-система

```
PHP: get_theme_registry()
  └─ 14 палитр, каждая содержит:
       ├─ dark_css    → имя файла hljs темы для dark mode
       ├─ light_css   → имя файла hljs темы для light mode
       ├─ dark_bg     → hex цвет фона (dark)
       ├─ dark_toolbar→ hex цвет тулбара (dark)
       ├─ light_bg    → hex цвет фона (light)
       └─ light_toolbar → hex цвет тулбара (light)

PHP: wp_localize_script() → stodumCodeConfig
  └─ { defaultTheme, darkBg, darkToolbar, lightBg, lightToolbar }

JS: applyThemeVars(wrapper, mode)
  └─ wrapper.style.setProperty('--cs-bg', colors.bg)
  └─ wrapper.style.setProperty('--cs-toolbar-bg', colors.toolbar)

CSS: var(--cs-bg), var(--cs-toolbar-bg), etc.

HLJS: Два <link> тега (dark + light), один disabled
  └─ applyGlobalTheme() → links.dark.disabled / links.light.disabled
```

## Ленивая загрузка ассетов

```
register_block()
  ├─ wp_register_style('hljs-theme-dark')     ← только зарегистрирован
  ├─ wp_register_style('hljs-theme-light')    ← только зарегистрирован
  ├─ wp_register_style('stodum-code-block-frontend')  ← только зарегистрирован
  ├─ wp_register_script('hljs-core')          ← только зарегистрирован
  └─ wp_register_script('stodum-code-block-frontend') ← только зарегистрирован

render_block() [вызывается ТОЛЬКО если блок на странице]
  └─ maybe_enqueue_frontend()
       └─ wp_enqueue_*()  ← здесь ассеты попадают в очередь

Результат: Страницы без кодовых блоков → 0 дополнительных HTTP-запросов.
```

## Иерархия определения языка (приоритет)

```
1. Явно указан в блоке (language атрибут)      ← Наивысший
2. CSS-класс language-xxx в attrs.className
3. CSS-класс language-xxx в HTML <code>/<pre>
4. Markdown fence: ```language
5. Первая строка — известное имя языка
6. CLI/шебанг/комментарии (# → bash, // → js)
7. Smart Heuristics:
   ├─ PHP: $var, ->, ::, array(), foreach
   ├─ Bash: docker, sudo, apt, npm, git...
   ├─ JS: import, export, const, let, async
   ├─ JSON: начинается с { или [
   ├─ HTML: <html, <!DOCTYPE
   ├─ XML: начинается с <, содержит </ или />
   └─ SQL: SELECT, INSERT, CREATE...
8. Highlight.js autodetect (с Swift Guard)     ← Наименьший
```
