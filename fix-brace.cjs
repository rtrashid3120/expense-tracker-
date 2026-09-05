const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');
code = code.replace(
  "        } catch(e) { console.error(e); }\n      }\n    // INTENT 2.5:",
  "        } catch(e) { console.error(e); }\n      }\n    }\n    // INTENT 2.5:"
);
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
