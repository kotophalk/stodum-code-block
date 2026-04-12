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

    function normalizeLanguage( lang ) {
        if ( ! lang ) return '';
        var searchLang = lang.trim().toLowerCase();
        
        // Exact match or label match
        var options = [
            { label: 'Bash / Shell', value: 'bash' },
            { label: 'C', value: 'c' },
            { label: 'C++', value: 'cpp' },
            { label: 'C#', value: 'csharp' },
            { label: 'CSS', value: 'css' },
            { label: 'Dockerfile', value: 'dockerfile' },
            { label: 'Go', value: 'go' },
            { label: 'GraphQL', value: 'graphql' },
            { label: 'HCL / Terraform', value: 'hcl' },
            { label: 'HTML / XML', value: 'xml' },
            { label: 'Java', value: 'java' },
            { label: 'JavaScript', value: 'javascript' },
            { label: 'JSON', value: 'json' },
            { label: 'Kotlin', value: 'kotlin' },
            { label: 'Lua', value: 'lua' },
            { label: 'Makefile', value: 'makefile' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'Perl', value: 'perl' },
            { label: 'PHP', value: 'php' },
            { label: 'Python', value: 'python' },
            { label: 'R', value: 'r' },
            { label: 'Ruby', value: 'ruby' },
            { label: 'Rust', value: 'rust' },
            { label: 'SCSS', value: 'scss' },
            { label: 'SQL', value: 'sql' },
            { label: 'Swift', value: 'swift' },
            { label: 'TOML', value: 'toml' },
            { label: 'TypeScript', value: 'typescript' },
            { label: 'YAML', value: 'yaml' }
        ];

        for ( var i = 0; i < options.length; i++ ) {
            if ( options[i].value === searchLang || 
                 options[i].label.toLowerCase() === searchLang ) {
                return options[i].value;
            }
        }

        var aliases = {
            'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'rb': 'ruby',
            'yml': 'yaml', 'sh': 'bash', 'shell': 'bash', 'docker': 'dockerfile',
            'html': 'xml', 'cs': 'csharp', 'cpp': 'cpp', 'c++': 'cpp', 'md': 'markdown'
        };
        if ( aliases[ searchLang ] ) return aliases[ searchLang ];
        
        var common = /^(bash|sh|php|python|docker|dockerfile|js|javascript|json|html|css|sql|go|rust|c|cpp|csharp|java|ruby|swift|toml|yaml|xml|md|markdown|graphql|kotlin|lua|makefile|perl|r|scss|typescript|less|sass|docker|shell)$/i;
        if ( common.test( searchLang ) ) return searchLang;

        return '';
    }

    /**
     * Smart heuristic to guess the language even without backticks
     */
    function guessLanguage( content ) {
        if ( ! content ) return '';
        var trimmed = content.trim();

        // 1. PHP detection (variables, common operators, tags, or common functions)
        if ( trimmed.indexOf('<?php') !== -1 || 
             (/\$[a-zA-Z_\x7f-\xff]/.test(trimmed) && (
                trimmed.indexOf('->') !== -1 || 
                trimmed.indexOf('::') !== -1 || 
                trimmed.indexOf('array(') !== -1 || 
                trimmed.indexOf('foreach') !== -1 ||
                trimmed.indexOf('empty(') !== -1 ||
                trimmed.indexOf('preg_match(') !== -1 ||
                trimmed.indexOf('explode(') !== -1 ||
                trimmed.indexOf('substr(') !== -1
             ))
        ) {
            return 'php';
        }

        // 2. Bash/Shell detection (CLI tools and patterns)
        if ( /^(docker|sudo|apt-get|apt|curl|wget|npm|yarn|npx|composer|git|chmod|chown|ls|cd|mkdir|cat|echo|sh|bash|wo|acme\.sh) /m.test(trimmed) ||
             /^(export|unset|alias) [a-zA-Z0-9_]+=/m.test(trimmed) ||
             /^\$ /m.test(trimmed) || /^\# /m.test(trimmed)
        ) {
            return 'bash';
        }

        // 3. JavaScript/TypeScript detection
        if ( /^(import|export|const|let|async|await) /m.test(trimmed) || 
             (trimmed.indexOf('console.log') !== -1 && trimmed.indexOf('function') !== -1)
        ) {
            // Re-check for export...= case (likely Bash)
            if ( trimmed.indexOf('export ') === 0 && trimmed.indexOf('=') !== -1 && trimmed.indexOf(' ') === trimmed.lastIndexOf(' ') ) {
                return 'bash';
            }
            return 'javascript';
        }

        // 4. JSON / XML / HTML
        if ( trimmed.startsWith('{') && trimmed.endsWith('}') ) return 'json';
        if ( trimmed.startsWith('[') && trimmed.endsWith(']') ) return 'json';
        if ( (trimmed.indexOf('<html') !== -1 || trimmed.indexOf('<!DOCTYPE') !== -1) && trimmed.indexOf('<') !== -1 ) return 'html';
        if ( trimmed.startsWith('<') && (trimmed.indexOf('</') !== -1 || trimmed.indexOf('/>') !== -1) ) return 'xml';
        
        // 5. SQL (be strict with update/select/delete)
        if ( /^(select|insert|update|delete|create|alter|drop|truncate|grant|revoke|use|begin|commit|rollback) /i.test(trimmed) ) {
            if ( /^(wo|git|docker|npm|apt) /i.test(trimmed) ) return 'bash';
            return 'sql';
        }

        return '';
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
            var match = block.attributes.className.match( /language-([a-zA-Z0-9+#._-]+)/ );
            if ( match ) lang = normalizeLanguage( match[1] );
        }

        // Parse markdown backticks if inside content
        var fenceRegex = /(?:^|\r\n|\n)```([a-zA-Z0-9+#._-]+)?[ \t]*\r?\n([\s\S]*?)(?:\r\n|\n)```[ \t]*(?:\r?\n|$)/;
        var match = content.match( fenceRegex );
        if ( match ) {
            lang = normalizeLanguage( match[1] || '' );
            content = match[2];
        } else {
            // First line detection without backticks
            var firstLineMatch = content.match(/^([a-zA-Z0-9+#._-]+)\s*\n/);
            if ( firstLineMatch ) {
                var firstLine = firstLineMatch[1].toLowerCase();
                var normalized = normalizeLanguage( firstLine );
                var strictlyKnown = /^(bash|sh|php|python|javascript|js|json|html|css|sql|dockerfile|makefile|docker|shell)$/i.test( firstLine );
                if ( strictlyKnown && normalized ) {
                    lang = normalized;
                    var lines = content.split(/\r?\n/);
                    lines.shift();
                    content = lines.join('\n');
                }
            }
            // Fine-grained fallback: Guess if still unknown
            if ( ! lang ) {
                lang = guessLanguage( content );
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
                if ( m ) lang = normalizeLanguage( m[1] );
            }

            var fenceRegex = /(?:^|\r\n|\n)```([a-zA-Z0-9+#._-]+)?[ \t]*\r?\n([\s\S]*?)(?:\r\n|\n)```[ \t]*(?:\r?\n|$)/;
            var match = content.match( fenceRegex );
            if ( match ) {
                lang = normalizeLanguage( match[1] || '' );
                content = match[2];
            } else {
                var firstLineMatch = content.match(/^([a-zA-Z0-9+#._-]+)\s*\n/);
                if ( firstLineMatch ) {
                    var firstLine = firstLineMatch[1].toLowerCase();
                    var normalized = normalizeLanguage( firstLine );
                    var strictlyKnown = /^(bash|sh|php|python|javascript|js|json|html|css|sql|dockerfile|makefile|docker|shell)$/i.test( firstLine );
                    if ( strictlyKnown && normalized ) {
                        lang = normalized;
                        var lines = content.split(/\r?\n/);
                        lines.shift();
                        content = lines.join('\n');
                    }
                }
                // Fine-grained fallback: Guess if still unknown
                if ( ! lang ) {
                    lang = guessLanguage( content );
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
