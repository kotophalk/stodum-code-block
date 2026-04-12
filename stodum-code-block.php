<?php
/**
 * Plugin Name: StoDum Code Block
 * Plugin URI: https://github.com/kotophalk/stodum-code-block
 * Description: Lightweight Gutenberg code block with Highlight.js syntax highlighting and legacy block migrator.
 * Version: 1.0.3
 * Author: kotophalk
 * License: GPL-2.0-or-later
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: stodum-code-block
 *
 * @package StoDum_Code_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/class-stodum-settings.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-stodum-migrator.php';

class StoDum_Code_Block {

    const VERSION      = '1.0.3';
    const HLJS_VERSION = '11.11.1';
    const HLJS_CDN     = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/';

    private static $instance_count  = 0;
    private static $assets_enqueued = false;

    public static function get_theme_registry(): array {
        return [
            'atom-one' => [
                'label'        => __( 'Atom One', 'stodum-code-block' ),
                'dark_css'     => 'atom-one-dark',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#282c34',
                'dark_toolbar' => '#21252b',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'github' => [
                'label'        => __( 'GitHub', 'stodum-code-block' ),
                'dark_css'     => 'github-dark',
                'light_css'    => 'github',
                'dark_bg'      => '#24292e',
                'dark_toolbar' => '#1f2428',
                'light_bg'     => '#fff',
                'light_toolbar'=> '#f6f8fa',
            ],
            'monokai' => [
                'label'        => __( 'Monokai', 'stodum-code-block' ),
                'dark_css'     => 'monokai',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#272822',
                'dark_toolbar' => '#1e1f1c',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'nord' => [
                'label'        => __( 'Nord', 'stodum-code-block' ),
                'dark_css'     => 'nord',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#2e3440',
                'dark_toolbar' => '#272c36',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'dracula' => [
                'label'        => __( 'Dracula', 'stodum-code-block' ),
                'dark_css'     => 'dracula',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#282a36',
                'dark_toolbar' => '#21222c',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'tokyo-night' => [
                'label'        => __( 'Tokyo Night', 'stodum-code-block' ),
                'dark_css'     => 'tokyo-night-dark',
                'light_css'    => 'tokyo-night-light',
                'dark_bg'      => '#1a1b26',
                'dark_toolbar' => '#16161e',
                'light_bg'     => '#d5d6db',
                'light_toolbar'=> '#c8c9ce',
            ],
            'vs2015' => [
                'label'        => __( 'VS 2015 / VS Code', 'stodum-code-block' ),
                'dark_css'     => 'vs2015',
                'light_css'    => 'vs',
                'dark_bg'      => '#1e1e1e',
                'dark_toolbar' => '#181818',
                'light_bg'     => '#fff',
                'light_toolbar'=> '#f3f3f3',
            ],
            'stackoverflow' => [
                'label'        => __( 'Stack Overflow', 'stodum-code-block' ),
                'dark_css'     => 'stackoverflow-dark',
                'light_css'    => 'stackoverflow-light',
                'dark_bg'      => '#1c1b1b',
                'dark_toolbar' => '#151414',
                'light_bg'     => '#f6f6f6',
                'light_toolbar'=> '#e8e8e8',
            ],
            'night-owl' => [
                'label'        => __( 'Night Owl', 'stodum-code-block' ),
                'dark_css'     => 'night-owl',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#011627',
                'dark_toolbar' => '#001122',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'gruvbox' => [
                'label'        => __( 'Gruvbox', 'stodum-code-block' ),
                'dark_css'     => 'base16/gruvbox-dark-hard',
                'light_css'    => 'base16/gruvbox-light-hard',
                'dark_bg'      => '#1d2021',
                'dark_toolbar' => '#171819',
                'light_bg'     => '#f9f5d7',
                'light_toolbar'=> '#ece8c8',
            ],
            'solarized' => [
                'label'        => __( 'Solarized', 'stodum-code-block' ),
                'dark_css'     => 'base16/solarized-dark',
                'light_css'    => 'base16/solarized-light',
                'dark_bg'      => '#002b36',
                'dark_toolbar' => '#002530',
                'light_bg'     => '#fdf6e3',
                'light_toolbar'=> '#eee8d5',
            ],
            'panda' => [
                'label'        => __( 'Panda', 'stodum-code-block' ),
                'dark_css'     => 'panda-syntax-dark',
                'light_css'    => 'panda-syntax-light',
                'dark_bg'      => '#292a2b',
                'dark_toolbar' => '#222324',
                'light_bg'     => '#e6e6e6',
                'light_toolbar'=> '#d9d9d9',
            ],
            'tomorrow' => [
                'label'        => __( 'Tomorrow Night', 'stodum-code-block' ),
                'dark_css'     => 'tomorrow-night-bright',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#000',
                'dark_toolbar' => '#0a0a0a',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'shades-of-purple' => [
                'label'        => __( 'Shades of Purple', 'stodum-code-block' ),
                'dark_css'     => 'shades-of-purple',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#2d2b55',
                'dark_toolbar' => '#252347',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
        ];
    }

    public static function load_textdomain() {
        load_plugin_textdomain( 'stodum-code-block', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
    }

    public static function init() {
        add_action( 'init', [ __CLASS__, 'load_textdomain' ], 1 );
        add_action( 'init', [ __CLASS__, 'register_block' ] );
        add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_convert_script' ] );

        StoDum_Settings::init();
        StoDum_Migrator::init();
    }

    public static function register_block() {
        $cdn = self::HLJS_CDN . self::HLJS_VERSION;

        wp_register_script( 'hljs-core', $cdn . '/highlight.min.js', [], self::HLJS_VERSION, true );
        
        $theme_pair = get_option( 'stodum_code_theme_pair', 'atom-one' );
        $registry   = self::get_theme_registry();
        $pair       = isset( $registry[ $theme_pair ] ) ? $registry[ $theme_pair ] : $registry['atom-one'];

        wp_register_style( 'hljs-theme-dark', $cdn . '/styles/' . $pair['dark_css'] . '.min.css', [], self::HLJS_VERSION );
        wp_register_style( 'hljs-theme-light', $cdn . '/styles/' . $pair['light_css'] . '.min.css', [], self::HLJS_VERSION );

        wp_register_style( 'stodum-code-block-frontend', plugins_url( 'assets/code-block.css', __FILE__ ), [ 'hljs-theme-dark', 'hljs-theme-light' ], self::VERSION );
        wp_register_script( 'stodum-code-block-frontend', plugins_url( 'assets/code-block.js', __FILE__ ), [ 'hljs-core' ], self::VERSION, true );
        wp_register_style( 'stodum-code-block-editor', plugins_url( 'assets/code-block-editor.css', __FILE__ ), [], self::VERSION );
        wp_register_script( 'stodum-code-block-editor-script', plugins_url( 'blocks/code/editor.js', __FILE__ ), [ 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-data', 'wp-hooks' ], self::VERSION, true );

        register_block_type( __DIR__ . '/blocks/code', [
            'render_callback' => [ __CLASS__, 'render_block' ],
            'editor_script'   => 'stodum-code-block-editor-script',
        ] );
    }

    public static function enqueue_convert_script() {
        wp_enqueue_script( 'stodum-convert', plugins_url( 'assets/convert.js', __FILE__ ), [ 'wp-blocks', 'wp-data' ], self::VERSION, true );
        wp_localize_script( 'stodum-convert', 'stodumConvertI18n', [
            'found_1' => __( 'core code block found', 'stodum-code-block' ),
            'found_n' => __( 'core code blocks found', 'stodum-code-block' ),
            'convert' => __( 'Convert All to StoDum', 'stodum-code-block' ),
        ] );
        wp_add_inline_style( 'stodum-code-block-editor', self::get_convert_toast_css() );
    }

    private static function get_convert_toast_css(): string {
        return '#stodum-convert-all-toast{'
            . 'position:fixed;bottom:24px;right:24px;z-index:999999;'
            . 'background:linear-gradient(135deg,#1e3a5f 0%,#0d9488 100%);'
            . 'color:#fff;padding:16px 20px;border-radius:10px;'
            . 'box-shadow:0 8px 32px rgba(0,0,0,0.3);'
            . 'display:flex;align-items:center;gap:16px;'
            . 'font-size:14px;font-weight:500;'
            . 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
            . 'animation:cs-toast-in 0.3s ease-out;'
            . '}'
            . '#stodum-convert-all-toast button{'
            . 'background:#fff;color:#1e3a5f;font-weight:700;border-radius:6px;'
            . 'padding:10px 24px;font-size:14px;border:none;white-space:nowrap;'
            . 'cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-family:inherit;'
            . '}'
            . '#stodum-convert-all-toast button:hover{background:#f0fdf4;}'
            . '@keyframes cs-toast-in{'
            . 'from{opacity:0;transform:translateY(20px);}'
            . 'to{opacity:1;transform:translateY(0);}'
            . '}';
    }

    public static function render_block( $attributes, $block_content = '' ) {
        self::maybe_enqueue_frontend();
        self::$instance_count++;

        $id    = 'stodum-code-' . self::$instance_count;
        $code  = isset( $attributes['content'] )  ? $attributes['content'] : '';
        $lang  = isset( $attributes['language'] ) ? $attributes['language'] : '';
        $title = isset( $attributes['title'] )    ? $attributes['title']    : '';
        $theme = isset( $attributes['theme'] )    ? $attributes['theme']    : '';

        $lang_class = $lang ? 'language-' . esc_attr( $lang ) : '';
        $title_html = $title ? '<div class="stodum-code-title">' . esc_html( $title ) . '</div>' : '';

        ob_start();
        ?>
        <div class="stodum-code-wrapper" 
             id="<?php echo esc_attr( $id ); ?>"
             <?php if ( $theme ) echo ' data-theme="' . esc_attr( $theme ) . '"'; ?>
             <?php if ( $lang )  echo ' data-stodum-lang="' . esc_attr( $lang ) . '"'; ?>>
            <div class="stodum-code-toolbar">
                <span class="stodum-code-brand"><span class="stodum-brand-bolt">&#9889;</span> StoDum</span>
                <?php echo wp_kses_post( $title_html ); ?>
                <div class="stodum-code-actions">
                    <span class="stodum-code-lang-badge"></span>
                    <button class="stodum-code-lines-toggle" title="<?php esc_attr_e( 'Toggle line numbers', 'stodum-code-block' ); ?>" aria-label="<?php esc_attr_e( 'Toggle line numbers', 'stodum-code-block' ); ?>">
                        <svg class="stodum-icon-lines" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="4" y="7" font-size="7" fill="currentColor" stroke="none" font-family="monospace">1</text><text x="4" y="13" font-size="7" fill="currentColor" stroke="none" font-family="monospace">2</text><text x="4" y="19" font-size="7" fill="currentColor" stroke="none" font-family="monospace">3</text></svg>
                    </button>
                    <button class="stodum-code-theme-toggle" title="<?php esc_attr_e( 'Toggle light/dark mode', 'stodum-code-block' ); ?>" aria-label="<?php esc_attr_e( 'Toggle theme', 'stodum-code-block' ); ?>">
                        <svg class="stodum-icon-sun" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        <svg class="stodum-icon-moon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    </button>
                    <button class="stodum-code-copy" title="<?php esc_attr_e( 'Copy to clipboard', 'stodum-code-block' ); ?>" aria-label="<?php esc_attr_e( 'Copy code', 'stodum-code-block' ); ?>">
                        <svg class="stodum-icon-copy" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <svg class="stodum-icon-check" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span class="stodum-copy-label"><?php esc_html_e( 'Copy', 'stodum-code-block' ); ?></span>
                    </button>
                </div>
            </div>
            <div class="stodum-code-body">
                <pre><code class="<?php echo esc_attr( $lang_class ); ?>"><?php echo str_replace( [ '[', ']' ], [ '&#91;', '&#93;' ], esc_html( $code ) ); ?></code></pre>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private static function maybe_enqueue_frontend() {
        if ( self::$assets_enqueued ) return;
        self::$assets_enqueued = true;

        wp_enqueue_style( 'hljs-theme-dark' );
        wp_enqueue_style( 'hljs-theme-light' );
        wp_enqueue_style( 'stodum-code-block-frontend' );
        wp_enqueue_script( 'hljs-core' );
        wp_enqueue_script( 'stodum-code-block-frontend' );

        $theme_pair    = get_option( 'stodum_code_theme_pair', 'atom-one' );
        $default_theme = get_option( 'stodum_code_default_theme', 'dark' );
        $registry      = self::get_theme_registry();
        $pair          = isset( $registry[ $theme_pair ] ) ? $registry[ $theme_pair ] : $registry['atom-one'];

        wp_localize_script( 'stodum-code-block-frontend', 'stodumCodeConfig', [
            'defaultTheme'  => $default_theme,
            'themePair'     => $theme_pair,
            'darkBg'        => $pair['dark_bg'],
            'darkToolbar'   => $pair['dark_toolbar'],
            'lightBg'       => $pair['light_bg'],
            'lightToolbar'  => $pair['light_toolbar'],
        ] );
    }
}

StoDum_Code_Block::init();
