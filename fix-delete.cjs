const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldDeleteRegex = "\\b(delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm)\\b";
const newDeleteRegex = "\\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm)\\b";

// Replace in the test regex
code = code.replace(
  new RegExp(oldDeleteRegex.replace(/\\/g, '\\\\'), 'g'),
  newDeleteRegex
);

fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
