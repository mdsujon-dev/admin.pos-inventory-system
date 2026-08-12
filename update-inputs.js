const fs = require('fs');
const path = require('path');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const regex = /<InputNumber\b([^>]*?)>/g;
  const newContent = content.replace(regex, (match, p1) => {
    if (p1.includes('type="number"') || p1.includes("type={'number'}") || p1.includes('type={"number"}')) {
      return match;
    }
    return `<InputNumber type="number"${p1}>`;
  });
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated:', file);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  });
}

walk('c:/project/pos-inventory-system/admin.pos-inventory-system/src');
