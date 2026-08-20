# Changelog

Все заметные изменения в проекте Kodosvet Code Block (до 1.1.0 — StoDum Code Block) документируются здесь.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

## [1.1.0] — 2026-08-20

Ответ на первое ревью WordPress.org (письмо 20.08.2026, Review ID P0TDX355969HGN).

### Changed
- **Переименование**: «StoDum Code Block» → «Kodosvet Code Block», слаг `stodum-code-block` → `kodosvet-code-block` (ИИ-ревьюер счёл «StoDum» чужим брендом; спорить дольше, чем переименовать в латинское имя продукта из реестра экосистемы). Переименованы: главный файл, текст-домен во всех строках, хендлы ассетов, слаг страницы Tools, видимые надписи (бейдж в тулбаре — «⚡ Kodosvet»), Plugin URI (репо GitHub тоже переименован). **Не переименованы** (обратная совместимость с существующим контентом и настройками stodum.ru): имя блока `stodum/code-block`, опции `stodum_code_*`, AJAX-экшены, CSS-классы `stodum-*`, PHP-классы `StoDum_*`, имена файлов `class-stodum-*.php`.
- `register_setting()`: sanitize-колбэки — `sanitize_key()` + строгий `in_array( …, true )` (замечание ревью).
- `in_array` в мигаторе — строгое сравнение.

### Removed
- `load_plugin_textdomain()` и файлы переводов из пакета (`languages/` теперь `export-ignore`): на WP.org переводы приходят с translate.wordpress.org (замечание ревью). Исходники .po/.pot остаются в git; для сайта вне language pack положить .mo в `wp-content/languages/plugins/kodosvet-code-block-ru_RU.mo`.
- Третий аргумент `wp_set_script_translations()` (путь к локальным JSON) и сам JSON-файл.

## [1.0.9] — 2026-08-17

Подготовка к подаче на WordPress.org.

### Fixed
- Модалка превью в мигаторе показывала «undefined (undefined blocks)» — `ajax_preview` не возвращал `title` и `block_count`.
- Замечания Plugin Check 2.1.0: `translators:`-комментарии к строкам с плейсхолдерами, экранирование вывода кода (`esc_html` + замена скобок вынесены в переменную), `$wpdb->prepare()` инлайн, `wp_unslash` на входе AJAX.

### Changed
- Хендлы Highlight.js — `stodum-hljs-core`, `stodum-hljs-theme-dark|light` (были generic `hljs-*`, конфликтовали бы с другими плагинами). Фолбэк в JS ищет `hljs/styles/`, а не `highlight.js` (остаток CDN).
- Заголовок блока в тулбаре — отступ 10px от бренда.

### Added
- `Author URI`, `License URI` в заголовке; `vendor/hljs/LICENSE` (BSD-3-Clause); секция «Third-Party Libraries» в readme.txt.
- `languages/*.json` для строк редактора (`wp i18n make-json`); POT перегенерирован, ru_RU дополнен (19 строк).
- `.wp-env.json` (порт 8891, Plugin Check) — не входит в архив.
- `Tested up to: 7.1`.

## [1.0.8] — 2026-04-19

### Changed
- **Highlight.js теперь поставляется в комплекте с плагином** (`vendor/hljs/`). Все 22 файла (JS + CSS-темы) загружаются локально. CDN-зависимость полностью удалена — плагин работает без внешних HTTP-запросов и совместим с WordPress.org.

### Removed
- Константа `HLJS_CDN` (больше не используется).
- Внешний HTTP-запрос к `cdnjs.cloudflare.com` при загрузке страниц с блоком кода.


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
