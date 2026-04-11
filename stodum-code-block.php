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
            ],
            'github' => [
                'label'        => 'GitHub',
                'dark_css'     => 'github-dark',
                'light_css'    => 'github',
                'dark_bg'      => '#24292e',
                'dark_toolbar' => '#1f2428',
                'light_bg'     => '#fff',
                'light_toolbar'=> '#f6f8fa',
            ],
            'monokai' => [
                'label'        => 'Monokai',
                'dark_css'     => 'monokai',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#272822',
                'dark_toolbar' => '#1e1f1c',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'nord' => [
                'label'        => 'Nord',
                'dark_css'     => 'nord',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#2e3440',
                'dark_toolbar' => '#272c36',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'dracula' => [
                'label'        => 'Dracula',
                'dark_css'     => 'dracula',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#282a36',
                'dark_toolbar' => '#21222c',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'tokyo-night' => [
                'label'        => 'Tokyo Night',
                'dark_css'     => 'tokyo-night-dark',
                'light_css'    => 'tokyo-night-light',
                'dark_bg'      => '#1a1b26',
                'dark_toolbar' => '#16161e',
                'light_bg'     => '#d5d6db',
                'light_toolbar'=> '#c8c9ce',
            ],
            'vs2015' => [
                'label'        => 'VS 2015 / VS Code',
                'dark_css'     => 'vs2015',
                'light_css'    => 'vs',
                'dark_bg'      => '#1e1e1e',
                'dark_toolbar' => '#181818',
                'light_bg'     => '#fff',
                'light_toolbar'=> '#f3f3f3',
            ],
            'stackoverflow' => [
                'label'        => 'Stack Overflow',
                'dark_css'     => 'stackoverflow-dark',
                'light_css'    => 'stackoverflow-light',
                'dark_bg'      => '#1c1b1b',
                'dark_toolbar' => '#151414',
                'light_bg'     => '#f6f6f6',
                'light_toolbar'=> '#e8e8e8',
            ],
            'night-owl' => [
                'label'        => 'Night Owl',
                'dark_css'     => 'night-owl',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#011627',
                'dark_toolbar' => '#001122',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'gruvbox' => [
                'label'        => 'Gruvbox',
                'dark_css'     => 'base16/gruvbox-dark-hard',
                'light_css'    => 'base16/gruvbox-light-hard',
                'dark_bg'      => '#1d2021',
                'dark_toolbar' => '#171819',
                'light_bg'     => '#f9f5d7',
                'light_toolbar'=> '#ece8c8',
            ],
            'solarized' => [
                'label'        => 'Solarized',
                'dark_css'     => 'base16/solarized-dark',
                'light_css'    => 'base16/solarized-light',
                'dark_bg'      => '#002b36',
                'dark_toolbar' => '#002530',
                'light_bg'     => '#fdf6e3',
                'light_toolbar'=> '#eee8d5',
            ],
            'panda' => [
                'label'        => 'Panda',
                'dark_css'     => 'panda-syntax-dark',
                'light_css'    => 'panda-syntax-light',
                'dark_bg'      => '#292a2b',
                'dark_toolbar' => '#222324',
                'light_bg'     => '#e6e6e6',
                'light_toolbar'=> '#d9d9d9',
            ],
            'tomorrow' => [
                'label'        => 'Tomorrow Night',
                'dark_css'     => 'tomorrow-night-bright',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#000',
                'dark_toolbar' => '#0a0a0a',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
            'shades-of-purple' => [
                'label'        => 'Shades of Purple',
                'dark_css'     => 'shades-of-purple',
                'light_css'    => 'atom-one-light',
                'dark_bg'      => '#2d2b55',
                'dark_toolbar' => '#252347',
                'light_bg'     => '#fafafa',
                'light_toolbar'=> '#e8eaed',
            ],
        ];
    }

    public static function init() {
        add_action( 'init', [ __CLASS__, 'register_block' ] );
        add_action( 'admin_menu', [ __CLASS__, 'add_tools_page' ] );
        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_admin_assets' ] );
        add_action( 'wp_ajax_stodum_migrate_scan', [ __CLASS__, 'ajax_scan' ] );
        add_action( 'wp_ajax_stodum_migrate_preview', [ __CLASS__, 'ajax_preview' ] );
        add_action( 'wp_ajax_stodum_migrate_single', [ __CLASS__, 'ajax_migrate_single' ] );
        add_action( 'wp_ajax_stodum_migrate_all', [ __CLASS__, 'ajax_migrate_all' ] );
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
public static function add_tools_page() {
        add_management_page(
            'StoDum Code Block',
            'StoDum Code Block',
            'manage_options',
            self::TOOLS_SLUG,
            [ __CLASS__, 'render_tools_page' ]
        );
    }

public static function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'tools_page_' . self::TOOLS_SLUG ) {
            return;
        }

        // Tabs CSS
        wp_enqueue_style(
            'cs-admin-tabs',
            plugins_url( 'assets/cs-admin-tabs.css', __FILE__ ),
            [],
            filemtime( plugin_dir_path( __FILE__ ) . 'assets/cs-admin-tabs.css' )
        );

        // Migrate CSS + JS
        wp_enqueue_style(
            'stodum-code-migrate',
            plugins_url( 'assets/stodum-code-migrate.css', __FILE__ ),
            [],
            filemtime( plugin_dir_path( __FILE__ ) . 'assets/stodum-code-migrate.css' )
        );
        wp_enqueue_script(
            'stodum-code-migrate',
            plugins_url( 'assets/stodum-code-migrate.js', __FILE__ ),
            [],
            filemtime( plugin_dir_path( __FILE__ ) . 'assets/stodum-code-migrate.js' ),
            true
        );
        wp_localize_script( 'stodum-code-migrate', 'csDevtoolsMigrate', [
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( self::MIGRATE_NONCE ),
        ] );

        // Settings save JS
        wp_enqueue_script(
            'cs-admin-settings',
            plugins_url( 'assets/cs-admin-settings.js', __FILE__ ),
            [],
            filemtime( plugin_dir_path( __FILE__ ) . 'assets/cs-admin-settings.js' ),
            true
        );
        wp_localize_script( 'cs-admin-settings', 'csDevtoolsAdminSettings', [
            'nonce' => wp_create_nonce( 'stodum_code_settings_inline' ),
        ] );

        // SQL editor JS
        wp_enqueue_script(
            'cs-sql-editor',
            plugins_url( 'assets/cs-sql-editor.js', __FILE__ ),
            [],
            filemtime( plugin_dir_path( __FILE__ ) . 'assets/cs-sql-editor.js' ),
            true
        );
        wp_localize_script( 'cs-sql-editor', 'csDevtoolsSqlEditor', [
            'nonce' => wp_create_nonce( 'stodum_sql_nonce' ),
        ] );

        // Login security JS (only loaded on the login tab)
        $active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'migrate'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if ( $active_tab === 'login' ) {
            wp_enqueue_script(
                'cs-qrcode',
                plugins_url( 'assets/qrcode.min.js', __FILE__ ),
                [],
                filemtime( plugin_dir_path( __FILE__ ) . 'assets/qrcode.min.js' ),
                true
            );
            wp_enqueue_script(
                'cs-login',
                plugins_url( 'assets/cs-login.js', __FILE__ ),
                [ 'cs-qrcode' ],
                filemtime( plugin_dir_path( __FILE__ ) . 'assets/cs-login.js' ),
                true
            );
            wp_localize_script( 'cs-login', 'csDevtoolsLogin', [
                'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
                'nonce'       => wp_create_nonce( 'stodum_login_nonce' ),
                'currentUser' => get_current_user_id(),
            ] );
            wp_enqueue_script(
                'cs-passkey',
                plugins_url( 'assets/cs-passkey.js', __FILE__ ),
                [ 'cs-login' ],
                filemtime( plugin_dir_path( __FILE__ ) . 'assets/cs-passkey.js' ),
                true
            );
        }

        if ( $active_tab === 'mail' ) {
            wp_enqueue_script(
                'cs-smtp',
                plugins_url( 'assets/cs-smtp.js', __FILE__ ),
                [],
                filemtime( plugin_dir_path( __FILE__ ) . 'assets/cs-smtp.js' ),
                true
            );
            wp_localize_script( 'cs-smtp', 'csDevtoolsSmtp', [
                'ajaxUrl' => admin_url( 'admin-ajax.php' ),
                'nonce'   => wp_create_nonce( self::SMTP_NONCE ),
                'testTo'  => wp_get_current_user()->user_email,
            ] );
        }

        if ( $active_tab === '404' ) {
            wp_enqueue_script(
                'cs-404-admin',
                plugins_url( 'assets/cs-404-admin.js', __FILE__ ),
                [],
                filemtime( plugin_dir_path( __FILE__ ) . 'assets/cs-404-admin.js' ),
                true
            );
            wp_localize_script( 'cs-404-admin', 'csDevtools404', [
                'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
                'nonce'      => wp_create_nonce( 'stodum_404_settings' ),
                'custom_404' => get_option( self::CUSTOM_404_OPTION, 0 ) ? 1 : 0,
                'scheme'     => get_option( self::SCHEME_404_OPTION, 'ocean' ),
                'previewUrl' => home_url( '/this-page-does-not-exist' ),
            ] );
        }

        if ( $active_tab === 'thumbnails' ) {
            $thumb_js = plugin_dir_path( __FILE__ ) . 'assets/cs-thumbnails.js';
            wp_enqueue_script(
                'cs-thumbnails',
                plugins_url( 'assets/cs-thumbnails.js', __FILE__ ),
                [],
                file_exists( $thumb_js ) ? filemtime( $thumb_js ) : self::VERSION,
                true
            );
            wp_localize_script( 'cs-thumbnails', 'csDevtoolsThumbs', [
                'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
                'nonce'    => wp_create_nonce( 'stodum_thumbnails' ),
                'siteUrl'  => home_url( '/' ),
            ] );
        }
    }

public static function ajax_scan() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Forbidden', 403 );
        }

        if ( ! check_ajax_referer( self::MIGRATE_NONCE, 'nonce', false ) ) {
            wp_send_json_error( 'Bad nonce', 403 );
        }

        global $wpdb;

        // Static query — no user data; $wpdb->posts is a trusted WP core property.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
        $posts = $wpdb->get_results(
            "SELECT ID, post_title, post_status, post_date, post_content
             FROM {$wpdb->posts}
             WHERE post_type IN ('post', 'page')
               AND post_status != 'trash'
               AND (
                   post_content LIKE '%<!-- wp:code %'
                OR post_content LIKE '%<!-- wp:code-->%'
                OR post_content LIKE '%<!-- wp:code-syntax-block/code%'
                OR post_content LIKE '%<!-- wp:preformatted%'
               )
             ORDER BY post_date DESC"
        );

        if ( $posts === null ) {
            wp_send_json_error( 'Database error: ' . ( $wpdb->last_error ?: 'could not query posts' ) );
        }

        $results = [];
        foreach ( $posts as $post ) {
            $count = self::count_migrate_blocks( $post->post_content );
            if ( $count > 0 ) {
                $results[] = [
                    'id'          => (int) $post->ID,
                    'title'       => $post->post_title,
                    'status'      => $post->post_status,
                    'date'        => wp_date( 'd M Y', strtotime( $post->post_date ) ),
                    'block_count' => $count,
                    'edit_url'    => get_edit_post_link( $post->ID, 'raw' ),
                    'view_url'    => get_permalink( $post->ID ),
                ];
            }
        }

        wp_send_json_success( [
            'posts'        => $results,
            'total_posts'  => count( $results ),
            'total_blocks' => array_sum( array_column( $results, 'block_count' ) ),
        ] );
    }



