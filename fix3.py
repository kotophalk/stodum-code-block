with open('blocks/code/editor.js', 'r') as f:
    data = f.read()

data = data.replace('/^[a-zA-Z0-9+#._-]+\n/', '/^[a-zA-Z0-9+#._-]+\\\\n/')
data = data.replace("content.split('\n')", "content.split('\\\\n')")
data = data.replace("lines.join('\n')", "lines.join('\\\\n')")
data = data.replace("code.split('\n')", "code.split('\\\\n')")
data = data.replace("code.join('\n')", "code.join('\\\\n')")

with open('blocks/code/editor.js', 'w') as f:
    f.write(data)

with open('assets/convert.js', 'r') as f:
    data2 = f.read()

data2 = data2.replace('/^[a-zA-Z0-9+#._-]+\n/', '/^[a-zA-Z0-9+#._-]+\\\\n/')
data2 = data2.replace("content.split('\n')", "content.split('\\\\n')")
data2 = data2.replace("lines.join('\n')", "lines.join('\\\\n')")
data2 = data2.replace("code.split('\n')", "code.split('\\\\n')")
data2 = data2.replace("code.join('\n')", "code.join('\\\\n')")

with open('assets/convert.js', 'w') as f:
    f.write(data2)