<?php
/**
 * Plugin Name: StoDum Code Block
 * Plugin URI: https://github.com/kotophalk/stodum-code-block
 * Description: Syntax highlighted code block with auto language detection, clipboard copy, dark/light mode toggle, and code migrator.
 * Version: 1.0.0
 * Author: Kotophalk
 * License: GPL-2.0-or-later
 * Text Domain: stodum-code-block
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class StoDum_Code_Block {

    const VERSION      = '1.0.0';
    const HLJS_VERSION = '11.11.1';
    const HLJS_CDN     = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/';
    const TOOLS_SLUG   = 'stodum-code-block';
    const MIGRATE_NONCE = 'stodum_code_migrate_action';

    private static $instance_count  = 0;
    private static $assets_enqueued = false;

    public static function get_theme_registry(): array {
        return [
            'atom-one' => [
                'label'        => 'Atom One',
                'dark_css'     => 'atom-one-dark',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#282c34',
                'dark_toolbar' => '#21252b',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ]
        ];
    }

    public static function init() {
        add_action( 'init', [ __CLASS__, 'register_block' ] );
        add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_convert_script' ] );
    }

    public static function register_block() {
        $cdn = self::HLJS_CDN . self::HLJS_VERSION;

        wp_register_script( 'hljs-core', $cdn . '/highlight.min.js', [], self::HLJS_VERSION, true );
        
        $pair = self::get_theme_registry()['atom-one'];
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
        <div class="stodum-code-wrapper" id="<?php echo esc_attr( $id ); ?>"<?php if ( $theme ) echo ' data-theme="' . esc_attr( $theme ) . '"'; ?>>
            <div class="stodum-code-toolbar">
                <span class="stodum-brand-bolt">&#9889;</span> StoDum
                <?php echo wp_kses_post( $title_html ); ?>
                <div class="stodum-code-actions">
                    <span class="stodum-code-lang-badge"></span>
                    <button class="stodum-code-copy" title="Copy to clipboard" aria-label="Copy code">
                        <span class="stodum-copy-label">Copy</span>
                    </button>
                </div>
            </div>
            <div class="stodum-code-body">
                <pre><code class="<?php echo esc_attr( $lang_class ); ?>"><?php echo esc_html( $code ); ?></code></pre>
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

        $pair = self::get_theme_registry()['atom-one'];
        wp_localize_script( 'stodum-code-block-frontend', 'stodumCodeConfig', [
            'defaultTheme'  => 'dark',
            'themePair'     => 'atom-one',
            'darkBg'        => $pair['dark_bg'],
            'darkToolbar'   => $pair['dark_toolbar'],
            'lightBg'       => $pair['light_bg'],
            'lightToolbar'  => $pair['light_toolbar'],
        ] );
    }
}

StoDum_Code_Block::init();
