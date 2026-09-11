/* books.html 垫片守护注入：books.html 被 build 重新生成后运行一次，恢复老内核兼容垫片 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'books.html');
const poly = fs.readFileSync(path.join(__dirname, '_tmp', 'polyfill_src.js'), 'utf8');
let h = fs.readFileSync(target, 'utf8');
h = h.replace(/<script id="xg9_poly">[\s\S]*?<\/script>/g, '');
if (!h.includes('</head>')) { console.error('books.html 无 </head>'); process.exit(1); }
h = h.replace('</head>', '<script id="xg9_poly">' + poly + '</' + 'script>\n</head>');
fs.writeFileSync(target, h);
console.log('books.html 垫片已恢复, xg9_poly 命中:', (h.match(/xg9_poly/g) || []).length);
