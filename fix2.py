import re

with open("/tmp/cloudscale-devtools/cs-code-block.php", "r") as f:
    orig = f.read()

match = re.search(r'public static function get_theme_registry\(\): array \{.*?\n    \}', orig, flags=re.DOTALL)
if match:
    themes = match.group(0)
    with open("/home/beaker/.openclaw/workspace/stodum-code-block/stodum-code-block.php", "r") as f:
        dest = f.read()
    
    dest = re.sub(r'public static function get_theme_registry\(\): array \{.*?\n    \}', themes, dest, flags=re.DOTALL)
    
    # Fix menu name
    dest = dest.replace("'CloudScale DevTools',\n            '🌩️ CloudScale DevTools',", "'StoDum Code Block',\n            'StoDum Code Block',")
    dest = dest.replace("'CloudScale DevTools', '🌩️ CloudScale DevTools',", "'StoDum Code Block', 'StoDum Code Block',")
    
    with open("/home/beaker/.openclaw/workspace/stodum-code-block/stodum-code-block.php", "w") as f:
        f.write(dest)
