# Coding Conventions — StoDum Code Block

## PHP

### Стиль кода

- **Стандарт**: WordPress Coding Standards (WPCS).
- **Отступы**: Табы (не пробелы).
- **Скобки массивов**: Короткий синтаксис `[]`, не `array()`.
- **Типизация**: PHP 7.4+. Используй return type hints (`: array`, `: string`, `: void`).
- **Статические классы**: Проект использует статические методы и `__CLASS__`. Не переводи на синглтоны без необходимости.

### Безопасность

```php
// Всегда в начале PHP-файлов:
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// AJAX-обработчики:
check_ajax_referer( 'stodum_code_migrate_action', 'nonce' );
current_user_can( 'manage_options' );

// Вывод:
esc_html( $text );
esc_attr( $attr );
wp_kses_post( $html );
esc_url( $url );

// Вход:
intval( $_POST['id'] );
sanitize_text_field( $_POST['text'] );
sanitize_key( $_GET['key'] );
```

### i18n

```php
// Все видимые строки:
__( 'Text', 'stodum-code-block' )
esc_html__( 'Text', 'stodum-code-block' )
esc_html_e( 'Text', 'stodum-code-block' )
esc_attr_e( 'Text', 'stodum-code-block' )

// Text domain: stodum-code-block (всегда литерал, не переменная)
```

### Именование

| Элемент | Паттерн | Пример |
|---|---|---|
| Классы | `StoDum_PascalCase` | `StoDum_Migrator` |
| Файлы классов | `class-stodum-kebab.php` | `class-stodum-migrator.php` |
| Функции/методы | `snake_case` | `convert_single_block()` |
| Хуки | `stodum_` prefix | `stodum_migrate_scan` |
| Опции | `stodum_code_` prefix | `stodum_code_theme_pair` |
| Константы | `UPPER_SNAKE` | `VERSION`, `HLJS_CDN` |

## JavaScript

### Стиль кода

- **Формат**: IIFE (`( function() { 'use strict'; ... } )();`).
- **Стандарт**: ES5+ (без стрелочных функций, без `let`/`const` в коде блока, без `class`).
- **Причина**: Нет билд-пайплайна, код подаётся как есть. ES5 гарантирует совместимость.
- **`var`** вместо `let`/`const`: Соблюдается в `editor.js`, `code-block.js`, `convert.js`.
- **Исключение**: `code-migrate.js` может использовать ES6+ (только admin-панель).

### Gutenberg API

```js
// Доступ к WP API через глобалы:
var el = wp.element.createElement;
var __ = wp.i18n.__;
var useBlockProps = wp.blockEditor.useBlockProps;

// Блок edit — через el() вызовы (без JSX):
el( 'div', blockProps,
    el( 'span', {}, __( 'Label', 'stodum-code-block' ) )
);

// save: return null (SSR-блок)
```

### i18n в JS

```js
// Используй wp.i18n.__() для всех видимых строк:
var __ = wp.i18n.__;
__( 'Copy', 'stodum-code-block' );

// Для скриптов без wp.i18n (convert.js) — используй wp_localize_script:
// PHP: wp_localize_script( 'handle', 'stodumConvertI18n', [...] );
// JS:  stodumConvertI18n.found_1
```

### Именование

| Элемент | Паттерн | Пример |
|---|---|---|
| Переменные | `camelCase` | `langNames`, `themeColors` |
| Функции | `camelCase` | `initBlock()`, `guessLanguage()` |
| CSS-классы | `stodum-code-` | `stodum-code-wrapper` |
| CSS-переменные | `--cs-` | `--cs-bg`, `--cs-toolbar-bg` |
| Data-атрибуты | `data-stodum-` или `data-` | `data-stodum-lang`, `data-active-theme` |
| DOM ID | `stodum-code-N` | `stodum-code-1`, `stodum-code-2` |

## CSS

### Организация

- **Frontend**: `assets/code-block.css` — единственный CSS для фронтенда.
- **Editor**: `assets/code-block-editor.css` — стили для Block Editor.
- **Admin**: `assets/code-migrate.css` — стили для страницы мигратора.

### Переменные

Используй CSS custom properties с префиксом `--cs-`:

```css
.stodum-code-wrapper {
    --cs-bg: #282c34;
    --cs-toolbar-bg: #21252b;
    --cs-toolbar-border: rgba(255,255,255,0.08);
    --cs-text-muted: rgba(255,255,255,0.80);
    /* ... */
}
```

JS устанавливает `--cs-bg` и `--cs-toolbar-bg` из конфигурации PHP.

### Специфичность

- Используй `.stodum-code-wrapper` как корневой контекст.
- Для перебития тем-стилей допустимо `!important` (только для `pre`, `code`).
- Для light mode: `.stodum-code-wrapper[data-active-theme="light"]`.

## Git

### Формат коммитов

```
type(scope): description

type: feat, fix, docs, chore, refactor, style, perf, i18n
scope: editor, logic, php, css, migrator, i18n
```

Примеры:
```
feat(editor): add TOML language to options list
fix(logic): prevent false Swift detection in heuristics
docs: update CLAUDE.md with new theme registry API
chore: update .gitignore
i18n: add missing translation for Paste button
```

### Версионирование

При бампе версии обновлять **все 4 места**:
1. `stodum-code-block.php` → Plugin Header `Version:`
2. `stodum-code-block.php` → `const VERSION`
3. `blocks/code/block.json` → `"version"`
4. `CHANGELOG.md` → новая секция