public static function ajax_preview() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Forbidden', 403 );
        }

        if ( ! check_ajax_referer( self::MIGRATE_NONCE, 'nonce', false ) ) {
            wp_send_json_error( 'Bad nonce', 403 );
        }

        $post_id = (int) ( $_POST['post_id'] ?? 0 ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised via (int) cast
        $post    = get_post( $post_id );

        if ( ! $post ) {
            wp_send_json_error( 'Post not found.' );
        }

        $blocks = self::get_migration_preview( $post->post_content );

        wp_send_json_success( [
            'post_id'     => $post_id,
            'title'       => $post->post_title,
            'block_count' => count( $blocks ),
            'blocks'      => $blocks,
        ] );
    }

public static function ajax_migrate_single() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Forbidden', 403 );
        }

        if ( ! check_ajax_referer( self::MIGRATE_NONCE, 'nonce', false ) ) {
            wp_send_json_error( 'Bad nonce', 403 );
        }

        $post_id = (int) ( $_POST['post_id'] ?? 0 ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised via (int) cast
        $post    = get_post( $post_id );

        if ( ! $post ) {
            wp_send_json_error( 'Post not found.' );
        }

        $count       = self::count_migrate_blocks( $post->post_content );
        $new_content = self::convert_content( $post->post_content );

        if ( $new_content === $post->post_content ) {
            wp_send_json_error( 'No legacy code blocks found in this post.' );
        }

        global $wpdb;
        $wpdb->update(
            $wpdb->posts,
            [ 'post_content' => $new_content ],
            [ 'ID' => $post_id ],
            [ '%s' ],
            [ '%d' ]
        );
        clean_post_cache( $post_id );

        wp_send_json_success( [
            'post_id'         => $post_id,
            'blocks_migrated' => $count,
            'message'         => 'Migrated ' . $count . ' block(s) in "' . esc_html( $post->post_title ) . '".',
        ] );
    }



