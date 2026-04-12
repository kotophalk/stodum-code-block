( function( blocks, element, blockEditor, components, i18n ) {
    'use strict';

    var el               = element.createElement;
    var useBlockProps     = blockEditor.useBlockProps;
    var InspectorControls = blockEditor.InspectorControls;
    var PanelBody         = components.PanelBody;
    var SelectControl     = components.SelectControl;
    var TextControl       = components.TextControl;
    var Fragment          = element.Fragment;
    var createBlock       = blocks.createBlock;
    var __                = i18n.__;

    console.log('STODUM: v1.0.6 loaded');

    var languageOptions = [
        { label: __( 'Auto Detect', 'stodum-code-block' ), value: '' },
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

    var themeOptions = [
        { label: __( 'Default (from settings)', 'stodum-code-block' ), value: '' },
        { label: __( 'Dark', 'stodum-code-block' ), value: 'dark' },
        { label: __( 'Light', 'stodum-code-block' ), value: 'light' }
    ];

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
        for ( var i = 0; i < languageOptions.length; i++ ) {
            if ( languageOptions[i].value === searchLang || 
                 languageOptions[i].label.toLowerCase() === searchLang ) {
                return languageOptions[i].value;
            }
        }
        // Special case aliases
        var aliases = {
            'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'rb': 'ruby',
            'yml': 'yaml', 'sh': 'bash', 'shell': 'bash', 'docker': 'dockerfile',
            'html': 'xml', 'cs': 'csharp', 'cpp': 'cpp', 'c++': 'cpp', 'md': 'markdown'
        };
        if ( aliases[ searchLang ] ) return aliases[ searchLang ];
        
        // Final fallback: known tags
        var common = /^(bash|sh|php|python|docker|dockerfile|js|javascript|json|html|css|sql|go|rust|c|cpp|csharp|java|ruby|swift|toml|yaml|xml|md|markdown|graphql|kotlin|lua|makefile|perl|r|scss|typescript|less|sass|docker|shell)$/i;
        if ( common.test( searchLang ) ) return searchLang;

        // Final fallback: single word
        if ( searchLang.length > 0 && searchLang.length < 20 && searchLang.indexOf(' ') === -1 ) {
            return searchLang;
        }

        return '';
    }

    /**
     * Smart heuristic to guess the language even without backticks
     */
    function guessLanguage( content ) {
        if ( ! content ) return '';
        var trimmed = content.trim();

        // 1. PHP detection
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

        // 2. Bash/Shell detection
        if ( /^(docker|sudo|apt-get|apt|curl|wget|npm|yarn|npx|composer|git|chmod|chown|ls|cd|mkdir|cat|echo|sh|bash) /m.test(trimmed) ||
             /^\$ /m.test(trimmed) || /^\# /m.test(trimmed)
        ) {
            return 'bash';
        }

        // 3. JavaScript/TypeScript detection
        if ( /^(import|export|const|let|async|await) /m.test(trimmed) || 
             (trimmed.indexOf('console.log') !== -1 && trimmed.indexOf('function') !== -1)
        ) {
            return 'javascript';
        }

        // 4. JSON / XML / HTML
        if ( trimmed.startsWith('{') && trimmed.endsWith('}') ) return 'json';
        if ( trimmed.startsWith('[') && trimmed.endsWith(']') ) return 'json';
        if ( trimmed.indexOf('<html') !== -1 || trimmed.indexOf('<!DOCTYPE') !== -1 ) return 'html';
        if ( trimmed.startsWith('<') && (trimmed.indexOf('</') !== -1 || trimmed.indexOf('/>') !== -1) ) return 'xml';

        return '';
    }

    blocks.registerBlockType( 'stodum/code-block', {
        attributes: {
            content: { type: 'string', default: '' },
            language: { type: 'string', default: '' },
            title: { type: 'string', default: '' },
            theme: { type: 'string', default: '' }
        },

        transforms: {
            from: [
                {
                    type: 'block',
                    blocks: [ 'core/code', 'core/preformatted' ],
                    transform: function( attributes ) {
                        var content = attributes.content || '';
                        var lang = '';
                        if ( attributes.className ) {
                            var m = attributes.className.match( /language-([a-zA-Z0-9+#._-]+)/ );
                            if ( m ) lang = normalizeLanguage( m[1] );
                        }
                        
                        // Parse markdown backticks
                        var fenceRegex = /(?:^|\r\n|\n)```([a-zA-Z0-9+#._-]+)?[ \t]*\r?\n([\s\S]*?)(?:\r\n|\n)```[ \t]*(?:\r?\n|$)/;
                        var match = content.match( fenceRegex );
                        if ( match ) {
                            lang = normalizeLanguage( match[1] || '' );
                            content = match[2];
                        } else {
                            // Check for direct first line language marker
                            var firstLineMatch = content.match(/^([a-zA-Z0-9+#._-]+)\s*\n/);
                            if ( firstLineMatch ) {
                                var firstLine = firstLineMatch[1].toLowerCase();
                                var normalized = normalizeLanguage( firstLine );
                                var isKnown = /^(bash|sh|php|python|javascript|js|json|html|css|sql|dockerfile|makefile|docker|shell)$/i.test( firstLine );
                                if ( isKnown && normalized ) {
                                    lang = normalized;
                                    var lines = content.split(/\r?\n/);
                                    lines.shift();
                                    content = lines.join('\n');
                                }
                            }
                            // Fine-grained fallback
                            if ( ! lang ) lang = guessLanguage( content );
                        }

                        return createBlock( 'stodum/code-block', {
                            content: content,
                            language: lang
                        } );
                    }
                },
                {
                    type: 'raw',
                    priority: 1,
                    isMatch: function( node ) {
                        var tag = node.nodeName.toUpperCase();
                        return tag === 'PRE' || tag === 'CODE';
                    },
                    transform: function( node ) {
                        var codeEl = node.querySelector( 'code' ) || node;
                        var code = codeEl.textContent || '';
                        var cls = codeEl.getAttribute( 'class' ) || '';
                        var m = cls.match( /language-([a-zA-Z0-9+#._-]+)/ );
                        var lang = m ? normalizeLanguage( m[1] ) : ( codeEl.getAttribute( 'lang' ) || '' );
                        if ( ! lang ) lang = guessLanguage( code );
                        
                        return createBlock( 'stodum/code-block', {
                            content: code.replace( /\n+$/, '' ),
                            language: lang
                        } );
                    }
                }
            ]
        },

        edit: function( props ) {
            var attributes = props.attributes;
            var blockProps = useBlockProps( { className: 'stodum-code-editor-wrapper' } );

            function onChangeCode( event ) { props.setAttributes( { content: event.target.value } ); }

            function onKeyDown( event ) {
                if ( event.key === 'Tab' ) {
                    event.preventDefault();
                    var ta = event.target, start = ta.selectionStart, end = ta.selectionEnd, value = ta.value;
                    ta.value = value.substring( 0, start ) + '    ' + value.substring( end );
                    ta.selectionStart = ta.selectionEnd = start + 4;
                    props.setAttributes( { content: ta.value } );
                }
            }

            var langLabel = 'Auto Detect';
            if ( attributes.language ) {
                for ( var i = 0; i < languageOptions.length; i++ ) {
                    if ( languageOptions[i].value === attributes.language ) {
                        langLabel = languageOptions[i].label;
                        break;
                    }
                }
            }

            var copyLabelState = element.useState( 'Copy' );
            var getCopyLabel = copyLabelState[0], setCopyLabel = copyLabelState[1];

            function onCopyCode() {
                var code = attributes.content || '';
                if ( ! code ) return;
                navigator.clipboard.writeText( code ).then( function() {
                    setCopyLabel( 'Copied!' );
                    setTimeout( function() { setCopyLabel( 'Copy' ); }, 1500 );
                } );
            }

            function decodeClipboardText( text ) {
                if ( typeof text !== 'string' ) return text;
                var trimmed = text.trim();
                if ( trimmed.charAt(0) === '"' && trimmed.charAt( trimmed.length - 1 ) === '"' ) {
                    try { return JSON.parse( trimmed ); } catch(e) {}
                }
                if ( /\\[ntr\\]|\\u[0-9a-fA-F]{4}/.test( trimmed ) ) {
                    return trimmed.replace( /\\([ntr\\]|u[0-9a-fA-F]{4})/g, function( _, seq ) {
                        if ( seq === 'n' ) return '\n';
                        if ( seq === 't' ) return '\t';
                        if ( seq === 'r' ) return '\r';
                        if ( seq === '\\' ) return '\\';
                        return String.fromCharCode( parseInt( seq.slice(1), 16 ) );
                    } );
                }
                return text;
            }

            function onPasteCode( event ) {
                var processPaste = function( text ) {
                    var decoded = decodeClipboardText( text );
                    var fenceRegex = /(?:^|\r\n|\n)```([a-zA-Z0-9+#._-]+)?[ \t]*\r?\n([\s\S]*?)(?:\r\n|\n)```[ \t]*(?:\r?\n|$)/;
                    var match = decoded.match( fenceRegex );
                    if ( match ) {
                        props.setAttributes( { content: match[2], language: normalizeLanguage( match[1] || '' ) } );
                        return;
                    }
                    var guessed = guessLanguage( decoded );
                    props.setAttributes( { content: decoded, language: guessed } );
                };
                if ( event && event.clipboardData ) {
                    event.preventDefault();
                    processPaste( event.clipboardData.getData( 'text' ) );
                } else if ( navigator.clipboard && navigator.clipboard.readText ) {
                    navigator.clipboard.readText().then( processPaste ).catch( function() {} );
                }
            }

            return el( Fragment, {},
                el( InspectorControls, {},
                    el( PanelBody, { title: __( 'Code Settings', 'stodum-code-block' ), initialOpen: true },
                        el( SelectControl, {
                            label: __( 'Language', 'stodum-code-block' ),
                            value: attributes.language,
                            options: languageOptions,
                            onChange: function( val ) { props.setAttributes( { language: val } ); }
                        } ),
                        el( TextControl, {
                            label: __( 'Title', 'stodum-code-block' ),
                            value: attributes.title,
                            onChange: function( val ) { props.setAttributes( { title: val } ); }
                        } )
                    )
                ),
                el( 'div', blockProps,
                    el( 'div', { className: 'stodum-code-editor-toolbar' },
                        el( 'span', { className: 'stodum-code-editor-label' }, 'StoDum Code' ),
                        el( 'span', { className: 'stodum-code-editor-lang' + ( attributes.language ? '' : ' stodum-code-editor-lang-auto' ) }, langLabel ),
                        el( 'div', { className: 'stodum-code-editor-toolbar-actions' },
                            el( 'button', { className: 'stodum-code-editor-btn', onClick: onCopyCode }, getCopyLabel ),
                            el( 'button', { className: 'stodum-code-editor-btn', onClick: onPasteCode }, 'Paste' ),
                            el( 'button', { className: 'stodum-code-editor-btn', onClick: function() { props.setAttributes({content:''}); } }, 'Clear' )
                        )
                    ),
                    el( 'textarea', {
                        className: 'stodum-code-editor-textarea',
                        value: attributes.content,
                        onChange: onChangeCode,
                        onKeyDown: onKeyDown,
                        onPaste: onPasteCode,
                        rows: Math.max( 8, ( ( attributes.content || '' ).split( '\n' ).length || 1 ) + 2 ),
                        spellCheck: false
                    } )
                )
            );
        },
        save: function() { return null; }
    } );

    // Global Paste Interceptor
    document.addEventListener( 'paste', function( event ) {
        if ( ! event.clipboardData ) return;
        var activeEl = document.activeElement;
        if ( !activeEl || !activeEl.closest('.editor-styles-wrapper') ) return;

        var text = event.clipboardData.getData('text/plain');
        if ( ! text || ! text.match(/^```/m) ) return;

        event.preventDefault();
        var blocksToInsert = [], lastIndex = 0;
        var fenceRegex = /(?:^|\r\n|\n)```([a-zA-Z0-9+#._-]+)?[ \t]*\r?\n([\s\S]*?)(?:\r\n|\n)```[ \t]*(?:\r?\n|$)/g;
        var match;

        while ( ( match = fenceRegex.exec( text ) ) !== null ) {
            var before = text.substring( lastIndex, match.index ).trim();
            if ( before ) {
                var textBlocks = window.wp.blocks.pasteHandler({ plainText: before, mode: 'BLOCKS' });
                if ( textBlocks ) blocksToInsert = blocksToInsert.concat( textBlocks );
            }
            var rawLang = match[1] || '';
            var finalLang = normalizeLanguage( rawLang ) || guessLanguage( match[2] );
            blocksToInsert.push( createBlock( 'stodum/code-block', { language: finalLang, content: match[2] } ) );
            lastIndex = fenceRegex.lastIndex;
        }
        var remaining = text.substring( lastIndex ).trim();
        if ( remaining ) {
            var textBlocks = window.wp.blocks.pasteHandler({ plainText: remaining, mode: 'BLOCKS' });
            if ( textBlocks ) blocksToInsert = blocksToInsert.concat( textBlocks );
        }
        if ( blocksToInsert.length > 0 ) {
            window.wp.data.dispatch('core/block-editor').insertBlocks( blocksToInsert );
        }
    }, true );

} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );
