# Changelog

Все заметные изменения в проекте StoDum Code Block документируются здесь.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

## [1.0.7] — 2026-04-16

### Fixed
- **Версии**: Унифицированы номера версий во всех файлах (block.json, JS, CSS, POT).
- **Рендеринг**: Блок теперь использует `get_block_wrapper_attributes()` — поддержка `align: wide/full` работает корректно.
- **Миграция**: Замена `$wpdb->update()` на `wp_update_post()` — WordPress теперь создаёт ревизии при миграции блоков.
- **Миграция**: Исправлена передача `post_ids[]` в AJAX «Migrate All» — `FormData` теперь корректно сериализует массивы.
- **Безопасность**: `$_GET['settings-updated']` санитизирован через `sanitize_key()`.
- **i18n**: Добавлен `wp_set_script_translations()` для JS-переводов в редакторе.
- **i18n**: Все хардкод-строки в editor.js обёрнуты в `__()` (Copy, Paste, Clear, Copied!, StoDum Code).
- **i18n**: Merge-тост в convert.js теперь использует переводимые строки.
- **CSS**: Удалён мёртвый селектор `.wp-block-cloudscale-code-block`.
- **CSS**: Исправлено дублирующее определение `.stodum-code-editor-lang`.
- **A11y**: Унифицированы `title` и `aria-label` на кнопке Theme Toggle.

### Added
- `uninstall.php` — очистка опций плагина при удалении.
- `.gitignore` — стандартные исключения для WordPress-плагина.

### Removed
- Debug `console.log('STODUM: v1.0.7 loaded')` из editor.js.
- Ключевое слово `cloudscale` из `block.json` keywords.

## [1.0.6] — 2026-04-12

### Fixed
- Полная перезапись логики определения языков в редакторе.
- Рабочие Smart Heuristics для PHP, Bash и JavaScript без backticks.

## [1.0.5] — 2026-04-12

### Added
- Smart Language Heuristics: автоматическое определение PHP (по `$`, `->`, `::`, `array()`),
  Bash (по `docker`, `sudo`, `wo`, CLI-командам) и JavaScript (по `import`, `const`, `async`).

## [1.0.4] — 2026-04-12

### Fixed
- Ручная инъекция блоков, обходящая санитизацию Gutenberg.
- Swift Auto-Detect Guard: предотвращение ложного определения Swift для HLJS 11+.

## [1.0.3] — 2026-04-11

### Fixed
- Разрешено расхождение в именах data-атрибутов.
- Исправлен баг с `regex.lastIndex` при глобальном поиске.

## [1.0.2] — 2026-04-11

### Fixed
- Окончательное исправление ложного определения Swift.
- Строгий маппинг языков.
- Сигнал `data-stodum-lang` для фронтенда.

## [1.0.1] — 2026-04-11

### Added
- Глобальный перехват вставки Markdown с code fences в редакторе.
- Сохранение language-тегов до того, как парсер Gutenberg их потеряет.

### Fixed
- Парсинг markdown-блоков с backticks.

## [1.0.0] — 2026-04-10

### Added
- Нативный Gutenberg-блок `stodum/code-block` с SSR.
- Подсветка синтаксиса через Highlight.js (CDN).
- 14 цветовых палитр (Atom One, GitHub, Monokai, Dracula, Nord и др.).
- Переключение светлой/тёмной темы.
- Кнопка копирования кода.
- Нумерация строк (toggle).
- Авто-определение языка кода.
- Инструмент миграции legacy-блоков (core/code, core/preformatted).
- Страница настроек в Tools → StoDum Code Block.
- Конвертер core/code блоков с toast-уведомлением в редакторе.
- Автоматическое слияние разделённых INI/TOML секций.
- Локализация: русский язык (ru_RU).
