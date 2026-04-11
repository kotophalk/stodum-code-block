<?php
$orig = file_get_contents('/tmp/cloudscale-devtools/cs-code-block.php');
$dest = file_get_contents('/home/beaker/.openclaw/workspace/stodum-code-block/stodum-code-block.php');

function extract_method($code, $method_name) {
    $start = strpos($code, "public static function $method_name");
    if ($start === false) return "";
    $brackets = 0;
    $end = $start;
    $started = false;
    for ($i = $start; $i < strlen($code); $i++) {
        if ($code[$i] == '{') {
            $brackets++;
            $started = true;
        }
        if ($code[$i] == '}') {
            $brackets--;
            if ($started && $brackets == 0) {
                $end = $i;
                break;
            }
        }
    }
    return substr($code, $start, $end - $start + 1);
}

$methods = [
    'add_tools_page',
    'render_tools_page',
    'enqueue_admin_assets',
    'ajax_scan',
    'count_migrate_blocks',
    'ajax_preview',
    'ajax_migrate_single',
    'migrate_post',
    'ajax_migrate_all',
    'register_settings',
    'ajax_save_theme_setting'
];

$extracted = "";
foreach ($methods as $m) {
    $extracted .= "\n\n    " . extract_method($orig, $m);
}

$extracted = str_replace(
    ['cs_devtools_', 'cs-code-', 'cs-convert', 'cloudscale-devtools', 'cloudscale/code-block', 'CloudScale', 'CloudScale_DevTools'],
    ['stodum_', 'stodum-code-', 'stodum-convert', 'stodum-code-block', 'stodum/code-block', 'StoDum', 'StoDum_Code_Block'],
    $extracted
);

// Clean up render_tools_page to just show the Migrator and Theme options, remove tabs.
$render_tools = <<<HTML
    public static function render_tools_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        
        // Remove complex tab logic, just output basic markup
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
                                <?php foreach ( self::get_theme_registry() as \$slug => \$data ) : ?>
                                    <option value="<?php echo esc_attr( \$slug ); ?>" <?php selected( get_option('stodum_code_theme_pair'), \$slug ); ?>>
                                        <?php echo esc_html( \$data['label'] ); ?>
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
HTML;

$extracted = preg_replace('/public static function render_tools_page\(\).*?\n    }\n/s', $render_tools, $extracted);

$extracted = str_replace(
    "wp_enqueue_script( 'stodum-admin-tabs', plugins_url( 'assets/cs-admin-tabs.js', __FILE__ ), [], self::VERSION, true );",
    "",
    $extracted
);

// Inject into class
$dest = str_replace("public static function init() {", "public static function init() {\n        add_action( 'admin_menu', [ __CLASS__, 'add_tools_page' ] );\n        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );\n        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_admin_assets' ] );\n        add_action( 'wp_ajax_stodum_migrate_scan', [ __CLASS__, 'ajax_scan' ] );\n        add_action( 'wp_ajax_stodum_migrate_preview', [ __CLASS__, 'ajax_preview' ] );\n        add_action( 'wp_ajax_stodum_migrate_single', [ __CLASS__, 'ajax_migrate_single' ] );\n        add_action( 'wp_ajax_stodum_migrate_all', [ __CLASS__, 'ajax_migrate_all' ] );", $dest);

$dest = str_replace("}\n\nStoDum_Code_Block::init();", $extracted . "\n}\n\nStoDum_Code_Block::init();", $dest);

file_put_contents('/home/beaker/.openclaw/workspace/stodum-code-block/stodum-code-block.php', $dest);
