# Ассеты для каталога WordPress.org

Содержимое папки `assets/` в SVN плагина (после одобрения — `https://plugins.svn.wordpress.org/stodum-code-block/assets/`).
В zip плагина не входит (`export-ignore`).

| Файл | Что |
|---|---|
| `banner-772x250.png`, `banner-1544x500.png` | шапка карточки (1x / 2x); справа — настоящий блок (CSS плагина + hljs + Atom One Dark) |
| `icon-128x128.png`, `icon-256x256.png` | иконка `[ </> ]` |
| `screenshot-1..5.png` | 1280×800 @2x, сняты в wp-env на WP 7.0.4; подписи — в `readme.txt`, `== Screenshots ==` |

## Перерисовать

Стиль бренда Делосвода (Geist, `#171717`, лейбл `[ БЕРИТЕ И ПОЛЬЗУЙТЕСЬ ]`), как у «Крошки моей».

- `src/banner.html`, `src/icon.html` — рядом нужны `Geist-Variable.woff2`, `GeistMono-Variable.woff2` (тема хаба, `delosvod/theme/generatepress_child/fonts/`), а для баннера ещё копии `assets/code-block.css`, `vendor/hljs/highlight.min.js`, `vendor/hljs/styles/atom-one-dark.min.css`.
- `src/shots.js` — Playwright-скрипт (`playwright-core` + Chromium из `~/.cache/ms-playwright`): логинится в wp-env (`admin`/`password`, порт 8891), снимает фронтенд анонимно, редактор с выделенным блоком, мигратор и модалку превью. Нужен пост со slug `kodosvet-demo` с двумя блоками и пара постов со старыми `core/code`/`core/preformatted`.

```bash
CH=~/.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell
$CH --headless --no-sandbox --hide-scrollbars --force-device-scale-factor=2 --virtual-time-budget=1500 --window-size=772,250 --screenshot=banner-1544x500.png file://$PWD/banner.html
convert banner-1544x500.png -resize 772x250 banner-772x250.png
$CH --headless --no-sandbox --hide-scrollbars --window-size=256,256 --screenshot=icon-256x256.png file://$PWD/icon.html
convert icon-256x256.png -resize 128x128 -type TrueColor icon-128x128.png
node shots.js ./out <post_id>
```
