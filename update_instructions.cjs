const fs = require('fs');

let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

content = content.replace(/systemInstruction: "([^"]+)"/g, 'systemInstruction: this.getSystemInstruction("$1")');
content = content.replace(/systemInstruction: `([^`]+)`/g, 'systemInstruction: this.getSystemInstruction(`$1`)');

fs.writeFileSync('src/services/geminiService.ts', content, 'utf8');
console.log('done');
