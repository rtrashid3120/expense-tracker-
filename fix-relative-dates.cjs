const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldStr = `      } else if (/(\\d+)\\s+days?\\s+ago/i.test(cleanQuery)) {
        const match = cleanQuery.match(/(\\d+)\\s+days?\\s+ago/i);
        const d = new Date(now);
        d.setDate(d.getDate() - parseInt(match[1]));
        targetDate = \\\`\\\${d.getFullYear()}-\\\${String(d.getMonth()+1).padStart(2,'0')}-\\\${String(d.getDate()).padStart(2,'0')}\\\`;
        cleanQuery = cleanQuery.replace(/(\\d+)\\s+days?\\s+ago/gi, ' ');
      } else {`;

const newStr = `      } else if (/(\\d+)\\s+days?\\s+ago/i.test(cleanQuery)) {
        const match = cleanQuery.match(/(\\d+)\\s+days?\\s+ago/i);
        if (match) {
          const d = new Date(now);
          d.setDate(d.getDate() - parseInt(match[1]));
          targetDate = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
          cleanQuery = cleanQuery.replace(/(\\d+)\\s+days?\\s+ago/gi, ' ');
        }
      } else {`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
