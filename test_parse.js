// Mocking the block comment structure
const text = '<!-- wp:stodum/code-block {"language":"bash","content":"echo hello"} -->\n<div class="stodum-code-wrapper"></div>\n<!-- /wp:stodum/code-block -->';
const match = text.match(/<!-- wp:stodum\/code-block (\{.*\}) -->/);
if (match) {
    const attrs = JSON.parse(match[1]);
    console.log("Parsed Attrs:", attrs);
}
