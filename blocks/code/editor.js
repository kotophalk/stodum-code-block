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

    var languageOptions = [
        { label: 'Auto Detect', value: '' },
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
        { label: 'Default (from settings)', value: '' },
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' }
    ];

    function cleanHtml( text ) {
        if ( ! text ) return '';
        text = text.replace( /<br\s*\/?>/gi, '\n' );
        text = text.replace( /<[^>]+>/g, '' );
        var tmp = document.createElement( 'textarea' );
        tmp.innerHTML = text;
        return tmp.value.replace( /\n+$/, '' );
    }

    blocks.registerBlockType( 'stodum/code-block', {

        transforms: {
            from: [
                {
                    type: 'block',
                    blocks: [ 'core/code' ],
                    transform: function( attributes ) {
                        var lang = '';
                        if ( attributes.className ) {
                            var match = attributes.className.match( /language-([a-zA-Z0-9+#._-]+)/ );
                            if ( match ) lang = match[1];
                        }
                        return createBlock( 'stodum/code-block', {
                            content: attributes.content || '',
                            language: lang || attributes.language || ''
                        } );
                    }
                },
                {
                    type: 'block',
                    blocks: [ 'core/preformatted' ],
                    transform: function( attributes ) {
                        return createBlock( 'stodum/code-block', {
                            content: cleanHtml( attributes.content || '' ),
                            language: ''
                        } );
                    }
                },
                {
                    type: 'raw',
                    priority: 1,
                    isMatch: function( node ) {
                        if ( ! node || node.nodeType !== 1 ) return false;
                        var tag = node.nodeName.toUpperCase();
                        return tag === 'PRE' || tag === 'CODE';
                    },
                    transform: function( node ) {
                        var code = '';
                        var lang = '';
                        var codeEl = node.querySelector( 'code' );
                        if ( codeEl ) {
                            code = codeEl.textContent || '';
                            var cls = codeEl.getAttribute( 'class' ) || '';
                            var m = cls.match( /language-([a-zA-Z0-9+#._-]+)/ );
                            if ( m ) lang = m[1];
                            if ( ! lang ) lang = codeEl.getAttribute( 'lang' ) || '';
                        } else {
                            code = cleanHtml( node.innerHTML || '' );
                        }
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

            var blockProps = useBlockProps( {
                className: 'stodum-code-editor-wrapper'
            } );

            function onChangeCode( event ) {
                props.setAttributes( { content: event.target.value } );
            }

            function onKeyDown( event ) {
                if ( event.key === 'Tab' ) {
                    event.preventDefault();
                    var ta    = event.target;
                    var start = ta.selectionStart;
                    var end   = ta.selectionEnd;
                    var value = ta.value;
                    ta.value  = value.substring( 0, start ) + '    ' + value.substring( end );
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
            var getCopyLabel = copyLabelState[0];
            var setCopyLabel = copyLabelState[1];

            function onCopyCode() {
                var code = attributes.content || '';
                if ( ! code ) return;
                if ( navigator.clipboard && navigator.clipboard.writeText ) {
                    navigator.clipboard.writeText( code ).then( function() {
                        setCopyLabel( 'Copied!' );
                        setTimeout( function() { setCopyLabel( 'Copy' ); }, 1500 );
                    } );
                } else {
                    var ta = document.createElement( 'textarea' );
                    ta.value = code;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild( ta );
                    ta.select();
                    document.execCommand( 'copy' );
                    document.body.removeChild( ta );
                    setCopyLabel( 'Copied!' );
                    setTimeout( function() { setCopyLabel( 'Copy' ); }, 1500 );
                }
            }

            function onClearCode() {
                props.setAttributes( { content: '' } );
            }

            function decodeClipboardText( text ) {
                // Gutenberg sometimes JSON-encodes clipboard text internally,
                // producing escape sequences like \n, \u0022, or bare u003c.
                if ( typeof text !== 'string' ) return text;
                var trimmed = text.trim();
                // Case 1: Already a full JSON string value (wrapped in quotes) — parse directly.
                if ( trimmed.charAt(0) === '"' && trimmed.charAt( trimmed.length - 1 ) === '"' ) {
                    try { return JSON.parse( trimmed ); } catch(e) {}
                }
                // Case 2: Contains backslash escape sequences (\n, \t, \r, \\, \uXXXX).
                // Decode directly instead of via JSON.parse, which fails when \u0022
                // decodes to " and creates an unterminated string literal.
                if ( /\\[ntr\\]|\\u[0-9a-fA-F]{4}/.test( trimmed ) ) {
                    return trimmed.replace( /\\([ntr\\]|u[0-9a-fA-F]{4})/g, function( _, seq ) {
                        if ( seq === 'n' ) return '\n';
                        if ( seq === 't' ) return '\t';
                        if ( seq === 'r' ) return '\r';
                        if ( seq === '\\' ) return '\\';
                        return String.fromCharCode( parseInt( seq.slice(1), 16 ) );
                    } );
                }
                // Case 3: Bare unicode escapes without backslash (u003c style).
                // Decode directly for the same reason as Case 2.
                if ( /(?:^|[^\\])u[0-9a-fA-F]{4}/.test( trimmed ) ) {
                    return trimmed.replace( /u([0-9a-fA-F]{4})/g, function( _, hex ) {
                        return String.fromCharCode( parseInt( hex, 16 ) );
                    } );
                }
                return text;
            }

            function onPasteCode( event ) {
                // Called both from the toolbar Paste button (no event) and the
                // textarea's onPaste handler (event.clipboardData available).
                if ( event && event.clipboardData ) {
                    event.preventDefault();
                    var text = event.clipboardData.getData( 'text' );
                    props.setAttributes( { content: decodeClipboardText( text ) } );
                } else if ( navigator.clipboard && navigator.clipboard.readText ) {
                    navigator.clipboard.readText().then( function( text ) {
                        props.setAttributes( { content: decodeClipboardText( text ) } );
                    } ).catch( function() {} );
                }
            }

            return el( Fragment, {},
                el( InspectorControls, {},
                    el( PanelBody, { title: __( 'Code Settings', 'stodum-code-block' ), initialOpen: true },
                        el( SelectControl, {
                            label: __( 'Language', 'stodum-code-block' ),
                            help: __( 'Leave on Auto Detect to let highlight.js guess the language.', 'stodum-code-block' ),
                            value: attributes.language,
                            options: languageOptions,
                            onChange: function( val ) { props.setAttributes( { language: val } ); }
                        } ),
                        el( TextControl, {
                            label: __( 'Title', 'stodum-code-block' ),
                            help: __( 'Optional label shown above the code (e.g. filename).', 'stodum-code-block' ),
                            value: attributes.title,
                            onChange: function( val ) { props.setAttributes( { title: val } ); }
                        } ),
                        el( SelectControl, {
                            label: __( 'Dark / Light Mode', 'stodum-code-block' ),
                            help: __( 'Override for this block. The color theme is set site wide in Tools > StoDum Code and SQL.', 'stodum-code-block' ),
                            value: attributes.theme,
                            options: themeOptions,
                            onChange: function( val ) { props.setAttributes( { theme: val } ); }
                        } )
                    )
                ),
                el( 'div', blockProps,
                    el( 'div', { className: 'stodum-code-editor-toolbar' },
                        el( 'span', { className: 'stodum-code-editor-icon' },
                            el( 'svg', { xmlns: 'http://www.w3.org/2000/svg', width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                                el( 'polyline', { points: '16 18 22 12 16 6' } ),
                                el( 'polyline', { points: '8 6 2 12 8 18' } )
                            )
                        ),
                        el( 'span', { className: 'stodum-code-editor-label' }, 'StoDum Code' ),
                        attributes.language
                            ? el( 'span', { className: 'stodum-code-editor-lang' }, langLabel )
                            : el( 'span', { className: 'stodum-code-editor-lang stodum-code-editor-lang-auto' }, 'Auto Detect' ),
                        attributes.title
                            ? el( 'span', { className: 'stodum-code-editor-title' }, attributes.title )
                            : null,
                        el( 'div', { className: 'stodum-code-editor-toolbar-actions' },
                            el( 'button', {
                                className: 'stodum-code-editor-btn stodum-code-editor-btn-copy',
                                type: 'button',
                                title: __( 'Copy code to clipboard', 'stodum-code-block' ),
                                onClick: onCopyCode
                            }, getCopyLabel ),
                            el( 'button', {
                                className: 'stodum-code-editor-btn stodum-code-editor-btn-paste',
                                type: 'button',
                                title: __( 'Paste clipboard content', 'stodum-code-block' ),
                                onClick: onPasteCode
                            }, 'Paste' ),
                            el( 'button', {
                                className: 'stodum-code-editor-btn stodum-code-editor-btn-clear',
                                type: 'button',
                                title: __( 'Clear all code', 'stodum-code-block' ),
                                onClick: onClearCode
                            }, 'Clear' )
                        )
                    ),
                    el( 'textarea', {
                        className: 'stodum-code-editor-textarea',
                        value: attributes.content,
                        onChange: onChangeCode,
                        onKeyDown: onKeyDown,
                        onPaste: onPasteCode,
                        placeholder: __( 'Paste or type your code here...', 'stodum-code-block' ),
                        rows: Math.max( 8, ( ( attributes.content || '' ).split( '\n' ).length || 1 ) + 2 ),
                        spellCheck: false,
                        autoComplete: 'off',
                        autoCorrect: 'off',
                        autoCapitalize: 'off'
                    } )
                )
            );
        },
        save: function() {
            return null;
        }
    } );

} )(
    window.wp.blocks,
    window.wp.element,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.i18n
);
