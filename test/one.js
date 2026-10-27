// Debug one option set: node test/one.js backup.json dollIndex '{"item":...}'
const fs = require('fs'), path = require('path');
const E = require('./harness');
const bk = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const doll = isNaN(+process.argv[3]) ? bk.dolls.find(d => d.name.startsWith(process.argv[3])) : bk.dolls[+process.argv[3]];
const out = E.buildAccessory(doll, JSON.parse(process.argv[4]));
console.log('warnings', out.warnings); console.log('notions', out.notions.map(n => JSON.stringify(n)));
const S = E.settingsFrom(out.o);
out.pieces.forEach(pc => { const b = E.G.bbox(pc.pts); const svg = E.pieceSVG(pc, S, {}); console.log(pc.code, pc.name, b.w.toFixed(2), b.h.toFixed(2), /NaN|undefined/.test(svg) ? 'BAD: ' + (svg.match(/.{80}(NaN|undefined).{40}/) || [''])[0] : 'ok'); });
const L = E.layoutPages(out.pieces, S, { title: 't' }); L.pages.forEach((p, i) => { const s = E.renderPageSVG(L, i, S, { title: 't' }); const mm = s.match(/.{100}(NaN|undefined).{60}/); if (mm) console.log('page', i, mm[0]); });
