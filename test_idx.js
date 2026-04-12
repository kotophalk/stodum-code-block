const regex = /^```/gm;
const text = "```bash\n...```";
console.log("Test:", regex.test(text), "Index:", regex.lastIndex);
console.log("Replace:", text.replace(regex, "REPLACED"));
