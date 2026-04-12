const regex = /^```(.*)\n([\s\S]*?)^```/gm;
const text = "```bash\ncode\n```";
console.log("Test:", regex.test(text), "Index:", regex.lastIndex);
// Replace normally
console.log("Replace standard:", text.replace(regex, "REPLACED"));
// Replace with lastIndex reset
regex.lastIndex = 0;
console.log("Replace with reset:", text.replace(regex, "REPLACED"));
