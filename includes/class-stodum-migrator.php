<?php
/**
 * StoDum Code Block Migrator Logic
 *
 * @package StoDum_Code_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class StoDum_Migrator {

    public static function init() {
        add_action( 'wp_ajax_stodum_migrate_scan', [ __CLASS__, 'ajax_scan' ] );
        add_action( 'wp_ajax_stodum_migrate_preview', [ __CLASS__, 'ajax_preview' ] );
        add_action( 'wp_ajax_stodum_migrate_single', [ __CLASS__, 'ajax_migrate_single' ] );
        add_action( 'wp_ajax_stodum_migrate_all', [ __CLASS__, 'ajax_migrate_all' ] );
    }

    public static function check_ajax_permissions() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Permission denied' );
            exit;
        }
        check_ajax_referer( 'stodum_code_migrate_action', 'nonce' );
    }

    public static function ajax_scan() {
        self::check_ajax_permissions();

        global $wpdb;
        $posts_table = $wpdb->posts;
        
        $query = $wpdb->prepare( "
            SELECT ID, post_title, post_content, post_type, post_status, post_date 
            FROM {$posts_table} 
            WHERE post_status IN ('publish', 'draft', 'private', 'pending', 'future')
            AND (post_content LIKE %s OR post_content LIKE %s)
            ORDER BY post_date DESC
            LIMIT 500
        ", '%<!-- wp:code %', '%<!-- wp:preformatted %' );
        
        $posts = $wpdb->get_results( $query );
        
        $found = [];
        $total_blocks = 0;
        foreach ( $posts as $post ) {
            $count = self::count_migrate_blocks( $post->post_content );
            if ( $count > 0 ) {
                $total_blocks += $count;
                $found[] = [
                    'id'          => $post->ID,
                    'title'       => $post->post_title,
                    'type'        => $post->post_type,
                    'status'      => $post->post_status,
                    'date'        => get_the_date( '', $post->ID ),
                    'view_url'    => get_permalink( $post->ID ),
                    'block_count' => $count,
                ];
            }
        }
        
        wp_send_json_success( [
            'posts'        => $found,
            'total_posts'  => count( $found ),
            'total_blocks' => $total_blocks,
        ] );
    }

    public static function ajax_preview() {
        self::check_ajax_permissions();

        $post_id = isset( $_POST['post_id'] ) ? intval( $_POST['post_id'] ) : 0;
        if ( ! $post_id ) {
            wp_send_json_error( 'Invalid post ID' );
            return;
        }

        $post = get_post( $post_id );
        if ( ! $post ) {
            wp_send_json_error( 'Post not found' );
            return;
        }

        $previews = self::get_migration_preview( $post->post_content );
        wp_send_json_success( [ 'blocks' => $previews ] );
    }

    public static function ajax_migrate_single() {
        self::check_ajax_permissions();

        $post_id = isset( $_POST['post_id'] ) ? intval( $_POST['post_id'] ) : 0;
        if ( ! $post_id ) {
            wp_send_json_error( 'Invalid post ID' );
            return;
        }

        $post = get_post( $post_id );
        if ( ! $post ) {
            wp_send_json_error( 'Post not found' );
            return;
        }

        $new_content = self::convert_content( $post->post_content );
        
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
            'message'         => 'Migrated successfully',
            'blocks_migrated' => 'all',
        ] );
    }

    public static function ajax_migrate_all() {
        self::check_ajax_permissions();

        $post_ids = isset( $_POST['post_ids'] ) && is_array( $_POST['post_ids'] ) ? array_map( 'intval', $_POST['post_ids'] ) : [];
        if ( empty( $post_ids ) ) {
            wp_send_json_error( 'No post IDs provided' );
            return;
        }

        $migrated_posts = 0;
        $migrated_blocks = 0;
        $details = [];

        global $wpdb;
        
        foreach ( $post_ids as $pid ) {
            $post = get_post( $pid );
            if ( ! $post ) continue;

            $count = self::count_migrate_blocks( $post->post_content );
            if ( $count > 0 ) {
                $new_content = self::convert_content( $post->post_content );
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

    public static function count_migrate_blocks( $content ) {
        if ( empty( $content ) ) return 0;
        $blocks = parse_blocks( $content );
        return self::count_blocks_recursive( $blocks );
    }

    private static function count_blocks_recursive( $blocks ) {
        $count = 0;
        foreach ( $blocks as $block ) {
            if ( in_array( $block['blockName'], [ 'core/code', 'core/preformatted', 'code-syntax-block/code' ], true ) ) {
                $count++;
            }
            if ( ! empty( $block['innerBlocks'] ) ) {
                $count += self::count_blocks_recursive( $block['innerBlocks'] );
            }
        }
        return $count;
    }

    public static function convert_content( $content ) {
        if ( empty( $content ) ) return $content;
        $blocks = parse_blocks( $content );
        $blocks = self::convert_blocks_recursive( $blocks );
        return serialize_blocks( $blocks );
    }

    private static function convert_blocks_recursive( $blocks ) {
        $new_blocks = [];
        foreach ( $blocks as $block ) {
            if ( in_array( $block['blockName'], [ 'core/code', 'core/preformatted', 'code-syntax-block/code' ], true ) ) {
                $block = self::convert_single_block( $block );
            }
            if ( ! empty( $block['innerBlocks'] ) ) {
                $block['innerBlocks'] = self::convert_blocks_recursive( $block['innerBlocks'] );
            }
            $new_blocks[] = $block;
        }
        return $new_blocks;
    }

    private static function convert_single_block( $block ) {
        $content = '';
        $lang    = '';

        $html = is_array( $block['innerHTML'] ?? null ) ? implode( '', $block['innerHTML'] ) : ( $block['innerHTML'] ?? '' );
        
        if ( preg_match( '/<code[^>]*>(.*?)<\/code>/is', $html, $matches ) ) {
            $content = $matches[1];
        } elseif ( preg_match( '/<pre[^>]*>(.*?)<\/pre>/is', $html, $matches ) ) {
            $content = $matches[1];
        }

        $content = html_entity_decode( $content, ENT_QUOTES | ENT_HTML5, 'UTF-8' );

        if ( ! empty( $block['attrs']['language'] ) ) {
            $lang = $block['attrs']['language'];
        } elseif ( ! empty( $block['attrs']['className'] ) && preg_match( '/language-([a-zA-Z0-9+#._-]+)/', $block['attrs']['className'], $m ) ) {
            $lang = $m[1];
        } elseif ( preg_match( '/<code[^>]*class=["\'][^"\']*language-([a-zA-Z0-9+#._-]+)/i', $html, $m ) ) {
            $lang = $m[1];
        } elseif ( preg_match( '/<pre[^>]*class=["\'][^"\']*language-([a-zA-Z0-9+#._-]+)/i', $html, $m ) ) {
            $lang = $m[1];
        }

        if ( empty( $lang ) ) {
            $trimmed = ltrim( $content );
            if ( preg_match( '/^(`{3})?\s*([a-zA-Z0-9+#._-]+)\s*[\r\n]/', $trimmed, $m ) ) {
                $lines = explode( "\n", $trimmed );
                $first_line = trim( $lines[0] );
                $clean_first = trim( preg_replace( '/^`{3}/', '', $first_line ) );
                
                if ( strlen( $clean_first ) > 0 && strlen( $clean_first ) < 15 && strpos( $clean_first, ' ' ) === false ) {
                    $is_backtick = strpos( $first_line, '```' ) !== false;
                    $known_lang = preg_match( '/^(bash|sh|php|python|docker|dockerfile|js|javascript|json|html|css|sql|go|rust|c|cpp|csharp|java|ruby|swift|toml|yaml)$/i', $clean_first );
                    
                    if ( $is_backtick || $known_lang ) {
                        $lang = strtolower( $clean_first );
                        array_shift( $lines );
                        
                        $last_idx = count( $lines ) - 1;
                        if ( $last_idx >= 0 && trim( $lines[$last_idx] ) === '```' ) {
                            array_pop( $lines );
                        }
                        $content = implode( "\n", $lines );
                    }
                }
            } else {
                // Fallback for CLI prompt or comments
                $first_lines = array_filter( array_map( 'trim', explode( "\n", $trimmed ) ) );
                $first_line  = ! empty( $first_lines ) ? reset( $first_lines ) : '';
                if ( preg_match( '/^(docker|curl|wget|apt|apt-get|npm|yarn|npx|composer|php|python|git|echo|ls|cat|sh|bash|sudo) /i', $first_line ) ) {
                    $lang = 'bash';
                } elseif ( preg_match( '/^\# /', $first_line ) ) {
                    $lang = 'bash';
                } elseif ( preg_match( '/^\/\//', $first_line ) ) {
                    $lang = 'javascript';
                }
            }
        }

        return [
            'blockName'    => 'stodum/code-block',
            'attrs'        => [
                'content'  => $content,
                'language' => $lang,
            ],
            'innerBlocks'  => [],
            'innerHTML'    => '',
            'innerContent' => [],
        ];
    }

    public static function get_migration_preview( $content ) {
        if ( empty( $content ) ) return [];
        $blocks = parse_blocks( $content );
        $previews = [];
        $index = 1;
        self::get_migration_preview_recursive( $blocks, $previews, $index );
        return $previews;
    }

    private static function get_migration_preview_recursive( $blocks, &$previews, &$index ) {
        foreach ( $blocks as $block ) {
            if ( in_array( $block['blockName'], [ 'core/code', 'core/preformatted', 'code-syntax-block/code' ], true ) ) {
                $new_block = self::convert_single_block( $block );
                
                $content = $new_block['attrs']['content'] ?? '';
                $lines = explode( "\n", $content );
                $first_line = ! empty( $lines[0] ) ? trim( $lines[0] ) : '';

                $previews[] = [
                    'index'      => $index++,
                    'language'   => $new_block['attrs']['language'] ?? '',
                    'type'       => $block['blockName'],
                    'first_line' => $first_line,
                    'original'   => serialize_blocks( [ $block ] ),
                    'converted'  => serialize_blocks( [ $new_block ] ),
                ];
            }
            if ( ! empty( $block['innerBlocks'] ) ) {
                self::get_migration_preview_recursive( $block['innerBlocks'], $previews, $index );
            }
        }
    }
}