public static function ajax_migrate_all() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Forbidden', 403 );
        }

        if ( ! check_ajax_referer( self::MIGRATE_NONCE, 'nonce', false ) ) {
            wp_send_json_error( 'Bad nonce', 403 );
        }

        global $wpdb;

        // Static query — no user data; $wpdb->posts is a trusted WP core property.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
        $posts = $wpdb->get_results(
            "SELECT ID, post_title, post_content
             FROM {$wpdb->posts}
             WHERE post_type IN ('post', 'page')
               AND post_status != 'trash'
               AND (
                   post_content LIKE '%<!-- wp:code %'
                OR post_content LIKE '%<!-- wp:code-->%'
                OR post_content LIKE '%<!-- wp:code-syntax-block/code%'
                OR post_content LIKE '%<!-- wp:preformatted%'
               )
             ORDER BY ID ASC"
        );

        $migrated_posts  = 0;
        $migrated_blocks = 0;
        $details         = [];

        foreach ( $posts as $post ) {
            $count = self::count_migrate_blocks( $post->post_content );
            if ( $count === 0 ) {
                continue;
            }

            $new_content = self::convert_content( $post->post_content );

            if ( $new_content !== $post->post_content ) {
                $wpdb->update(
                    $wpdb->posts,
                    [ 'post_content' => $new_content ],
                    [ 'ID' => $post->ID ],
                    [ '%s' ],
                    [ '%d' ]
                );
                clean_post_cache( $post->ID );

                $migrated_posts++;
                $migrated_blocks += $count;
                $details[] = '#' . $post->ID . ': ' . esc_html( $post->post_title ) . ' (' . $count . ' blocks)';
            }
        }

        wp_send_json_success( [
            'migrated_posts'  => $migrated_posts,
            'migrated_blocks' => $migrated_blocks,
            'details'         => $details,
        ] );
    }

