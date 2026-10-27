// ===================== CUTTING LAYOUT & FABRIC ESTIMATE =====================
// Every piece is expanded into what actually gets cut (pairs, on-fold pieces opened out, bias
// pieces turned 45°), then packed on single-layer fabric with the grain parallel to the selvedge.
const FABRIC_WIDTHS = { 'fat quarter': { w: 50, len: 55, label: 'fat quarter (50 × 55 cm)' }, '110': { w: 110 }, '140': { w: 140 }, '150': { w: 150 } };
function fabricWidthCm(o) {
  if (o.fabricWidth === 'custom') return Math.max(10, +o.fabricWidthCm || 110);
  return (FABRIC_WIDTHS[o.fabricWidth] || FABRIC_WIDTHS['140']).w;
}
function reflectPt(p, a, b) {
  const d = G.norm(G.sub(b, a));
  const v = G.sub(p, a); const t = G.dot(v, d);
  const foot = G.add(a, G.mul(d, t));
  return G.sub(G.mul(foot, 2), p);
}
// polygon(s) for one cut instance of a piece, with seam allowance, grain vertical
function cutShapes(pc, S, mirror) {
  let poly = cutPolygon(pc, S);
  let shapes = [poly];
  if (pc.cut && pc.cut.fold && pc.foldTag && pc.tags.includes(pc.foldTag)) {
    // open the fold out: reflect across the fold edge
    const n = pc.pts.length;
    let i0 = -1;
    for (let i = 0; i < n; i++) if (pc.tags[i] === pc.foldTag && pc.tags[(i - 1 + n) % n] !== pc.foldTag) { i0 = i; break; }
    if (i0 < 0) i0 = pc.tags.indexOf(pc.foldTag);
    let k = i0; while (pc.tags[k] === pc.foldTag && (k + 1) % n !== i0) k = (k + 1) % n;
    const a = pc.pts[i0], b = pc.pts[k === i0 ? (i0 + 1) % n : k];
    if (G.dist(a, b) > 1e-3) shapes.push(poly.map(p => reflectPt(p, a, b)));
  }
  if (mirror) shapes = shapes.map(s => s.map(p => G.P(-p.x, p.y)));
  // grain: rotate so the grain arrow is vertical (bias pieces end up at 45°)
  let ang = 0;
  if (pc.grain) { const g = G.sub(pc.grain.b, pc.grain.a); ang = Math.PI / 2 - Math.atan2(g.y, mirror ? -g.x : g.x); }
  if (pc.cut && pc.cut.bias && !pc.grain) ang = Math.PI / 4;
  while (ang > Math.PI / 2 + 1e-6) ang -= Math.PI;
  while (ang < -Math.PI / 2 - 1e-6) ang += Math.PI;
  if (Math.abs(ang) > 1e-3) shapes = shapes.map(s => s.map(p => G.rot(p, ang)));
  const all = [].concat(...shapes);
  const bb = G.bbox(all);
  shapes = shapes.map(s => s.map(p => G.P(p.x - bb.x0, p.y - bb.y0)));
  return { shapes, w: bb.w, h: bb.h };
}
function layoutCutting(pieces, S, o) {
  const W = fabricWidthCm(o);
  const sel = 1.0, gap = 0.4;
  const usable = W - 2 * sel;
  const groups = { fabric: [], lining: [], interfacing: [], stiffener: [] };
  pieces.forEach(pc => {
    const c = pc.cut || {};
    const add = (grp, n) => {
      for (let i = 0; i < n; i++) {
        const mirror = c.mirrored && i % 2 === 1;
        const sh = cutShapes(pc, S, mirror);
        groups[grp].push(Object.assign({ pc, label: pc.code || '', name: pc.name, mirror }, sh));
      }
    };
    const nf = c.fabric || 0;
    if (nf > 0) add(pc.kind === 'lining' ? 'lining' : pc.kind === 'interfacing' ? 'interfacing' : pc.kind === 'stiffener' ? 'stiffener' : 'fabric', nf);
    if (c.lining > 0) add('lining', c.lining);
    if (c.interfacing > 0) add('interfacing', c.interfacing);
    if (c.stiffener > 0) add('stiffener', c.stiffener);
  });
  const out = [];
  const names = { fabric: 'Main fabric', lining: 'Lining', interfacing: 'Interfacing', stiffener: 'Stiffener / board' };
  for (const [key, items] of Object.entries(groups)) {
    if (!items.length) continue;
    const Wg = key === 'interfacing' ? Math.min(W, 90) : key === 'stiffener' ? Math.min(W, 30) : W;
    const use = Wg - 2 * sel;
    items.sort((a, b) => b.h - a.h || b.w - a.w);
    const placed = [], shelves = [], tooWide = [];
    for (const it of items) {
      if (it.w > use) { tooWide.push(it.name); }
      let ok = false;
      for (const sh of shelves) {
        if (sh.x + it.w <= use + 1e-6 && it.h <= sh.h + 1e-6) { placed.push({ it, x: sel + sh.x, y: sh.y }); sh.x += it.w + gap; ok = true; break; }
      }
      if (!ok) {
        const y = shelves.length ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].h + gap : sel;
        shelves.push({ y, h: it.h, x: it.w + gap });
        placed.push({ it, x: sel, y });
      }
    }
    const len = shelves.length ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].h + sel : 0;
    const buy = Math.ceil((len * 1.1 + 2) / 5) * 5; // +10% for straightening / shrinkage, rounded up to 5 cm
    out.push({ key, label: names[key], W: Wg, len, buy, placed, tooWide, count: items.length });
  }
  return { W, groups: out, fq: o.fabricWidth === 'fat quarter' };
}
function cuttingSVG(g, fq) {
  const k = 4; // px per cm in the preview
  const Wpx = g.W * k, Hpx = Math.max(g.len, 5) * k;
  const fill = g.key === 'lining' ? PALETTE.lining : g.key === 'interfacing' || g.key === 'stiffener' ? PALETTE.interfacing : PALETTE.fill;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -14 ${(Wpx + 16).toFixed(0)} ${(Hpx + 30).toFixed(0)}" class="cutlayout">${svgStyleBlock()}`;
  s += `<rect x="0" y="0" width="${Wpx.toFixed(1)}" height="${Hpx.toFixed(1)}" fill="#fff" stroke="${PALETTE.ink}" stroke-width="0.8"/>`;
  s += `<text x="0" y="-4" font-size="8" class="ts">selvedge ← ${fmt(g.W, 0)} cm →</text>`;
  if (fq && g.key !== 'interfacing' && g.key !== 'stiffener') s += `<line x1="0" y1="${55 * k}" x2="${Wpx}" y2="${55 * k}" stroke="${PALETTE.mustard}" stroke-dasharray="4 3" stroke-width="0.8"/><text x="${Wpx - 2}" y="${55 * k - 3}" font-size="7" text-anchor="end" class="ts">end of a fat quarter (55 cm)</text>`;
  // grain arrow along the selvedge
  s += `<path d="M${Wpx + 4},4 V${Math.min(Hpx - 4, 60)}" stroke="${PALETTE.ink}" stroke-width="0.8"/><path d="M${Wpx + 2},${Math.min(Hpx - 4, 60) - 5} L${Wpx + 4},${Math.min(Hpx - 4, 60)} L${Wpx + 6},${Math.min(Hpx - 4, 60) - 5}" fill="none" stroke="${PALETTE.ink}" stroke-width="0.8"/>`;
  g.placed.forEach(({ it, x, y }) => {
    it.shapes.forEach(sh => {
      s += `<path d="M${sh.map(p => ((x + p.x) * k).toFixed(1) + ',' + ((y + p.y) * k).toFixed(1)).join('L')}Z" fill="${fill}" stroke="${PALETTE.wine}" stroke-width="0.7"/>`;
    });
    const cx = (x + it.w / 2) * k, cy = (y + it.h / 2) * k;
    const fs = Math.max(5, Math.min(11, Math.min(it.w, it.h) * k * 0.35));
    s += `<text x="${cx.toFixed(1)}" y="${(cy + fs * 0.35).toFixed(1)}" font-size="${fs.toFixed(1)}" text-anchor="middle" class="tb">${esc(it.label)}${it.mirror ? '′' : ''}</text>`;
  });
  s += `<text x="0" y="${(Hpx + 12).toFixed(0)}" font-size="8" class="ts">${esc(g.label)}: ${fmt(g.len, 0)} cm used · buy ${g.buy} cm</text></svg>`;
  return s;
}
