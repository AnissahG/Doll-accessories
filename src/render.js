// ===================== RENDERING (SVG) =====================
// Pattern pieces are rendered at true scale: 1 cm = 10 SVG user units (mm).
const PALETTE = {
  ink: '#2C2418', inkSoft: '#6b6152', wine: '#7B2D3A', mustard: '#A9782E', sage: '#5C6A50',
  line: '#C7B999', paper: '#FFFFFF', fill: '#FBF7EE', lining: '#EEF2EA', contrast: '#F7ECE6', interfacing: '#E9E4D8', blue: '#3E5C76'
};
// This <style> block travels inside every exported SVG so it renders exactly like the app.
function svgStyleBlock() {
  const p = PALETTE;
  return `<style>
.pc-fill{fill:${p.fill};stroke:none}
.pc-fill.lining{fill:${p.lining}}.pc-fill.contrast{fill:${p.contrast}}.pc-fill.interfacing{fill:${p.interfacing}}.pc-fill.stiffener{fill:${p.interfacing}}
.cut{fill:none;stroke:${p.ink};stroke-width:0.45;stroke-linejoin:round}
.stitch{fill:none;stroke:${p.wine};stroke-width:0.3;stroke-dasharray:1.6 1;stroke-linejoin:round}
.foldedge{fill:none;stroke:${p.mustard};stroke-width:0.7;stroke-dasharray:4 1.2 0.8 1.2}
.foldline{fill:none;stroke:${p.mustard};stroke-width:0.35;stroke-dasharray:3 1 0.6 1}
.centre{fill:none;stroke:${p.blue};stroke-width:0.3;stroke-dasharray:5 1.2 0.8 1.2}
.grain{fill:none;stroke:${p.ink};stroke-width:0.35}
.grainhead{fill:${p.ink};stroke:none}
.stretch{fill:none;stroke:${p.sage};stroke-width:0.35;stroke-dasharray:1.2 0.8}
.notch{fill:none;stroke:${p.ink};stroke-width:0.4}
.dart{fill:none;stroke:${p.wine};stroke-width:0.35}
.dartfill{fill:${p.wine};fill-opacity:0.07;stroke:none}
.gather{fill:none;stroke:${p.mustard};stroke-width:0.35}
.pleat{fill:none;stroke:${p.sage};stroke-width:0.35;stroke-dasharray:2 0.8}
.pleatarrow{fill:${p.sage};stroke:none}
.place{fill:none;stroke:${p.sage};stroke-width:0.35;stroke-dasharray:1.2 0.8}
.cutout{fill:${p.wine};fill-opacity:0.06;stroke:${p.wine};stroke-width:0.35;stroke-dasharray:1 0.7}
.topstitch{fill:none;stroke:${p.inkSoft};stroke-width:0.25;stroke-dasharray:0.7 0.5}
.snapball{fill:${p.sage};stroke:${p.ink};stroke-width:0.25}
.snapsock{fill:#fff;stroke:${p.sage};stroke-width:0.5}
.button{fill:#fff;stroke:${p.wine};stroke-width:0.45}
.bhole{fill:none;stroke:${p.wine};stroke-width:0.6}
.eyelet{fill:#fff;stroke:${p.ink};stroke-width:0.4}
.dot{fill:${p.ink};stroke:none}
.t{font-family:Inter,Helvetica,Arial,sans-serif;fill:${p.ink}}
.tl{font-family:Georgia,'Times New Roman',serif;fill:${p.ink};font-weight:700}
.tb{font-family:Inter,Helvetica,Arial,sans-serif;fill:${p.wine};font-weight:700;letter-spacing:0.6px}
.ts{font-family:Inter,Helvetica,Arial,sans-serif;fill:${p.inkSoft}}
.sa-t{font-family:Inter,Helvetica,Arial,sans-serif;fill:${p.wine}}
.pagebox{fill:none;stroke:${p.line};stroke-width:0.3}
.ruler{fill:none;stroke:${p.ink};stroke-width:0.3}
.testsq{fill:none;stroke:${p.ink};stroke-width:0.4}
.tilemark{fill:none;stroke:${p.ink};stroke-width:0.3}
.flat{fill:#fff;stroke:${p.ink};stroke-width:0.6;stroke-linejoin:round}
.flatd{fill:none;stroke:${p.ink};stroke-width:0.35;stroke-dasharray:1.2 0.8}
.flatl{fill:none;stroke:${p.ink};stroke-width:0.4}
</style>`;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const U = 10; // mm per cm

// ---------- seam allowance resolution ----------
const TAG_KIND = {
  hem: 'hem', sleevehem: 'hem', fold: 'fold', none: 'none', ext: 'none', finish: 'seam', top: 'seam', neck: 'seam',
  shoulder: 'seam', armhole: 'seam', side: 'seam', cap: 'seam', underarm: 'seam', waist: 'seam', seam: 'seam',
  cf: 'seam', cb: 'seam', neckjoin: 'seam', cuffseam: 'seam', wrapedge: 'seam', raglan: 'seam', dartcut: 'seam'
};
function segSA(piece, tag, S) {
  if (!S.useSA) return 0;
  const e = piece.edges[tag] || {};
  let kind = e.kind || TAG_KIND[tag] || 'seam';
  if (piece.foldTag && tag === piece.foldTag) kind = 'fold';
  if (kind === 'fold' || kind === 'none') return 0;
  if (e.sa !== undefined) return e.sa;
  if (kind === 'hem') return S.hemSa;
  return S.sa;
}
function segKind(piece, tag) {
  const e = piece.edges[tag] || {};
  let kind = e.kind || TAG_KIND[tag] || 'seam';
  if (piece.foldTag && tag === piece.foldTag) kind = 'fold';
  return kind;
}
function cutPolygon(piece, S) {
  const d = piece.tags.map(t => segSA(piece, t, S));
  let off = G.offsetPoly(piece.pts, d);
  off = G.unloop(off);
  return off;
}

// ---------- piece -> SVG group (in piece-local mm coordinates) ----------
function pieceSVG(piece, S, info) {
  const pts = piece.pts;
  const cut = cutPolygon(piece, S);
  const path = (arr, close = true) => 'M' + arr.map(p => (p.x * U).toFixed(2) + ',' + (p.y * U).toFixed(2)).join('L') + (close ? 'Z' : '');
  let g = '';
  g += `<path class="pc-fill ${piece.kind}" d="${path(cut)}"/>`;
  if (piece.hatch) g += `<path d="${path(pts)}" fill="url(#hatch)" stroke="none"/>`;
  g += `<path class="cut" d="${path(cut)}"/>`;
  // stitch line: skip fold edges (drawn separately) and edges with no allowance (they coincide with the cut line)
  const runs = edgeRuns(pts, piece.tags);
  for (const [tag, list] of Object.entries(runs)) {
    const kind = segKind(piece, tag);
    const sa = segSA(piece, tag, S);
    for (const r of list) {
      if (kind === 'fold') g += `<path class="foldedge" d="${path(r.pts, false)}"/>`;
      else if (sa > 0.001) g += `<path class="stitch" d="${path(r.pts, false)}"/>`;
    }
  }
  // fold bracket for cut-on-fold edges
  for (const [tag, list] of Object.entries(runs)) {
    if (segKind(piece, tag) !== 'fold') continue;
    for (const r of list) g += foldBracket(r.pts, pts);
  }
  // SA labels on edges that differ from the general allowance
  if (S.useSA && S.showSaLabels !== false) {
    const done = new Set();
    for (const [tag, list] of Object.entries(runs)) {
      const sa = segSA(piece, tag, S);
      const kind = segKind(piece, tag);
      if (kind === 'fold' || kind === 'none') continue;
      if (Math.abs(sa - S.sa) < 1e-6 && kind !== 'hem') continue;
      const r = list.reduce((a, b) => G.plen(b.pts) > G.plen(a.pts) ? b : a);
      if (G.plen(r.pts) < 1.2) continue;
      const mid = G.pointAt(r.pts, G.plen(r.pts) / 2);
      const inward = inwardNormal(mid.p, mid.t, pts);
      const q = G.add(mid.p, G.mul(inward, 0.35));
      let ang = Math.atan2(mid.t.y, mid.t.x) * 180 / Math.PI;
      if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
      const txt = (kind === 'hem' ? 'hem ' : '') + fmt(sa) + ' cm';
      if (done.has(txt + Math.round(q.x) + Math.round(q.y))) continue; done.add(txt + Math.round(q.x) + Math.round(q.y));
      g += `<text class="sa-t" font-size="2.3" text-anchor="middle" transform="translate(${(q.x * U).toFixed(1)},${(q.y * U).toFixed(1)}) rotate(${ang.toFixed(1)})" dy="0.8">${esc(txt)}</text>`;
    }
  }
  // marks
  for (const mk of piece.marks) g += markSVG(mk, piece, S);
  // grain
  if (piece.grain) g += grainSVG(piece.grain, piece.cut && piece.cut.bias);
  if (piece.stretch) g += stretchSVG(piece.stretch);
  // label block
  g += labelSVG(piece, S, info);
  return { svg: g, bbox: G.bbox(cut), cut };
}
function inwardNormal(p, t, poly) {
  const n1 = G.P(-t.y, t.x);
  const test = G.add(p, G.mul(n1, 0.2));
  return G.pointInPoly(test, poly) ? n1 : G.mul(n1, -1);
}
function foldBracket(run, poly) {
  // bracket with arrows inside the piece, parallel to the fold edge
  const L = G.plen(run);
  if (L < 1) return '';
  const a = G.pointAt(run, L * 0.2), b = G.pointAt(run, L * 0.8), mid = G.pointAt(run, L * 0.5);
  const inn = inwardNormal(mid.p, mid.t, poly);
  const off = Math.min(0.9, Math.max(0.45, L * 0.06));
  const a2 = G.add(a.p, G.mul(inn, off)), b2 = G.add(b.p, G.mul(inn, off));
  const pa = (p) => (p.x * U).toFixed(1) + ',' + (p.y * U).toFixed(1);
  const ah = (tip, dirN) => { const l = G.add(tip, G.mul(dirN, 0.35)); return `<path class="grainhead" d="M${pa(tip)}L${pa(G.add(l, G.mul(G.perp(dirN), 0.15)))}L${pa(G.sub(l, G.mul(G.perp(dirN), 0.15)))}Z"/>`; };
  let s = `<path class="foldline" style="stroke-dasharray:none" d="M${pa(a.p)}L${pa(a2)}L${pa(b2)}L${pa(b.p)}"/>`;
  s += ah(a.p, inn) + ah(b.p, inn);
  const tp = G.add(mid.p, G.mul(inn, off + 0.45));
  let ang = Math.atan2(mid.t.y, mid.t.x) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
  s += `<text class="tb" font-size="2.4" text-anchor="middle" transform="translate(${(tp.x * U).toFixed(1)},${(tp.y * U).toFixed(1)}) rotate(${ang.toFixed(1)})" dy="0.9">PLACE ON FOLD</text>`;
  return s;
}
function grainSVG(g, bias) {
  const a = G.P(g.a.x * U, g.a.y * U), b = G.P(g.b.x * U, g.b.y * U);
  const d = G.norm(G.sub(b, a)), n = G.perp(d);
  const head = (tip, dir) => { const l = G.sub(tip, G.mul(dir, 3)); return `<path class="grainhead" d="M${tip.x.toFixed(1)},${tip.y.toFixed(1)}L${(l.x + n.x * 1.1).toFixed(1)},${(l.y + n.y * 1.1).toFixed(1)}L${(l.x - n.x * 1.1).toFixed(1)},${(l.y - n.y * 1.1).toFixed(1)}Z"/>`; };
  let s = `<path class="grain" d="M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}"/>` + head(b, d) + head(a, G.mul(d, -1));
  const mid = G.lerp(a, b, 0.5);
  let ang = Math.atan2(d.y, d.x) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
  s += `<text class="ts" font-size="2" text-anchor="middle" transform="translate(${(mid.x + n.x * 1.6).toFixed(1)},${(mid.y + n.y * 1.6).toFixed(1)}) rotate(${ang.toFixed(1)})">${bias ? 'BIAS GRAIN' : 'GRAIN'}</text>`;
  return s;
}
function stretchSVG(g) {
  const a = G.P(g.a.x * U, g.a.y * U), b = G.P(g.b.x * U, g.b.y * U);
  const mid = G.lerp(a, b, 0.5);
  return `<path class="stretch" d="M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}"/><text class="ts" font-size="2" text-anchor="middle" x="${mid.x.toFixed(1)}" y="${(mid.y - 1.2).toFixed(1)}">↔ greatest stretch</text>`;
}
function markSVG(mk, piece, S) {
  const pa = (p) => (p.x * U).toFixed(1) + ',' + (p.y * U).toFixed(1);
  const pl = (arr) => 'M' + arr.map(pa).join('L');
  const lbl = (p, text, cls = 'ts', size = 2.1, dx = 0, dy = 0) => text ? `<text class="${cls}" font-size="${size}" x="${(p.x * U + dx).toFixed(1)}" y="${(p.y * U + dy).toFixed(1)}">${esc(text)}</text>` : '';
  switch (mk.type) {
    case 'notch': {
      // small tick crossing the stitch line, perpendicular to the nearest edge
      const near = nearestOnPoly(mk.p, piece.pts);
      const n = G.perp(near.t);
      const sa = segSA(piece, piece.tags[near.i], S);
      const out = inwardNormal(near.p, near.t, piece.pts);
      const a = G.add(near.p, G.mul(out, 0.18)), b = G.sub(near.p, G.mul(out, sa + 0.06));
      let s = `<path class="notch" d="M${pa(a)}L${pa(b)}"/>`;
      if (mk.n === 2) {
        const sh = G.mul(near.t, 0.18);
        s = `<path class="notch" d="M${pa(G.add(a, sh))}L${pa(G.add(b, sh))}M${pa(G.sub(a, sh))}L${pa(G.sub(b, sh))}"/>`;
      }
      return s + (mk.label ? lbl(G.add(near.p, G.mul(out, 0.5)), mk.label, 'ts', 1.8) : '');
    }
    case 'dart': {
      const pts = mk.closed ? mk.pts.concat([mk.pts[0]]) : mk.pts;
      return `<path class="dartfill" d="${pl(pts)}Z"/><path class="dart" d="${pl(pts)}"/>` + lbl(mk.pts[1], mk.label, 'ts', 1.8, 1, -1);
    }
    case 'fold': return `<path class="foldline" d="${pl([mk.a, mk.b])}"/>` + lbl(G.lerp(mk.a, mk.b, 0.5), mk.label, 'tb', 1.9, 0, -0.8);
    case 'centre': return `<path class="centre" d="${pl([mk.a, mk.b])}"/>` + lbl(G.lerp(mk.a, mk.b, 0.15), mk.label, 'ts', 1.9, 0.8, 0);
    case 'line': return `<path class="${mk.cls || 'place'}" d="${pl(mk.pts)}"/>` + (mk.label ? lbl(mk.pts[0], mk.label, 'ts', 1.8, 0.6, -0.6) : '');
    case 'place': return `<path class="place" d="${pl(mk.pts)}Z"/>` + lbl(G.centroid(mk.pts), mk.label, 'ts', 1.8, -6, 0);
    case 'topstitch': return `<path class="topstitch" d="${pl(mk.pts)}"/>`;
    case 'gather': {
      const pts = mk.pts; if (pts.length < 2) return '';
      // zig-zag line offset inside the piece
      const L = G.plen(pts); const n = Math.max(4, Math.round(L / 0.35));
      let d = '';
      for (let i = 0; i <= n; i++) {
        const q = G.pointAt(pts, L * i / n);
        const inn = inwardNormal(q.p, q.t, piece.pts);
        const off = (mk.offset !== undefined ? Math.abs(mk.offset) : 0.35) + (i % 2 ? 0.15 : 0);
        const p = G.add(q.p, G.mul(inn, off));
        d += (i ? 'L' : 'M') + pa(p);
      }
      const mid = G.pointAt(pts, L / 2); const inn = inwardNormal(mid.p, mid.t, piece.pts);
      return `<path class="gather" style="${mk.light ? 'opacity:.55' : ''}" d="${d}"/>` + lbl(G.add(mid.p, G.mul(inn, 1.05)), mk.label, 'ts', 1.8, -4, 0);
    }
    case 'pleat': {
      // fold line + placement line with an arrow showing direction
      const w = mk.w || 0.4;
      const dir = G.norm(G.sub(mk.b, mk.a));
      const side = G.perp(dir);
      const s2 = mk.dir === -1 ? -1 : 1;
      const a2 = G.add(mk.a, G.mul(side, w * s2)), b2 = G.add(mk.b, G.mul(side, w * s2));
      const mid = G.lerp(mk.a, mk.b, 0.25), mid2 = G.lerp(a2, b2, 0.25);
      const hd = G.norm(G.sub(mid2, mid));
      const tip = mid2; const base = G.sub(tip, G.mul(hd, 0.35));
      return `<path class="foldline" d="${pl([mk.a, mk.b])}"/><path class="pleat" d="${pl([a2, b2])}"/><path class="pleat" style="stroke-dasharray:none" d="${pl([mid, base])}"/><path class="pleatarrow" d="M${pa(tip)}L${pa(G.add(base, G.mul(G.perp(hd), 0.14)))}L${pa(G.sub(base, G.mul(G.perp(hd), 0.14)))}Z"/>` + (mk.label ? lbl(mk.b, mk.label, 'ts', 1.7, 0.6, 2.4) : '');
    }
    case 'dot': {
      const c = mk.p;
      const cls = { snap: 'snapball', 'snap-ball': 'snapball', 'snap-socket': 'snapsock', button: 'button', eyelet: 'eyelet', velcro: 'place' }[mk.kind] || 'dot';
      const r = mk.kind === 'button' ? 0.18 : mk.kind === 'eyelet' ? 0.12 : 0.14;
      let s = `<circle class="${cls}" cx="${(c.x * U).toFixed(1)}" cy="${(c.y * U).toFixed(1)}" r="${(r * U).toFixed(2)}"/>`;
      if (mk.kind === 'button') s += `<circle class="dot" cx="${(c.x * U - 0.5).toFixed(1)}" cy="${(c.y * U).toFixed(1)}" r="0.28"/><circle class="dot" cx="${(c.x * U + 0.5).toFixed(1)}" cy="${(c.y * U).toFixed(1)}" r="0.28"/>`;
      return s + lbl(c, mk.label, 'ts', 1.7, 2.3, 0.7);
    }
    case 'velcro': return `<path class="place" style="stroke:${PALETTE.sage}" d="${pl(mk.pts)}Z"/>` + lbl(G.centroid(mk.pts), mk.label || 'hook & loop', 'ts', 1.7, -4, 0.6);
    case 'buttonhole': {
      const c = mk.p, h = (mk.len || 0.4) / 2;
      const a = mk.vertical ? G.P(c.x, c.y - h) : G.P(c.x - h, c.y), b = mk.vertical ? G.P(c.x, c.y + h) : G.P(c.x + h, c.y);
      return `<path class="bhole" d="${pl([a, b])}"/>`;
    }
    case 'cutout': return `<path class="cutout" d="${pl(mk.pts)}Z"/>` + lbl(G.centroid(mk.pts), mk.label, 'ts', 1.8, -5, 0);
    case 'cut': return `<path class="dart" d="${pl([mk.a, mk.b])}"/>` + lbl(mk.b, mk.label, 'ts', 1.8, 0.6, 0);
    case 'text': return lbl(mk.p, mk.text, mk.small ? 'ts' : 't', mk.small ? 1.9 : 2.4, -3, 0);
    default: return '';
  }
}
function nearestOnPoly(p, poly) {
  let best = { d: Infinity };
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ab = G.sub(b, a), l2 = G.dot(ab, ab) || 1e-9;
    let t = G.dot(G.sub(p, a), ab) / l2; t = Math.max(0, Math.min(1, t));
    const q = G.add(a, G.mul(ab, t));
    const d = G.dist(p, q);
    if (d < best.d) best = { d, p: q, t: G.norm(ab), i };
  }
  return best;
}
function cutLine(piece) {
  const c = piece.cut || {};
  const parts = [];
  const fab = c.fabric || 0;
  if (fab) parts.push('Cut ' + fab + (c.fold ? ' on fold' : '') + (c.mirrored && fab % 2 === 0 ? ' (mirrored pair' + (fab > 2 ? 's' : '') + ')' : ''));
  if (c.lining) parts.push('Lining ' + c.lining + (c.fold ? ' on fold' : ''));
  if (c.interfacing) parts.push('Interfacing ' + c.interfacing);
  if (c.contrast) parts.push('Contrast ' + c.contrast);
  if (c.stiffener) parts.push('Stiffener ' + c.stiffener);
  return parts;
}
function labelSVG(piece, S, info) {
  const b = G.bbox(piece.pts);
  const lines = [];
  lines.push(['tb', 2.2, (S.brand || 'DOLLHEIMR').toUpperCase()]);
  if (info && info.title) lines.push(['ts', 2.1, info.title]);
  lines.push(['tl', 3.6, (piece.code ? piece.code + ' · ' : '') + piece.name.toUpperCase()]);
  cutLine(piece).forEach(t => lines.push(['t', 2.2, t]));
  if (piece.cut && piece.cut.note) lines.push(['ts', 2, piece.cut.note]);
  if (S.useSA) lines.push(['ts', 2, 'SA ' + fmt(S.sa) + ' cm' + (piece.tags.some(t => segKind(piece, t) === 'hem') ? ' · hem ' + fmt(S.hemSa) + ' cm' : '')]);
  else lines.push(['ts', 2, 'No seam allowance included']);
  // obstacles: marks + grain line
  const obs = [];
  const addPts = (arr) => arr.forEach(p => obs.push(p));
  piece.marks.forEach(mk => {
    if (mk.p) obs.push(mk.p);
    if (mk.pts) addPts(G.resample(mk.pts.length > 1 ? mk.pts : [mk.pts[0], mk.pts[0]], 8));
    if (mk.a && mk.b) addPts(G.resample([mk.a, mk.b], 8));
  });
  if (piece.grain) addPts(G.resample([piece.grain.a, piece.grain.b], 10));
  // pick the most open spot inside the piece
  let best = null;
  const N = 14;
  for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) {
    const p = G.P(b.x0 + b.w * i / N, b.y0 + b.h * j / N);
    if (!G.pointInPoly(p, piece.pts)) continue;
    const de = nearestOnPoly(p, piece.pts).d;
    let dob = Infinity; for (const q of obs) { const d = G.dist(p, q); if (d < dob) dob = d; }
    const score = Math.min(de, dob * 1.3) + Math.min(de, 3) * 0.05;
    if (!best || score > best.score) best = { p, score };
  }
  let at = piece.labelAt || (best ? best.p : G.centroid(piece.pts));
  // orientation and size: fit the widest line into the chord through the label point
  const chord = (p, vertical) => {
    const hits = [];
    const pts = piece.pts;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], c = pts[(i + 1) % pts.length];
      if (vertical) { if ((a.x - p.x) * (c.x - p.x) <= 0 && a.x !== c.x) hits.push(a.y + (c.y - a.y) * (p.x - a.x) / (c.x - a.x)); }
      else if ((a.y - p.y) * (c.y - p.y) <= 0 && a.y !== c.y) hits.push(a.x + (c.x - a.x) * (p.y - a.y) / (c.y - a.y));
    }
    const v = vertical ? p.y : p.x;
    const lo = Math.max(...hits.filter(h => h <= v).concat([-Infinity])), hi = Math.min(...hits.filter(h => h >= v).concat([Infinity]));
    return { len: (hi - lo), mid: (hi + lo) / 2 };
  };
  const widest = Math.max(...lines.map(l => l[2].length * l[1] * 0.53));
  const totalH = lines.reduce((s, l) => s + l[1] * 1.25, 0);
  const cH = chord(at, false), cV = chord(at, true);
  const kFor = (rot) => Math.min(1.25, (rot ? cV.len : cH.len) * U * 0.88 / widest, (rot ? cH.len : cV.len) * U * 0.9 / totalH);
  const kHor = kFor(false), kVer = kFor(true);
  const rotate = kHor < 0.8 && kVer > kHor * 1.15;
  let k = rotate ? kVer : kHor;
  k = Math.max(0.42, k);
  if (rotate) at = G.P(at.x, cV.mid); else at = G.P(cH.mid, at.y);
  let y = -totalH * k / 2;
  let s = `<g transform="translate(${(at.x * U).toFixed(1)},${(at.y * U).toFixed(1)})${rotate ? ' rotate(-90)' : ''}">`;
  for (const [cls, size, text] of lines) {
    y += size * k * 1.25;
    s += `<text class="${cls}" font-size="${(size * k).toFixed(2)}" text-anchor="middle" x="0" y="${y.toFixed(1)}">${esc(text)}</text>`;
  }
  return s + '</g>';
}