public static function register_settings() {
        register_setting( 'stodum_code_settings', 'stodum_code_default_theme', [
            'type'              => 'string',
            'sanitize_callback' => function ( $val ) {
                return in_array( $val, [ 'dark', 'light' ] ) ? $val : 'dark';
            },
            'default' => 'dark',
        ] );

        $valid_themes = array_keys( self::get_theme_registry() );
        register_setting( 'stodum_code_settings', 'stodum_code_theme_pair', [
            'type'              => 'string',
            'sanitize_callback' => function ( $val ) use ( $valid_themes ) {
                return in_array( $val, $valid_themes, true ) ? $val : 'atom-one';
            },
            'default' => 'atom-one',
        ] );

        register_setting( 'stodum_code_settings', 'stodum_perf_monitor_enabled', [
            'type'              => 'string',
            'sanitize_callback' => function ( $val ) {
                return '0' === $val ? '0' : '1';
            },
            'default' => '1',
        ] );

        // Login security settings
        register_setting( 'stodum_login_settings', 'stodum_login_hide_enabled', [
            'type'              => 'string',
            'sanitize_callback' => function ( $v ) { return '1' === $v ? '1' : '0'; },
            'default'           => '0',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_login_slug', [
            'type'              => 'string',
            'sanitize_callback' => function ( $v ) {
                $slug = sanitize_title( $v );
                // Disallow WP reserved slugs
                $reserved = [ 'wp-login', 'wp-admin', 'login', 'admin', 'dashboard' ];
                return in_array( $slug, $reserved, true ) ? '' : $slug;
            },
            'default' => '',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_2fa_method', [
            'type'              => 'string',
            'sanitize_callback' => function ( $v ) {
                return in_array( $v, [ 'off', 'email', 'totp' ], true ) ? $v : 'off';
            },
            'default' => 'off',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_2fa_force_admins', [
            'type'              => 'string',
            'sanitize_callback' => function ( $v ) { return '1' === $v ? '1' : '0'; },
            'default'           => '0',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_2fa_grace_logins', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) {
                $n = (int) $v;
                return ( $n >= 0 && $n <= 10 ) ? (string) $n : '0';
            },
            'default' => '0',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_session_duration', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) {
                $valid = [ 'default', '1', '7', '14', '30', '90', '365' ];
                return in_array( $v, $valid, true ) ? $v : 'default';
            },
            'default' => 'default',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_brute_force_enabled', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) { return $v === '1' ? '1' : '0'; },
            'default'           => '1',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_brute_force_attempts', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) {
                $n = (int) $v;
                return ( $n >= 1 && $n <= 100 ) ? (string) $n : '5';
            },
            'default' => '5',
        ] );
        register_setting( 'stodum_login_settings', 'stodum_brute_force_lockout', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) {
                $n = (int) $v;
                return ( $n >= 1 && $n <= 1440 ) ? (string) $n : '5';
            },
            'default' => '5',
        ] );

        // SMTP settings
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_enabled', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) { return $v === '1' ? '1' : '0'; },
            'default'           => '0',
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_host', [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_port', [
            'type'              => 'integer',
            'sanitize_callback' => static function ( $v ) {
                $v = absint( $v );
                return $v > 0 ? $v : 587;
            },
            'default'           => 587,
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_encryption', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) {
                return in_array( $v, [ 'tls', 'ssl', 'none' ], true ) ? $v : 'tls';
            },
            'default'           => 'tls',
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_auth', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) { return $v === '1' ? '1' : '0'; },
            'default'           => '1',
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_user', [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_pass', [
            'type'              => 'string',
            'sanitize_callback' => static function ( $v ) { return $v; },
            'default'           => '',
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_from_email', [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_email',
            'default'           => '',
        ] );
        register_setting( 'stodum_smtp_settings', 'stodum_smtp_from_name', [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ] );
    }


    public static function render_tools_page() {
        if ( ! current_user_can( 'manage_options' ) ) return;
        ?>
        <div class="wrap">
            <h1>StoDum Code Block</h1>
            <h2>Theme Settings</h2>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'stodum_code_settings' );
                do_settings_sections( 'stodum_code_settings' );
                ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Default Theme</th>
                        <td>
                            <select name="stodum_code_default_theme">
                                <option value="dark" <?php selected( get_option('stodum_code_default_theme'), 'dark' ); ?>>Dark</option>
                                <option value="light" <?php selected( get_option('stodum_code_default_theme'), 'light' ); ?>>Light</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Theme Pair</th>
                        <td>
                            <select name="stodum_code_theme_pair">
                                <?php foreach ( self::get_theme_registry() as $slug => $data ) : ?>
                                    <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( get_option('stodum_code_theme_pair'), $slug ); ?>>
                                        <?php echo esc_html( $data['label'] ); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr>
            <h2>Code Block Migrator</h2>
            <p>Scan your database for old core/code and core/preformatted blocks and convert them to StoDum Code Blocks.</p>
            <div id="stodum-migrate-ui">
                <button type="button" class="button button-primary" id="stodum-migrate-scan" data-nonce="<?php echo esc_attr( wp_create_nonce( self::MIGRATE_NONCE ) ); ?>">Scan Database</button>
                <div id="stodum-migrate-results" style="margin-top: 20px;"></div>
            </div>
        </div>
        <?php
    }

}

StoDum_Code_Block::init();
