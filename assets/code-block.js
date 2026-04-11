/**
 * StoDum Code Block — Frontend Script v1.7.5
 *
 * Reads theme colours from stodumCodeConfig (set by PHP) and applies them
 * via CSS custom properties so any highlight.js theme pair works.
 */

( function() {
    'use strict';

    var cfg = window.stodumCodeConfig || {};
    var defaultTheme = cfg.defaultTheme || 'dark';

    // Theme colour config from PHP
    var themeColors = {
        dark: {
            bg:      cfg.darkBg      || '#282c34',
            toolbar: cfg.darkToolbar || '#21252b'
        },
        light: {
            bg:      cfg.lightBg      || '#fafafa',
            toolbar: cfg.lightToolbar || '#e8eaed'
        }
    };

    var langNames = {
        'bash':       'Bash',
        'shell':      'Shell',
        'sh':         'Shell',
        'zsh':        'Zsh',
        'python':     'Python',
        'py':         'Python',
        'java':       'Java',
        'javascript': 'JavaScript',
        'js':         'JavaScript',
        'typescript': 'TypeScript',
        'ts':         'TypeScript',
        'csharp':     'C#',
        'cs':         'C#',
        'c':          'C',
        'cpp':        'C++',
        'rust':       'Rust',
        'rs':         'Rust',
        'php':        'PHP',
        'go':         'Go',
        'ruby':       'Ruby',
        'rb':         'Ruby',
        'swift':      'Swift',
        'kotlin':     'Kotlin',
        'sql':        'SQL',
        'json':       'JSON',
        'yaml':       'YAML',
        'yml':        'YAML',
        'xml':        'XML',
        'html':       'HTML',
        'css':        'CSS',
        'scss':       'SCSS',
        'less':       'Less',
        'markdown':   'Markdown',
        'md':         'Markdown',
        'makefile':   'Makefile',
        'dockerfile': 'Dockerfile',
        'lua':        'Lua',
        'perl':       'Perl',
        'r':          'R',
        'ini':        'INI',
        'toml':       'TOML',
        'diff':       'Diff',
        'graphql':    'GraphQL',
        'plaintext':  'Text',
        'objectivec': 'Objective-C',
        'vbnet':      'VB.NET',
        'wasm':       'WebAssembly',
        'hcl':        'HCL',
        'terraform':  'Terraform'
    };

    function getThemeLinks() {
        var links = document.querySelectorAll( 'link[rel="stylesheet"]' );
        var dark = null, light = null;
        for ( var i = 0; i < links.length; i++ ) {
            var id = links[i].getAttribute( 'id' ) || '';
            if ( id === 'hljs-theme-dark-css' ) dark = links[i];
            if ( id === 'hljs-theme-light-css' ) light = links[i];
        }
        // Fallback: find by href pattern
        if ( !dark || !light ) {
            for ( var j = 0; j < links.length; j++ ) {
                var href = links[j].getAttribute( 'href' ) || '';
                if ( !dark && href.indexOf( 'highlight.js' ) !== -1 && href.indexOf( 'styles/' ) !== -1 ) {
                    // First hljs style link = dark
                    if ( !dark ) { dark = links[j]; continue; }
                }
                if ( dark && !light && href.indexOf( 'highlight.js' ) !== -1 && href.indexOf( 'styles/' ) !== -1 ) {
                    light = links[j];
                }
            }
        }
        return { dark: dark, light: light };
    }

    function applyGlobalTheme( activeTheme ) {
        var links = getThemeLinks();
        if ( activeTheme === 'light' ) {
            if ( links.dark ) links.dark.disabled = true;
            if ( links.light ) links.light.disabled = false;
        } else {
            if ( links.dark ) links.dark.disabled = false;
            if ( links.light ) links.light.disabled = true;
        }
    }

    function syncGlobalTheme() {
        var wrappers = document.querySelectorAll( '.stodum-code-wrapper' );
        var darkCount = 0, lightCount = 0;
        for ( var i = 0; i < wrappers.length; i++ ) {
            if ( wrappers[i].getAttribute( 'data-active-theme' ) === 'light' ) lightCount++;
            else darkCount++;
        }
        applyGlobalTheme( lightCount > darkCount ? 'light' : 'dark' );
    }

    /**
     * Apply CSS custom properties for the theme colours on a wrapper.
     */
    function applyThemeVars( wrapper, mode ) {
        var colors = themeColors[ mode ] || themeColors.dark;
        wrapper.style.setProperty( '--cs-bg', colors.bg );
        wrapper.style.setProperty( '--cs-toolbar-bg', colors.toolbar );
    }

    /**
     * Build or rebuild line numbers gutter for a code block.
     */
    function buildLineNumbers( wrapper ) {
        var codeEl = wrapper.querySelector( 'pre code' );
        if ( ! codeEl ) return;

        var existing = wrapper.querySelector( '.stodum-code-line-numbers' );
        if ( existing ) existing.remove();

        if ( ! wrapper.classList.contains( 'cs-lines-active' ) ) return;

        var text      = codeEl.textContent || '';
        var lineCount = text.split( '\n' ).length;

        if ( text.charAt( text.length - 1 ) === '\n' ) {
            lineCount--;
        }
        if ( lineCount < 1 ) lineCount = 1;

        var gutter = document.createElement( 'div' );
        gutter.className = 'stodum-code-line-numbers';
        gutter.setAttribute( 'aria-hidden', 'true' );

        var nums = [];
        for ( var i = 1; i <= lineCount; i++ ) {
            nums.push( '<span>' + i + '</span>' );
        }
        gutter.innerHTML = nums.join( '\n' );

        var body = wrapper.querySelector( '.stodum-code-body' );
        var pre  = wrapper.querySelector( 'pre' );
        if ( body && pre ) {
            body.insertBefore( gutter, pre );
        }
    }

    function initBlock( wrapper ) {
        var codeEl = wrapper.querySelector( 'pre code' );
        if ( !codeEl ) return;

        // Set theme: per block override > global default
        var blockTheme = wrapper.getAttribute( 'data-theme' ) || defaultTheme;
        wrapper.setAttribute( 'data-active-theme', blockTheme );
        applyThemeVars( wrapper, blockTheme );

        // Run highlight.js
        hljs.highlightElement( codeEl );

        // Language badge
        var detectedLang = '';
        var match = ( codeEl.className || '' ).match( /language-(\S+)/ );
        if ( match ) detectedLang = match[1];

        var badge = wrapper.querySelector( '.stodum-code-lang-badge' );
        var skipBadge = [ 'undefined', 'plaintext', 'text' ];
        if ( badge && detectedLang && skipBadge.indexOf( detectedLang.toLowerCase() ) === -1 ) {
            badge.textContent = langNames[ detectedLang.toLowerCase() ] || detectedLang;
        }

        // Copy button
        var copyBtn = wrapper.querySelector( '.stodum-code-copy' );
        if ( copyBtn ) {
            copyBtn.addEventListener( 'click', function() {
                var text = codeEl.textContent || codeEl.innerText;
                copyToClipboard( text ).then( function() {
                    copyBtn.classList.add( 'copied' );
                    setTimeout( function() {
                        copyBtn.classList.remove( 'copied' );
                    }, 2000 );
                } ).catch( function( e ) {
                    console.error( 'stodum-code-block: clipboard write failed', e );
                } );
            } );
        }

        // Theme toggle
        var toggleBtn = wrapper.querySelector( '.stodum-code-theme-toggle' );
        if ( toggleBtn ) {
            toggleBtn.addEventListener( 'click', function() {
                var current = wrapper.getAttribute( 'data-active-theme' );
                var next = ( current === 'dark' ) ? 'light' : 'dark';
                wrapper.setAttribute( 'data-active-theme', next );
                applyThemeVars( wrapper, next );

                // Switch the global hljs stylesheet so syntax colors update
                applyGlobalTheme( next );

                // Re-highlight
                var raw = codeEl.textContent;
                codeEl.removeAttribute( 'data-highlighted' );
                codeEl.classList.remove( 'hljs' );
                codeEl.textContent = raw;
                hljs.highlightElement( codeEl );
            } );
        }

        // Line numbers toggle
        var linesBtn = wrapper.querySelector( '.stodum-code-lines-toggle' );
        if ( linesBtn ) {
            linesBtn.addEventListener( 'click', function() {
                wrapper.classList.toggle( 'cs-lines-active' );
                buildLineNumbers( wrapper );
            } );
        }
    }

    function copyToClipboard( text ) {
        if ( navigator.clipboard && window.isSecureContext ) {
            return navigator.clipboard.writeText( text );
        }
        var ta = document.createElement( 'textarea' );
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild( ta );
        ta.select();
        try { document.execCommand( 'copy' ); } catch ( e ) { /* silent */ }
        document.body.removeChild( ta );
        return Promise.resolve();
    }

    function boot() {
        if ( typeof hljs === 'undefined' ) {
            setTimeout( boot, 100 );
            return;
        }

        hljs.configure( {
            languages: [
                'bash', 'shell', 'python', 'java', 'javascript', 'typescript',
                'csharp', 'c', 'cpp', 'rust', 'php', 'go', 'ruby', 'swift',
                'kotlin', 'sql', 'json', 'yaml', 'xml', 'html', 'css', 'scss',
                'markdown', 'makefile', 'lua', 'perl', 'r', 'ini', 'diff',
                'graphql', 'objectivec', 'vbnet'
            ]
        } );

        // Set global theme stylesheet before highlighting
        applyGlobalTheme( defaultTheme );

        var wrappers = document.querySelectorAll( '.stodum-code-wrapper' );
        for ( var i = 0; i < wrappers.length; i++ ) {
            initBlock( wrappers[i] );
        }

        syncGlobalTheme();
    }

    if ( document.readyState === 'loading' ) {
        document.addEventListener( 'DOMContentLoaded', boot );
    } else {
        boot();
    }
} )();
