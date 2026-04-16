<?php
/**
 * StoDum Code Block — Uninstall
 *
 * Fired when the plugin is uninstalled (deleted) from the WordPress admin.
 * Cleans up plugin options from the database.
 *
 * @package StoDum_Code_Block
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'stodum_code_default_theme' );
delete_option( 'stodum_code_theme_pair' );