// ---------- page layout ----------
const PAPER = { A4: { w: 210, h: 297 }, Letter: { w: 215.9, h: 279.4 } };
function layoutPages(pieces, S, info) {
  const paper = PAPER[S.paper] || PAPER.A4;
  const M = 8, footer = 14;
  const W = paper.w - 2 * M, H = paper.h - 2 * M - footer;
  const gap = 4;
  // render each piece once to know its size
  const items = pieces.map((pc, i) => {
    const r = pieceSVG(pc, S, info);
    return { pc, r, w: r.bbox.w * U + 2, h: r.bbox.h * U + 2, idx: i, rot: false };
  });
  // test square item
  items.push({ test: true, w: 58, h: 64 });
  const pages = [];
  const newPage = () => { const p = { items: [], shelves: [] }; pages.push(p); return p; };
  const fits = (it) => it.w <= W && it.h <= H;
  // rotate pieces that only fit sideways
  for (const it of items) if (!it.test && !fits(it) && it.h <= W && it.w <= H) { it.rot = true; const t = it.w; it.w = it.h; it.h = t; }
  // big rectangles are printed as a dimensioned diagram instead of tiling pages
  for (const it of items) {
    if (it.test || !it.pc.isRect) continue;
    const R0 = it.pc.isRect;
    const thin = Math.max(R0.w, R0.h) > 12 && Math.max(R0.w, R0.h) / Math.max(0.1, Math.min(R0.w, R0.h)) > 3.5;
    if (fits(it) && !thin) continue;
    if (it.rot) { const t = it.w; it.w = it.h; it.h = t; it.rot = false; }
    const k = Math.min((W - 4) / it.w, (H * 0.45) / it.h, 1);
    it.diagram = k; it.w = Math.max(it.w * k + 2, 66); it.h = it.h * k + 20;
  }
  const big = items.filter(it => !fits(it));
  const small = items.filter(it => fits(it)).sort((a, b) => b.h - a.h);
  const tryPlace = (p, it) => {
    for (let si = 0; si < p.shelves.length; si++) {
      const sh = p.shelves[si];
      const last = si === p.shelves.length - 1;
      if (sh.x + it.w <= W && (it.h <= sh.h || (last && sh.y + it.h <= H))) {
        p.items.push({ it, x: sh.x, y: sh.y }); sh.x += it.w + gap; if (last) sh.h = Math.max(sh.h, it.h); return true;
      }
    }
    const ny = p.shelves.length ? p.shelves[p.shelves.length - 1].y + p.shelves[p.shelves.length - 1].h + gap : 0;
    if (ny + it.h <= H && it.w <= W) { p.shelves.push({ y: ny, h: it.h, x: it.w + gap }); p.items.push({ it, x: 0, y: ny }); return true; }
    return false;
  };
  // oversized pieces: tile across several pages (done first so the leftover space on the last row
  // of tiles can take small pieces instead of wasting paper)
  for (const it of big) {
    const cols = Math.ceil(it.w / (W - 10)), rows = Math.ceil(it.h / (H - 10));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = newPage();
      p.tile = { it, c, r, cols, rows, ox: c * (W - 10), oy: r * (H - 10) };
      const rem = it.h - r * (H - 10);
      if (r === rows - 1 && rem < H * 0.7 && S.packPages !== false) p.shelves = [{ y: rem + 8, h: 0, x: 0 }];
      else p.shelves = [{ y: H + 1, h: 0, x: W + 1 }];
    }
  }
  if (S.packPages !== false) {
    for (const it of small) {
      let ok = false;
      for (const p of pages) if (tryPlace(p, it)) { ok = true; break; }
      if (!ok) tryPlace(newPage(), it);
    }
  } else {
    const t = small.find(i => i.test);
    for (const it of small) { if (it.test) continue; tryPlace(newPage(), it); }
    if (t) { let ok = false; for (const p of pages) if (tryPlace(p, t)) { ok = true; break; } if (!ok) tryPlace(newPage(), t); }
  }
  return { pages, paper, M, W, H, footer, items };
}
function renderPageSVG(layout, pageIdx, S, info, forExport) {
  const { pages, paper, M, W, H, footer } = layout;
  const p = pages[pageIdx];
  const N = pages.length;
  let body = '';
  const place = (it, x, y) => {
    if (it.test) return testSquareSVG(x, y);
    const b = it.r.bbox;
    if (it.diagram) {
      const k = it.diagram, R = it.pc.isRect;
      const cutW = b.w, cutH = b.h;   // from the actual cut outline (edges without allowance stay exact)
      return `<g transform="translate(${(x - b.x0 * U * k + 1).toFixed(1)},${(y - b.y0 * U * k + 1).toFixed(1)}) scale(${k.toFixed(4)})">${it.r.svg}</g>` +
        `<text class="tb" font-size="2.8" x="${(x + 1).toFixed(1)}" y="${(y + b.h * U * k + 5.5).toFixed(1)}">NOT TO SCALE — cut a rectangle</text>` +
        `<text class="t" font-size="2.8" x="${(x + 1).toFixed(1)}" y="${(y + b.h * U * k + 9.5).toFixed(1)}">${fmt(cutW)} × ${fmt(cutH)} cm (seam allowance included)</text>` +
        `<text class="ts" font-size="2.3" x="${(x + 1).toFixed(1)}" y="${(y + b.h * U * k + 13.5).toFixed(1)}">finished ${fmt(R.w)} × ${fmt(R.h)} cm · ${esc(cutLine(it.pc).join(' · '))}</text>`;
    }
    // translate piece so its bbox sits at (x,y)
    if (it.rot) {
      // rotate 90° clockwise around origin, then shift
      const tx = x + (b.y1 * U) + 1, ty = y - b.x0 * U + 1;
      return `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) rotate(90)">${it.r.svg}</g>`;
    }
    return `<g transform="translate(${(x - b.x0 * U + 1).toFixed(1)},${(y - b.y0 * U + 1).toFixed(1)})">${it.r.svg}</g>`;
  };
  if (p.tile) {
    const t = p.tile;
    const clipId = 'clip' + pageIdx;
    const clipH = p.items.length ? Math.min(H, t.it.h - t.oy + 2) : H;
    body += `<defs><clipPath id="${clipId}"><rect x="0" y="0" width="${W}" height="${clipH.toFixed(1)}"/></clipPath></defs>`;
    body += `<g clip-path="url(#${clipId})">${place(t.it, -t.ox, -t.oy)}</g>`;
    // overlap guides: 10 mm overlap zone marks
    body += `<rect class="tilemark" x="0" y="0" width="${W}" height="${H}" style="stroke-dasharray:2 2"/>`;
    const lbl = String.fromCharCode(65 + t.r) + (t.c + 1);
    body += `<text class="tb" font-size="5" x="${W - 2}" y="7" text-anchor="end">${lbl}</text>`;
    if (t.c > 0) body += `<path class="tilemark" d="M10,0V${H}"/><text class="ts" font-size="2.2" x="11" y="${H / 2}">overlap with ${String.fromCharCode(65 + t.r)}${t.c}</text>`;
    if (t.r > 0) body += `<path class="tilemark" d="M0,10H${W}"/><text class="ts" font-size="2.2" x="${W / 2}" y="9">overlap with ${String.fromCharCode(64 + t.r)}${t.c + 1}</text>`;
    for (const e of p.items) body += place(e.it, e.x, e.y);
  } else {
    for (const e of p.items) body += place(e.it, e.x, e.y);
  }
  const foot = footerSVG(W, H, footer, pageIdx, N, info, p.tile);
  const content = `<g transform="translate(${M},${M})">${body}${foot}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${paper.w}mm" height="${paper.h}mm" viewBox="0 0 ${paper.w} ${paper.h}">${svgStyleBlock()}${hatchDefs()}<rect x="0" y="0" width="${paper.w}" height="${paper.h}" fill="#fff"/>${content}</svg>`;
}
function hatchDefs() {
  return `<defs><pattern id="hatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0V2" stroke="${PALETTE.line}" stroke-width="0.5"/></pattern></defs>`;
}
function testSquareSVG(x, y) {
  const s = 50;
  return `<g transform="translate(${x + 4},${y + 4})"><rect class="testsq" x="0" y="0" width="${s}" height="${s}"/>` +
    `<path class="ruler" d="M0,${s / 2}H${s}M${s / 2},0V${s}"/>` +
    `<text class="tl" font-size="3.4" x="${s / 2}" y="${s + 5}" text-anchor="middle">5 × 5 cm test square</text>` +
    `<text class="ts" font-size="2.2" x="${s / 2}" y="${s + 8.5}" text-anchor="middle">Print at 100% / "actual size", then measure</text></g>`;
}
function footerSVG(W, H, footer, i, N, info, tile) {
  const y = H + 4;
  // 10 cm ruler with mm ticks
  let r = `<g transform="translate(0,${y})"><path class="ruler" d="M0,0H100"/>`;
  for (let mm = 0; mm <= 100; mm++) {
    const h = mm % 10 === 0 ? 3 : mm % 5 === 0 ? 2 : 1;
    r += `<path class="ruler" d="M${mm},0V${h}"/>`;
    if (mm % 10 === 0) r += `<text class="ts" font-size="2" x="${mm}" y="6" text-anchor="middle">${mm / 10}</text>`;
  }
  r += `<text class="ts" font-size="2" x="104" y="2.5">cm — scale check</text></g>`;
  const title = `<text class="t" font-size="2.6" x="${W}" y="${y + 3}" text-anchor="end">${esc((info && info.title) || '')}</text>` +
    `<text class="ts" font-size="2.3" x="${W}" y="${y + 7}" text-anchor="end">page ${i + 1} of ${N}${tile ? ' · tiled piece' : ''}</text>`;
  return r + title;
}
