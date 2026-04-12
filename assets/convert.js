/**
 * StoDum Code Block - Auto Convert
 *
 * This script runs independently of the block registration.
 * It watches for core/code and core/preformatted blocks and provides
 * convert buttons (per-block banners + floating toast).
 */
( function() {
    'use strict';

    // Bail if wp.data or wp.blocks aren't available
    if ( ! window.wp || ! window.wp.data || ! window.wp.blocks ) {
        return;
    }

    var wpData   = window.wp.data;
    var wpBlocks = window.wp.blocks;

    var TOAST_ID = 'stodum-convert-all-toast';

    // =========================================================================
    //  Helper: clean HTML entities and <br>
    // =========================================================================

    function cleanHtml( text ) {
        if ( ! text ) return '';
        text = text.replace( /<br\s*\/?>/gi, '\n' );
        text = text.replace( /<[^>]+>/g, '' );
        var tmp = document.createElement( 'textarea' );
        tmp.innerHTML = text;
        return tmp.value.replace( /\n+$/, '' );
    }

    // =========================================================================
    //  Helper: find core code blocks recursively
    // =========================================================================

    function findCoreCodeBlocks( blockList ) {
        var found = [];
        for ( var i = 0; i < blockList.length; i++ ) {
            var b = blockList[ i ];
            if ( b.name === 'core/code' || b.name === 'core/preformatted' ) {
                found.push( b );
            }
            if ( b.innerBlocks && b.innerBlocks.length ) {
                found = found.concat( findCoreCodeBlocks( b.innerBlocks ) );
            }
        }
        return found;
    }

    // =========================================================================
    //  Convert a single block by clientId
    // =========================================================================

    function convertBlock( clientId ) {
        var editor = wpData.select( 'core/block-editor' );
        var block  = editor.getBlock( clientId );
        if ( ! block ) return;

        var content = block.attributes.content || '';
        if ( block.name === 'core/preformatted' ) {
            content = cleanHtml( content );
        }

        var lang = '';
        if ( block.attributes.className ) {
            var m = block.attributes.className.match( /language-([a-zA-Z0-9+#._-]+)/ );
            if ( m ) lang = m[1];
        }
        if ( ! lang && block.attributes.language ) {
            lang = block.attributes.language;
        }

        // Sometimes WP markdown parser dumps the language into the content itself like "bash\necho test"
        if ( ! lang && content.match(/^[a-zA-Z0-9+#._-]+\n/) ) {
            var lines = content.split('\n');
            var firstLine = lines[0].trim();
            // If the first line is a known language identifier without spaces
            if ( firstLine.length > 0 && firstLine.length < 15 && firstLine.indexOf(' ') === -1 ) {
                lang = firstLine;
                lines.shift();
                content = lines.join('\n');
            }
        }

        wpData.dispatch( 'core/block-editor' ).replaceBlock(
            clientId,
            wpBlocks.createBlock( 'stodum/code-block', {
                content: content,
                language: lang
            } )
        );
    }

    // =========================================================================
    //  Convert ALL core code blocks
    // =========================================================================

    function convertAll() {
        var editor     = wpData.select( 'core/block-editor' );
        var coreBlocks = findCoreCodeBlocks( editor.getBlocks() );

        for ( var i = 0; i < coreBlocks.length; i++ ) {
            var b       = coreBlocks[ i ];
            var content = b.attributes.content || '';
            if ( b.name === 'core/preformatted' ) {
                content = cleanHtml( content );
            }
            
            var lang = '';
            if ( b.attributes.className ) {
                var m = b.attributes.className.match( /language-([a-zA-Z0-9+#._-]+)/ );
                if ( m ) lang = m[1];
            }
            if ( ! lang && b.attributes.language ) {
                lang = b.attributes.language;
            }

            var firstLineMatch = content.match(/^(`{3})?\s*([a-zA-Z0-9+#._-]+)\s*\n/);
            if ( ! lang && firstLineMatch ) {
                var lines = content.split('\n');
                var firstLine = lines[0].trim().replace(/^`{3}/, '').trim();
                if ( firstLine.length > 0 && firstLine.length < 15 && firstLine.indexOf(' ') === -1 ) {
                    // Check if it's not a generic word that happened to be on the first line alone without backticks
                    // Only apply generic single words if they are known languages or if backticks were explicitly present
                    var isBacktick = lines[0].trim().indexOf('```') !== -1;
                    var knownLang = /^(bash|sh|php|python|docker|dockerfile|js|javascript|json|html|css|sql|go|rust|c|cpp|csharp|java|ruby|swift|toml|yaml)$/i.test(firstLine);
                    if ( isBacktick || knownLang ) {
                        lang = firstLine;
                        lines.shift();
                        // Strip closing ``` if exists
                        if (lines.length > 0 && lines[lines.length - 1].trim() === '```') {
                            lines.pop();
                        }
                        content = lines.join('\n');
                    }
                }
            }

            wpData.dispatch( 'core/block-editor' ).replaceBlock(
                b.clientId,
                wpBlocks.createBlock( 'stodum/code-block', {
                    content: content,
                    language: lang
                } )
            );
        }
    }

    // Expose globally
    window.__csConvertBlock = convertBlock;
    window.__csConvertAll   = convertAll;

    // =========================================================================
    //  Watch for core code blocks and show/hide toast
    // =========================================================================

    var _timer = null;

    function checkBlocks() {
        var editor = wpData.select( 'core/block-editor' );
        if ( ! editor ) return;

        var allBlocks = editor.getBlocks();
        if ( ! allBlocks ) return;

        var coreBlocks = findCoreCodeBlocks( allBlocks );
        var toast      = document.getElementById( TOAST_ID );

        if ( coreBlocks.length > 0 ) {
            if ( ! toast ) {
                toast    = document.createElement( 'div' );
                toast.id = TOAST_ID;
                document.body.appendChild( toast );
            }
            var verb = coreBlocks.length > 1 ? stodumConvertI18n.found_n : stodumConvertI18n.found_1;
            toast.innerHTML = '' +
                '<span>\u26A0\uFE0F ' + coreBlocks.length + ' ' + verb + '</span>' +
                '<button>\u26A1 ' + stodumConvertI18n.convert + '</button>';
            toast.querySelector( 'button' ).addEventListener( 'click', convertAll );
        } else {
            if ( toast ) {
                toast.remove();
            }
        }
    }

    wpData.subscribe( function() {
        if ( _timer ) clearTimeout( _timer );
        _timer = setTimeout( checkBlocks, 300 );
    } );

    // Also run once after a short delay to catch initial state
    setTimeout( checkBlocks, 1000 );

    // =========================================================================
    //  Auto-merge split INI/TOML section blocks back into preceding code block
    //
    //  When Markdown is pasted into Gutenberg, bare [word] patterns on their
    //  own line get pulled out of fenced code blocks and turned into
    //  core/shortcode blocks. This watches for that pattern and silently
    //  merges them back before the user even sees the broken state.
    //
    //  Safe guard: only merges core/shortcode blocks whose entire text content
    //  is exactly an INI/TOML section header: [word] with no attributes.
    //  Intentional shortcodes like [gallery ids="1,2"] are never touched.
    // =========================================================================

    // Matches a bare INI/TOML section header: [word] or [word-word] etc.
    var INI_SECTION_RE = /^\[[A-Za-z][A-Za-z0-9_.-]*\]$/;

    var _mergeTimer = null;

    function getShortcodeText( block ) {
        // core/shortcode stores its content in attributes.text
        return ( block.attributes && block.attributes.text )
            ? block.attributes.text.trim()
            : '';
    }

    function getParagraphText( block ) {
        if ( block.name !== 'core/paragraph' ) return null;
        var raw = ( block.attributes && block.attributes.content ) || '';
        // Strip any inline HTML tags (e.g. <strong>, <em>) Gutenberg may add
        raw = raw.replace( /<[^>]+>/g, '' );
        // Decode basic HTML entities
        var tmp = document.createElement( 'textarea' );
        tmp.innerHTML = raw;
        return tmp.value;
    }

    function checkAndMergeIniBlocks() {
        var editor   = wpData.select( 'core/block-editor' );
        var dispatch = wpData.dispatch( 'core/block-editor' );
        if ( ! editor || ! dispatch ) return;

        var blocks = editor.getBlocks();
        if ( ! blocks || blocks.length < 2 ) return;

        var mergedCount = 0;

        // Walk backwards so index shifting from removals doesn't affect us
        for ( var i = blocks.length - 2; i >= 0; i-- ) {
            if ( blocks[ i ].name !== 'stodum/code-block' ) continue;

            var codeBlock   = blocks[ i ];
            var j           = i + 1;
            var toRemove    = [];
            var appendText  = '';

            while ( j < blocks.length ) {
                var next = blocks[ j ];

                if ( next.name === 'core/shortcode' ) {
                    var sc = getShortcodeText( next );
                    if ( INI_SECTION_RE.test( sc ) ) {
                        toRemove.push( next.clientId );
                        appendText += '\n\n' + sc;
                        j++;
                        continue;
                    }
                }

                // Absorb paragraph blocks that immediately follow a section header
                if ( next.name === 'core/paragraph' && toRemove.length > 0 ) {
                    var line = getParagraphText( next );
                    // Only absorb if it looks like INI content (key = value or key-value)
                    if ( line !== null && /^[A-Za-z_]/.test( line ) ) {
                        toRemove.push( next.clientId );
                        appendText += '\n' + line;
                        j++;
                        continue;
                    }
                }

                break;
            }

            if ( toRemove.length === 0 ) continue;

            var newContent = ( codeBlock.attributes.content || '' ) + appendText;
            dispatch.updateBlockAttributes( codeBlock.clientId, { content: newContent } );
            dispatch.removeBlocks( toRemove );
            mergedCount += toRemove.length;
        }

        if ( mergedCount > 0 ) {
            showMergeToast( mergedCount );
        }
    }

    function showMergeToast( count ) {
        var id = 'cs-merge-toast';
        var existing = document.getElementById( id );
        if ( existing ) existing.remove();

        var toast = document.createElement( 'div' );
        toast.id = id;
        toast.style.cssText = 'position:fixed;bottom:72px;right:24px;z-index:999999;'
            + 'background:linear-gradient(135deg,#1e3a5f 0%,#0d9488 100%);'
            + 'color:#fff;padding:12px 18px;border-radius:8px;font-size:13px;font-weight:500;'
            + 'box-shadow:0 4px 16px rgba(0,0,0,0.25);'
            + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
            + 'animation:cs-toast-in 0.3s ease-out;';
        toast.textContent = '\u26A1 Merged ' + count + ' split code block '
            + ( count === 1 ? 'fragment' : 'fragments' ) + ' back into code block';
        document.body.appendChild( toast );
        setTimeout( function() { if ( toast.parentNode ) toast.remove(); }, 4000 );
    }

    var _lastBlockSignature = '';

    wpData.subscribe( function() {
        if ( _mergeTimer ) clearTimeout( _mergeTimer );
        _mergeTimer = setTimeout( function() {
            // Only run if the block structure actually changed (not just selection)
            var editor = wpData.select( 'core/block-editor' );
            if ( ! editor ) return;
            var blocks = editor.getBlocks();
            var sig = blocks.map( function( b ) {
                return b.name + ':' + b.clientId;
            } ).join( ',' );
            if ( sig === _lastBlockSignature ) return;
            _lastBlockSignature = sig;
            checkAndMergeIniBlocks();
        }, 400 );
    } );

} )();
