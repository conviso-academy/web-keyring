const fs = require('fs');
let file = fs.readFileSync('src/main.ts', 'utf8');
file = file.replace(/if \(state.currentView !== 'login'\) {\n\s+navigate\('login'\);\n\s+}/, "navigate('login');");
fs.writeFileSync('src/main.ts', file);
