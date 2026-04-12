<?php
/**
 * StoDum Code Block Settings and Admin Tools
 *
 * @package StoDum_Code_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class StoDum_Settings {

    const TOOLS_SLUG = 'stodum-code-block';

    public static function init() {
        add_action( 'admin_menu', [ __CLASS__, 'add_tools_page' ] );
        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_admin_assets' ] );
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
    }

    public static function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'tools_page_' . self::TOOLS_SLUG ) {
            return;
        }

        wp_enqueue_style(
            'stodum-code-migrate',
            plugins_url( 'assets/code-migrate.css', dirname( __FILE__ ) ),
            [],
            filemtime( plugin_dir_path( dirname( __FILE__ ) ) . 'assets/code-migrate.css' )
        );
        wp_enqueue_script(
            'stodum-code-migrate',
            plugins_url( 'assets/code-migrate.js', dirname( __FILE__ ) ),
            [],
            filemtime( plugin_dir_path( dirname( __FILE__ ) ) . 'assets/code-migrate.js' ),
            true
        );
        wp_localize_script( 'stodum-code-migrate', 'csDevtoolsMigrate', [
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'stodum_code_migrate_action' ),
            'i18n'    => [
                'scanning'           => __( 'Scanning...', 'stodum-code-block' ),
                'scan_failed'        => __( 'Scan failed:', 'stodum-code-block' ),
                'no_blocks'          => __( 'No legacy code blocks found.', 'stodum-code-block' ),
                'no_blocks_hint'     => __( 'No posts with legacy code blocks were found. Everything is already migrated.', 'stodum-code-block' ),
                'found_blocks'       => __( 'Found %1$s block(s) across %2$s post(s).', 'stodum-code-block' ),
                'posts_with_legacy'  => __( 'Posts with legacy blocks', 'stodum-code-block' ),
                'total_blocks_mig'   => __( 'Total code blocks to migrate', 'stodum-code-block' ),
                'post'               => __( 'Post', 'stodum-code-block' ),
                'blocks'             => __( 'Blocks', 'stodum-code-block' ),
                'status'             => __( 'Status', 'stodum-code-block' ),
                'actions'            => __( 'Actions', 'stodum-code-block' ),
                'pending'            => __( 'Pending', 'stodum-code-block' ),
                'preview'            => __( 'Preview', 'stodum-code-block' ),
                'migrate'            => __( 'Migrate', 'stodum-code-block' ),
                'loading_preview'    => __( 'Loading preview...', 'stodum-code-block' ),
                'loading_block_prev' => __( 'Loading block preview...', 'stodum-code-block' ),
                'error'              => __( 'Error:', 'stodum-code-block' ),
                'migrating'          => __( 'Migrating...', 'stodum-code-block' ),
                'migrate_this_post'  => __( 'Migrate This Post', 'stodum-code-block' ),
                'migration_failed'   => __( 'Migration failed:', 'stodum-code-block' ),
                'confirm_migrate'    => __( 'Migrate all code blocks in this post to StoDum format?', 'stodum-code-block' ),
                'done'               => __( 'Done', 'stodum-code-block' ),
                'view_post'          => __( 'View Post', 'stodum-code-block' ),
                'all_migrated'       => __( 'All posts migrated successfully!', 'stodum-code-block' ),
                'confirm_all'        => __( 'Are you sure you want to migrate ALL found posts? This action cannot be undone.', 'stodum-code-block' ),
            ],
        ] );
    }

    public static function add_tools_page() {
        add_management_page(
            __( 'StoDum Code Block', 'stodum-code-block' ),
            __( 'StoDum Code Block', 'stodum-code-block' ),
            'manage_options',
            self::TOOLS_SLUG,
            [ __CLASS__, 'render_tools_page' ]
        );
    }

    public static function render_tools_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        if ( isset( $_GET['settings-updated'] ) ) {
            add_settings_error( 'stodum_messages', 'stodum_message', __( 'Settings Saved', 'stodum-code-block' ), 'updated' );
        }

        settings_errors( 'stodum_messages' );
        $default_theme = get_option( 'stodum_code_default_theme', 'dark' );
        $active_pair   = get_option( 'stodum_code_theme_pair', 'atom-one' );
        ?>
        <div class="wrap" style="max-width: 900px;">
            <h1><?php esc_html_e( 'StoDum Code Block', 'stodum-code-block' ); ?></h1>

            <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); margin-top: 20px;">
                <h2 style="margin-top: 0;"><?php esc_html_e( 'Frontend Settings', 'stodum-code-block' ); ?></h2>
                <form method="post" action="options.php">
                    <?php settings_fields( 'stodum_code_settings' ); ?>
                    <table class="form-table" role="presentation">
                        <tr>
                            <th scope="row"><label for="stodum_code_default_theme"><?php esc_html_e( 'Default Theme', 'stodum-code-block' ); ?></label></th>
                            <td>
                                <select name="stodum_code_default_theme" id="stodum_code_default_theme">
                                    <option value="dark" <?php selected( $default_theme, 'dark' ); ?>><?php esc_html_e( 'Dark', 'stodum-code-block' ); ?></option>
                                    <option value="light" <?php selected( $default_theme, 'light' ); ?>><?php esc_html_e( 'Light', 'stodum-code-block' ); ?></option>
                                </select>
                                <p class="description"><?php esc_html_e( 'Select the default colour mode for your code blocks.', 'stodum-code-block' ); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="stodum_code_theme_pair"><?php esc_html_e( 'Syntax Color Theme', 'stodum-code-block' ); ?></label></th>
                            <td>
                                <select name="stodum_code_theme_pair" id="stodum_code_theme_pair">
                                    <?php foreach ( self::get_theme_registry() as $slug => $data ) : ?>
                                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $active_pair, $slug ); ?>>
                                            <?php echo esc_html( $data['label'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="description"><?php esc_html_e( 'Select the syntax highlighting color palette.', 'stodum-code-block' ); ?></p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button( __( 'Save Settings', 'stodum-code-block' ) ); ?>
                </form>
            </div>

            <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); margin-top: 20px;">
                <h2 style="margin-top: 0;"><?php esc_html_e( 'Code Block Migrator', 'stodum-code-block' ); ?></h2>
                <p><?php echo wp_kses_post( __( 'Use this tool to automatically migrate old <code>core/code</code> or <code>core/preformatted</code> blocks into modern <code>stodum/code-block</code> structures.', 'stodum-code-block' ) ); ?></p>
                
                <div style="margin: 20px 0;">
                    <button type="button" id="cs-scan-btn" class="button button-primary"><?php esc_html_e( 'Scan Posts', 'stodum-code-block' ); ?></button>
                    <span id="cs-scan-status" style="margin-left: 10px; font-weight: 600;"></span>
                </div>

                <div id="cs-scan-results" style="display:none; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                    <h3 style="margin-top:0;"><?php esc_html_e( 'Scan Results', 'stodum-code-block' ); ?></h3>
                    <div id="cs-results-area" style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; background: #fafafa; padding: 10px;"></div>
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button type="button" id="cs-migrate-all-btn" class="button button-primary"><?php esc_html_e( 'Migrate All Found Posts', 'stodum-code-block' ); ?></button>
                    </div>
                </div>
            </div>

            <!-- Preview Modal -->
            <div id="cs-preview-modal" class="cs-modal" style="display:none; position: fixed; top:0; left:0; width:100%; height:100%; z-index:99999;">
                <div class="cs-modal-backdrop" style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5);"></div>
                <div class="cs-modal-content" style="position: relative; background:#fff; margin: 50px auto; width: 80%; max-width: 900px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 80vh;">
                    <div class="cs-modal-header" style="padding: 15px 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                        <h2 id="cs-modal-title" style="margin:0;"><?php esc_html_e( 'Preview', 'stodum-code-block' ); ?></h2>
                        <button class="cs-modal-close" style="background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
                    </div>
                    <div class="cs-modal-body" id="cs-modal-body" style="padding: 20px; overflow-y: auto; flex-grow: 1;">
                        <?php esc_html_e( 'Loading...', 'stodum-code-block' ); ?>
                    </div>
                    <div class="cs-modal-footer" style="padding: 15px 20px; border-top: 1px solid #ddd; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="cs-modal-close-btn button"><?php esc_html_e( 'Cancel', 'stodum-code-block' ); ?></button>
                        <button id="cs-modal-migrate-btn" class="button button-primary" data-post-id="">
                            <span class="dashicons dashicons-yes-alt"></span> <?php esc_html_e( 'Migrate This Post', 'stodum-code-block' ); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public static function get_theme_registry() {
        return StoDum_Code_Block::get_theme_registry();
    }
}
