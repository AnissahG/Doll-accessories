// Engine fuzz test: node test/fuzz.js [backup.json] — every item × style × doll + 3000 random option sets.
// Loads the engine from src/ (see harness.js).
const fs = require('fs'), path = require('path');
const E = require('./harness');
const bk = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : null;
const dolls = bk ? bk.dolls : [{ id: 'a', name: 'MSD', size: 'MSD', heightCm: 43, m: { chestCirc: 18 } }, { id: 'b', name: 'SD', size: 'SD', heightCm: 60, m: { chestCirc: 25 } }, { id: 'c', name: 'YOSD', size: 'YOSD', heightCm: 26, m: { chestCirc: 14 } }, { id: 'd', name: '70', size: '70cm+', heightCm: 72, m: { chestCirc: 33 } }];
let fails = 0, total = 0; const issues = {};
const note = (k, l) => (issues[k] = issues[k] || []).push(l);
function check(doll, o, label) {
  total++; let out;
  const origErr = console.error; console.error = () => {};
  try { out = E.buildAccessory(doll, o); } catch (e) { fails++; note('THROW ' + e.message, label); return; } finally { console.error = origErr; }
  const err = out.warnings.find(w => w.startsWith('Drafting error')); if (err) { fails++; note(err, label); return; }
  if (!out.pieces.length) { if (out.o.beltMake !== 'ribbon' || !out.notions.length) { fails++; note('no pieces', label); } return; }
  for (const pc of out.pieces) {
    if (pc.pts.some(p => !isFinite(p.x) || !isFinite(p.y))) { fails++; note('NaN in ' + pc.name, label); return; }
    if (pc.tags && pc.pts.length !== pc.tags.length) { fails++; note('tag mismatch ' + pc.name, label); return; }
    const b = E.G.bbox(pc.pts); if (Math.min(b.w, b.h) < 0.1 && pc.cut && (pc.cut.fabric || pc.cut.lining)) note('degenerate piece ' + pc.name, label); if (b.w > 200 || b.h > 200) note('huge piece ' + pc.name, label);
  }
  if (out.steps.some(s => /undefined|NaN/.test(JSON.stringify(s)))) note('undefined/NaN in steps', label);
  if (out.notions.some(s => /undefined|NaN/.test(JSON.stringify(s)))) note('undefined/NaN in notions', label);
  try { const S = E.settingsFrom(out.o); const L = E.layoutPages(out.pieces, S, { title: 't' }); L.pages.forEach((p, i) => { const svg = E.renderPageSVG(L, i, S, { title: 't' }); if (/NaN|undefined/.test(svg)) note('NaN/undefined in page SVG', label); }); const f = E.drawFlats(out); if (f && /NaN/.test(JSON.stringify(f))) note('NaN in flats', label); E.layoutCutting(out.pieces, S, out.o); }
  catch (e) { fails++; note('RENDER ' + e.message, label); }
}
for (const [it] of E.ITEMS) for (const st of [''].concat(Object.keys(E.ACC_STYLES[it] || {}))) for (const d of dolls) {
  const o = st ? E.applyStyle(E.normalizeOptions({ item: it }), st) : E.normalizeOptions({ item: it });
  check(d, o, it + '/' + st + '/' + d.name);
}
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const pick = a => a[Math.floor(rnd() * a.length)];
for (let i = 0; i < 3000; i++) {
  let o = E.normalizeOptions({ item: pick(E.ITEMS)[0] });
  for (let pass = 0; pass < 2; pass++) for (const dr of E.ACC_DRAWERS) for (const fd of dr.fields) {
    if (!E.fieldVisible(fd, dr, o) || ['item', 'style', 'cat', 'doll'].includes(fd.id)) continue;
    if (fd.type === 'select' && rnd() < 0.35) { const v = E.choiceVals(E.fieldChoices(fd, o)); if (v.length) o = E.normalizeOptions(Object.assign({}, o, { [fd.id]: pick(v) })); }
    if (fd.type === 'check' && rnd() < 0.25) o = E.normalizeOptions(Object.assign({}, o, { [fd.id]: rnd() < 0.5 }));
  }
  { const base = E.normalizeOptions({ item: o.item }); const dl = pick(dolls); check(dl, o, 'fuzz#' + i + ' ' + dl.name + ' ' + JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(base[k]) || k === 'item')))); }
}
console.log('total', total, 'fails', fails);
for (const [k, v] of Object.entries(issues)) console.log('\n' + k, '×' + v.length, '\n   ' + v.slice(0, 3).join('\n   '));
