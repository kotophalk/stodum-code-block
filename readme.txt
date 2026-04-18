=== StoDum Code Block ===
Contributors: kotophalk
Tags: code, syntax highlighting, gutenberg, code block, developer
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.8
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight Gutenberg code block with Highlight.js syntax highlighting, smart language detection, and a built-in legacy block migrator.

== Description ==

StoDum Code Block is a zero-bloat Gutenberg block for displaying code with syntax highlighting powered by Highlight.js.

**Key Features:**

* **Native Gutenberg Block** — Full support for the visual editor with Server-Side Rendering.
* **14 Color Themes** — Atom One, GitHub, Monokai, Dracula, Nord, VS Code, Stack Overflow, Night Owl, Gruvbox, Solarized, Panda, Tomorrow Night, Shades of Purple, Tokyo Night.
* **Smart Language Detection** — Automatic language identification using multi-layered heuristics for PHP, Bash, JavaScript, SQL, JSON, XML, and more.
* **Swift Guard** — Prevents Highlight.js from misidentifying code as Swift.
* **Dark/Light Toggle** — Switch all code blocks on the page between dark and light themes with one click.
* **Copy to Clipboard** — One-click code copying with visual feedback.
* **Line Numbers** — Toggleable line number gutter.
* **Legacy Migrator** — Built-in tool to scan and convert old `core/code` and `core/preformatted` blocks.
* **Zero Bloat** — Assets are loaded only when a code block is present on the page.
* **No jQuery** — Pure Vanilla JS on the frontend.

**Migrator Tool:**

Navigate to **Tools → StoDum Code Block** to scan your site for legacy code blocks and migrate them to the modern StoDum format with a before/after preview.

== Installation ==

1. Upload the `stodum-code-block` folder to `/wp-content/plugins/`.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. In the Block Editor, search for "StoDum Code" to insert a code block.
4. Configure default theme and color palette under **Tools → StoDum Code Block**.

== Frequently Asked Questions ==

= Does this plugin require any build tools? =

No. StoDum Code Block ships as vanilla JavaScript and CSS — no Node.js, webpack, or build step required.

= How does the language auto-detection work? =

The plugin uses a multi-layer approach:
1. Explicit language selection in block settings (highest priority).
2. Markdown fence detection (```language).
3. First-line language markers.
4. Smart heuristics for PHP, Bash, JavaScript, SQL, and other languages.
5. Highlight.js auto-detection (with Swift Guard to prevent false positives).

= Can I migrate my existing code blocks? =

Yes! Go to **Tools → StoDum Code Block** and click **Scan Posts**. The migrator will find all posts with `core/code` or `core/preformatted` blocks and let you preview and migrate them individually or in bulk.

= Does migration create revisions? =

Yes. The migrator uses `wp_update_post()`, so WordPress creates a revision for each migrated post. You can roll back through the standard Revisions interface.

= What happens when I delete the plugin? =

The plugin removes its settings (theme preference and color palette) from the database. Your code block content remains in the posts as Gutenberg block comments.

== Screenshots ==

1. Code block with Atom One Dark theme and syntax highlighting.
2. Block editor with language selection and toolbar.
3. Migration tool with scan results and preview modal.
4. Dark/light theme toggle.

== Changelog ==

= 1.0.8 =
* Changed: Highlight.js is now bundled locally (vendor/hljs/). CDN dependency removed. Plugin is now fully self-contained and compatible with WordPress.org guidelines.

= 1.0.7 =
* Fixed: Block now uses `get_block_wrapper_attributes()` for proper wide/full alignment support.
* Fixed: Migrator creates revisions via `wp_update_post()`.
* Fixed: Migrate All AJAX array serialization.
* Fixed: All editor strings now translatable.
* Added: `uninstall.php` for clean removal.
* Removed: Debug console.log output.

= 1.0.6 =
* Fixed: Complete rewrite of editor language detection with working Smart Heuristics.

= 1.0.5 =
* Added: Smart Language Heuristics for PHP, Bash, JavaScript.

= 1.0.4 =
* Fixed: Swift Auto-Detect Guard for Highlight.js 11+.

= 1.0.3 =
* Fixed: Data attribute naming mismatch and regex lastIndex bug.

= 1.0.2 =
* Fixed: Strict language mapping and `data-stodum-lang` signal.

= 1.0.1 =
* Added: Global markdown paste interceptor.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.8 =
Highlight.js is now bundled locally — no more external CDN requests. Safe to upgrade; no data migration needed.

= 1.0.7 =
Important fixes: block alignment support (wide/full), migration now creates revisions for safe rollback, all UI strings are now translatable.
