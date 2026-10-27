// ===================== HARDWARE =====================
// Sizes that are actually sold for doll bags and accessories (inner width in mm for rings, sliders,
// buckles and clasps; diameter for snaps and eyelets). Straps are sized to the hardware so the
// pattern always calls for something you can buy.
const HW = {
  ring: [3, 4, 5, 6, 8, 10, 12, 15, 20],
  slider: [3, 4, 5, 6, 8, 10, 12, 15, 20],
  buckle: [3, 4, 5, 6, 8, 10, 12, 15, 20],
  clasp: [4, 5, 6, 8, 10, 12, 15],
  snap: [4, 5, 6, 7, 8, 10],
  magnet: [8, 10, 12, 14],
  eyelet: [1.5, 2, 3, 4, 5],
  button: [3, 4, 5, 6, 8, 10],
  frame: [3, 4, 5, 6, 7, 8, 10, 12, 15]          // purse frames, cm wide
};
const ZIPS = {
  'doll zip (3 mm teeth)': { tape: 1.0, teeth: 0.3, label: 'mini doll zipper, 3 mm teeth, ~1 cm tape' },
  'small #0 zip': { tape: 1.8, teeth: 0.4, label: '#0 zipper, ~1.8 cm tape' },
  '#3 zip': { tape: 2.4, teeth: 0.6, label: '#3 zipper, ~2.4 cm tape' }
};
// nearest catalogue size (mm) to a target (mm); prefer the size just above when between two
function hwPick(kind, targetMm) {
  const list = HW[kind] || HW.ring;
  let best = list[0];
  for (const v of list) { if (v >= targetMm - 0.3) { best = v; break; } best = v; }
  return best;
}
// finished strap width (cm) that runs smoothly through a ring/slider of inner width mm
function strapForRing(mm) { return Math.max(0.2, (mm - 0.5) / 10); }
const fmtMm = (mm) => (Math.round(mm * 10) / 10) + ' mm';
// Notions list helper: merges identical lines
function addNotion(out, key, label, qty, note) {
  out.notions = out.notions || [];
  const ex = out.notions.find(n => n.key === key);
  if (ex) { ex.qty += qty; if (note && !ex.note) ex.note = note; return; }
  out.notions.push({ key, label, qty, note: note || '' });
}
