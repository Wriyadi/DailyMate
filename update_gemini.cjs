const { readFileSync, writeFileSync } = require('fs');

const p = 'src/services/geminiService.ts';
let code = readFileSync(p, 'utf8');
code = code.replace(/gemini-3\.0-flash/g, 'gemini-3-flash-preview');
writeFileSync(p, code, 'utf8');

console.log('done');
