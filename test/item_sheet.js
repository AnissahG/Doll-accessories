// Render every preset of the given items for one doll to SVG: node test/item_sheet.js <outdir> <doll name prefix> <item> [item…]
const E = require('./harness'), fs = require('fs'), path = require('path');
const [out, pre, ...items] = process.argv.slice(2);
const doll = require('./real_dolls_backup.json').dolls.find(d => d.name.startsWith(pre || 'Danail'));
fs.mkdirSync(out, { recursive: true });
for (const it of items) for (const st of [''].concat(Object.keys(E.ACC_STYLES[it] || {}))) {
  const o = st ? E.applyStyle(E.normalizeOptions({ item: it }), st) : E.normalizeOptions({ item: it });
  const r = E.buildAccessory(doll, o);
  const S = E.settingsFrom(r.o), L = E.layoutPages(r.pieces, S, { title: st || it }), f = (it + '_' + (st || 'default')).replace(/[^\w]+/g, '_');
  L.pages.forEach((p, i) => fs.writeFileSync(path.join(out, f + '_p' + (i + 1) + '.svg'), E.renderPageSVG(L, i, S, { title: st || it })));
  fs.writeFileSync(path.join(out, f + '_flat.svg'), E.drawFlats(r));
  console.log((it + ' / ' + (st || 'default')).padEnd(34), 'pages', L.pages.length, '|', r.pieces.map(p => p.name + ' ' + E.G.bbox(p.pts).w.toFixed(1) + 'x' + E.G.bbox(p.pts).h.toFixed(1)).join(', ').slice(0, 160), '| warn', r.warnings.filter(w => !w.startsWith('Doll meas')).length);
}
