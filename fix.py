with open("stodum-code-block.php", "r") as f:
    code = f.read()

# Fix menu name
code = code.replace(
    "add_management_page( __( 'StoDum Code Block', 'stodum-code-block' ), __( 'CloudScale DevTools', 'stodum-code-block' )",
    "add_management_page( __( 'StoDum Code Block', 'stodum-code-block' ), __( 'StoDum Code Block', 'stodum-code-block' )"
)

# Restore theme registry
themes = """    public static function get_theme_registry(): array {
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
            'vs2015' => [
                'label'        => 'VS 2015 / VS Code',
                'dark_css'     => 'vs2015',
                'light_css'    => 'vs',
                'dark_bg'      => '#1e1e1e',
                'dark_toolbar' => '#181818',
                'light_bg'     => '#fff',
                'light_toolbar'=> '#f3f3f3',
            ]
        ];
    }"""
import re
code = re.sub(r'public static function get_theme_registry\(\): array \{.*?\n    \}', themes, code, flags=re.DOTALL)

with open("stodum-code-block.php", "w") as f:
    f.write(code)

with open("blocks/code/editor.js", "r") as f:
    editor = f.read()

# Fix language parsing from raw markdown (which uses 'raw' transform)
raw_transform_old = """                    isMatch: function( node ) {
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
                            content: code.replace( /\\n+$/, '' ),
                            language: lang
                        } );
                    }"""

raw_transform_new = """                    isMatch: function( node ) {
                        if ( ! node || node.nodeType !== 1 ) return false;
                        var tag = node.nodeName.toUpperCase();
                        return tag === 'PRE' || tag === 'CODE';
                    },
                    transform: function( node ) {
                        var code = '';
                        var lang = '';
                        var codeEl = node.querySelector( 'code' ) || node;
                        if ( codeEl ) {
                            code = codeEl.textContent || '';
                            var cls = codeEl.getAttribute( 'class' ) || '';
                            var m = cls.match( /language-([a-zA-Z0-9+#._-]+)/ );
                            if ( m ) lang = m[1];
                            if ( ! lang ) lang = codeEl.getAttribute( 'lang' ) || '';
                        }
                        return createBlock( 'stodum/code-block', {
                            content: code.replace( /\\n+$/, '' ),
                            language: lang
                        } );
                    }"""

editor = editor.replace(raw_transform_old, raw_transform_new)

with open("blocks/code/editor.js", "w") as f:
    f.write(editor)
