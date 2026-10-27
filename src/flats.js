// ===================== TECHNICAL FLATS =====================
// Simple line drawings of the finished accessory, built from the same numbers as the pattern.
function flatSVG(views) {
  const P2 = (p) => p.x.toFixed(3) + ',' + p.y.toFixed(3);
  const bb = (list) => {
    const pts = [];
    list.forEach(e => { if (e.pts) e.pts.forEach(p => pts.push(p)); if (e.c) { pts.push(G.P(e.c.x - e.r, e.c.y - e.r)); pts.push(G.P(e.c.x + e.r, e.c.y + e.r)); } });
    return pts.length ? G.bbox(pts) : { x0: 0, y0: 0, w: 1, h: 1, x1: 1, y1: 1 };
  };
  const boxes = views.map(v => bb(v.items));
  const H = Math.max(...boxes.map(b => b.h)) || 1;
  const k = 190 / H, pad = 16;
  let x = pad;
  let body = '';
  views.forEach((v, i) => {
    const b = boxes[i];
    const tx = x - b.x0 * k, ty = 24 - b.y0 * k + (H - b.h) * k / 2;
    body += `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${k.toFixed(3)})">`;
    v.items.forEach(e => {
      if (e.pts) body += `<path d="M${e.pts.map(P2).join('L')}${e.close ? 'Z' : ''}" class="${e.cls || 'flat'}" ${e.fill ? 'style="fill:' + e.fill + '"' : ''} vector-effect="non-scaling-stroke"/>`;
      if (e.c) body += `<circle cx="${e.c.x.toFixed(2)}" cy="${e.c.y.toFixed(2)}" r="${e.r}" class="${e.cls || 'flat'}" vector-effect="non-scaling-stroke"/>`;
    });
    body += '</g>';
    body += `<text class="tb" font-size="9" x="${(x + b.w * k / 2).toFixed(0)}" y="13" text-anchor="middle">${esc(v.label)}</text>`;
    x += b.w * k + pad;
  });
  const W = Math.max(x, 120);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(0)} ${(H * k + 48).toFixed(0)}" class="flats">${svgStyleBlock()}<rect x="0" y="0" width="${W.toFixed(0)}" height="${(H * k + 48).toFixed(0)}" fill="#fff"/>${body}</svg>`;
}
const fl = (pts, cls, close) => ({ pts, cls: cls || 'flat', close: close !== false });
const ln = (pts, cls) => ({ pts, cls: cls || 'flatl', close: false });
const dashed = (pts) => ({ pts, cls: 'flatd', close: false });
function runsToPts(runs) { const out = []; runs.forEach(r => r.pts.forEach(p => { if (!out.length || G.dist(out[out.length - 1], p) > 1e-6) out.push(p); })); return out; }
function offsetIn(pts, d) {
  // crude inset for topstitching lines: move points toward the centroid
  const c = G.centroid(pts);
  return pts.map(p => { const v = G.sub(c, p), l = G.len(v) || 1; return G.add(p, G.mul(v, Math.min(d / l, 0.4))); });
}
function drawFlats(out) {
  const F = out.flat || {};
  const o = out.o;
  try {
    if (F.kind === 'bag') return flatSVG(bagFlat(out, F));
    if (F.kind === 'hat') return flatSVG(hatFlat(out, F));
    if (F.kind === 'shoe') return flatSVG(shoeFlat(out, F));
    if (F.kind === 'belt' || F.kind === 'styling' && o.item !== 'sash') return flatSVG(bodyFlat(out, F));
    if (F.kind === 'neck' || F.kind === 'hair' || F.kind === 'styling') return flatSVG(smallFlat(out, F));
    if (F.kind === 'collar') return flatSVG(collarFlat(out, F));
    if (F.kind === 'apron') return flatSVG(apronFlat(out, F));
    if (F.kind === 'leg') return flatSVG(legFlat(out, F));
  } catch (e) { if (typeof console !== 'undefined') console.error(e); }
  return '';
}
// ---------- bags
function bagFlat(out, F) {
  const o = out.o, p = out.plan;
  const { W, H, D } = F;
  const front = [], side = [];
  let outline;
  if (F.frame) {
    const { fw, fh } = F.frame; const cx = W / 2;
    outline = G.spline([G.P(cx - fw / 2, fh), G.P(0, fh + (H - fh) * 0.35), G.P(0, H * 0.8), G.P(W * 0.12, H), G.P(W * 0.88, H), G.P(W, H * 0.8), G.P(W, fh + (H - fh) * 0.35), G.P(cx + fw / 2, fh)], 6);
    front.push(fl(outline));
    const arch = []; for (let i = 0; i <= 20; i++) { const u = i / 20; arch.push(G.P(cx - fw / 2 + fw * u, fh * (1 - Math.sin(Math.PI * u)) * 0.85)); }
    front.push(fl(arch.concat([G.P(cx + fw / 2, fh), G.P(cx - fw / 2, fh)]), 'flat', true));
    front.push({ c: G.P(cx - 0.25, -0.15), r: Math.max(0.12, fw * 0.03), cls: 'flat' }, { c: G.P(cx + 0.25, -0.15), r: Math.max(0.12, fw * 0.03), cls: 'flat' });
  } else {
    const opt = {};
    if (F.shape === 'trapezoid') opt.taper = F.taper;
    if (F.shape === 'rounded') opt.rb = F.rCorner;
    if (F.shape === 'rounded all') { opt.rb = F.rCorner; opt.rt = F.rCorner; }
    if (F.shape === 'crescent') { opt.topCurve = H * 0.16; opt.rb = Math.min(W, H) * 0.35; opt.taper = W * 0.04; }
    if (F.shape === 'dome') opt.topCurve = -H * 0.22;
    if (F.shape === 'half-moon') opt.bottomCurve = true;
    let hh = F.shape === 'dome' ? H * 0.82 : H;
    if (o.bodyCon === 'round' || o.bodyCon === 'barrel' || o.bodyCon === 'boxed' || o.bodyCon === 'sides') { opt.rb = o.bodyCon === 'barrel' ? 0 : opt.rb; }
    let runs = panelRuns(o.bodyCon === 'barrel' ? W : W, hh, o.bodyCon === 'barrel' ? { rb: Math.min(H, D) * 0.3, rt: Math.min(H, D) * 0.3 } : opt);
    if (F.shape === 'dome') runs = runs.map(r => ({ pts: r.pts.map(q => G.P(q.x, q.y + H * 0.18)), tag: r.tag }));
    outline = runsToPts(runs);
    front.push(fl(outline));
    if (o.construction !== 'raw' || true) front.push(dashed(offsetIn(outline, Math.max(0.12, W * 0.015)).concat([offsetIn(outline, Math.max(0.12, W * 0.015))[0]])));
  }
  const b = G.bbox(outline);
  const topY = b.y0;
  // gathers / pleats
  if (o.gather && o.gather !== 'none') { const n = o.gather === 'gathered' ? 9 : +o.gather[0]; for (let i = 1; i <= n; i++) { const x = b.x0 + b.w * i / (n + 1); front.push(ln([G.P(x, topY + 0.1), G.P(x + (i % 2 ? 0.15 : -0.15), topY + H * 0.28)])); } }
  // casing / eyelets
  if (F.casingH) { front.push(ln([G.P(b.x0, topY + F.casingH * 0.35), G.P(b.x1, topY + F.casingH * 0.35)], 'flatd'), ln([G.P(b.x0, topY + F.casingH), G.P(b.x1, topY + F.casingH)], 'flatd')); front.push(ln(G.spline([G.P(W * 0.45, topY + F.casingH * 0.6), G.P(W * 0.42, topY + H * 0.3), G.P(W * 0.38, topY + H * 0.45)], 6)), ln(G.spline([G.P(W * 0.55, topY + F.casingH * 0.6), G.P(W * 0.58, topY + H * 0.3), G.P(W * 0.62, topY + H * 0.45)], 6))); }
  if (p.eyelets) { const n = p.eyelets.n / 2; for (let i = 0; i < n; i++) front.push({ c: G.P(b.x0 + b.w * (i + 0.5) / n, topY + p.eyelets.y), r: Math.max(0.08, W * 0.015), cls: 'flat' }); front.push(ln(G.spline([G.P(W * 0.5, topY + p.eyelets.y), G.P(W * 0.47, topY - H * 0.12), G.P(W * 0.42, topY - H * 0.05)], 6))); }
  // zip along the top
  if (p.zipTop || p.zipPanel || p.barrel) { const zy = topY + (p.barrel ? 0 : 0.02); front.push(ln([G.P(b.x0 + b.w * 0.06, zy), G.P(b.x1 - b.w * 0.06, zy)], 'flatd')); front.push(fl([G.P(b.x1 - b.w * 0.12, zy), G.P(b.x1 - b.w * 0.1, zy + H * 0.12), G.P(b.x1 - b.w * 0.14, zy + H * 0.12)])); }
  // pockets
  (o.bagPockets || []).forEach(pk => {
    if (pk === 'front patch pocket') { const pw = W * 0.55, ph = H * 0.42, x0 = W / 2 - pw / 2, y0 = topY + (F.flap ? H * 0.5 : H * 0.38); front.push(fl([G.P(x0, y0), G.P(x0 + pw, y0), G.P(x0 + pw, Math.min(b.y1 - 0.2, y0 + ph)), G.P(x0, Math.min(b.y1 - 0.2, y0 + ph))])); }
    if (pk === 'front zip pocket') { const zl = W * 0.55, y0 = topY + (F.flap ? H * 0.55 : H * 0.3); front.push(ln([G.P(W / 2 - zl / 2, y0), G.P(W / 2 + zl / 2, y0)], 'flatd')); }
  });
  // flap
  if (F.flap) {
    const fwid = W, fl0 = F.flap.l - (o.bodyCon === 'flat' ? 0 : D);
    const r = Math.min(fwid, fl0) * 0.28;
    let fp;
    if (o.flap === 'envelope') { const pd = Math.min(fwid * 0.4, fl0 * 0.6); fp = [G.P(0, topY), G.P(fwid, topY), G.P(fwid, topY + fl0 - pd), G.P(fwid / 2, topY + fl0), G.P(0, topY + fl0 - pd)]; }
    else if (o.flap === 'curved') { fp = [G.P(0, topY)].concat(ellipsePts(fwid / 2, topY + Math.max(0, fl0 - fwid / 2 * 0.9), fwid / 2, fl0 - Math.max(0, fl0 - fwid / 2 * 0.9), 24, 0, Math.PI)).concat([G.P(fwid, topY)]).reverse(); }
    else fp = runsToPts(roundedRuns([G.P(0, topY), G.P(fwid, topY), G.P(fwid, topY + fl0), G.P(0, topY + fl0)], [{ tag: 'a' }, { tag: 'b' }, { tag: 'b' }, { tag: 'b' }], o.flap === 'rounded' ? [0, 0, r, r] : [0, 0, 0.1, 0.1]));
    front.push(Object.assign(fl(fp), { fill: '#fff' }));
    front.push(dashed(offsetIn(fp, Math.max(0.1, W * 0.012))));
    if (['magnet', 'snap', 'turnlock', 'loop', 'toggle'].includes(o.closure)) front.push({ c: G.P(W / 2, topY + fl0 - Math.min(1, fl0 * 0.18)), r: Math.max(0.12, W * 0.025), cls: 'flat' });
    if (o.closure === 'buckles') [0.27, 0.73].forEach(f => { const bw = strapForRing(p.buckles || 6); front.push(fl([G.P(W * f - bw / 2, topY + fl0 * 0.35), G.P(W * f + bw / 2, topY + fl0 * 0.35), G.P(W * f + bw / 2, topY + fl0 + bw * 1.2), G.P(W * f - bw / 2, topY + fl0 + bw * 1.2)])); front.push(fl([G.P(W * f - bw * 0.75, topY + fl0 + bw * 0.2), G.P(W * f + bw * 0.75, topY + fl0 + bw * 0.2), G.P(W * f + bw * 0.75, topY + fl0 + bw * 0.9), G.P(W * f - bw * 0.75, topY + fl0 + bw * 0.9)])); });
  } else if (['magnet', 'snap'].includes(o.closure)) front.push({ c: G.P(W / 2, topY + 0.3), r: Math.max(0.1, W * 0.02), cls: 'flatd' });
  if (o.closure === 'tab') { const tw = Math.max(0.8, W * 0.2), tl = Math.max(1.2, H * 0.38); front.push(Object.assign(fl(runsToPts(roundedRuns([G.P(W / 2 - tw / 2, topY), G.P(W / 2 + tw / 2, topY), G.P(W / 2 + tw / 2, topY + tl * 0.7), G.P(W / 2 - tw / 2, topY + tl * 0.7)], [{ tag: 'a' }, { tag: 'b' }, { tag: 'b' }, { tag: 'b' }], [0, 0, tw * 0.45, tw * 0.45]))), { fill: '#fff' })); }
  // handles / straps
  const st = p.strap;
  if (st) {
    const sw = st.sw, L = st.L;
    if (st.type === 'two' || st.type === 'top') {
      const s = st.type === 'two' ? Math.max(W * 0.38, sw * 3) : W * 0.5;
      const hgt = Math.max(0.3, (L - s) / 2 * 0.95);
      const arc = (x0, x1, up) => G.spline([G.P(x0, topY), G.P(x0 - (x1 - x0) * 0.1, topY - up * 0.7), G.P((x0 + x1) / 2, topY - up), G.P(x1 + (x1 - x0) * 0.1, topY - up * 0.7), G.P(x1, topY)], 8);
      const xc = W / 2;
      front.push(ln(arc(xc - s / 2 - sw / 2, xc + s / 2 + sw / 2, hgt + sw)), ln(arc(xc - s / 2 + sw / 2, xc + s / 2 - sw / 2, hgt)));
    } else if (['shoulder', 'crossbody', 'adjustable', 'chain', 'wrist'].includes(st.type)) {
      const up = Math.min(H * 1.4, L * 0.25);
      const cls = st.type === 'chain' ? 'flatd' : 'flatl';
      if (st.type === 'wrist') front.push(ln(G.spline([G.P(b.x0 + 0.1, topY + H * 0.2), G.P(b.x0 - W * 0.25, topY + H * 0.3), G.P(b.x0 - W * 0.32, topY + H * 0.7), G.P(b.x0 - W * 0.05, topY + H * 0.45)], 6)));
      else { front.push(ln([G.P(b.x0 + sw * 0.2, topY), G.P(b.x0 + W * 0.15, topY - up)], cls), ln([G.P(b.x1 - sw * 0.2, topY), G.P(b.x1 - W * 0.15, topY - up)], cls)); if (st.type === 'adjustable') front.push(fl([G.P(b.x1 - W * 0.08 - sw, topY - up * 0.55), G.P(b.x1 - W * 0.08 + sw, topY - up * 0.55), G.P(b.x1 - W * 0.06 + sw, topY - up * 0.55 - sw * 1.2), G.P(b.x1 - W * 0.06 - sw, topY - up * 0.55 - sw * 1.2)])); }
      if (st.ringMm) [b.x0, b.x1].forEach(x => front.push({ c: G.P(x + (x === b.x0 ? 0.1 : -0.1), topY - 0.15), r: Math.max(0.12, sw * 0.6), cls: 'flat' }));
    } else if (st.type === 'backpack') {
      const back = [];
      back.push(fl(outline));
      [0.3, 0.7].forEach(f => back.push(fl([G.P(W * f - sw / 2, topY + H * 0.08), G.P(W * f + sw / 2, topY + H * 0.08), G.P(W * (f < 0.5 ? 0.12 : 0.88) + sw / 2, b.y1 - H * 0.08), G.P(W * (f < 0.5 ? 0.12 : 0.88) - sw / 2, b.y1 - H * 0.08)])));
      back.push(ln(G.spline([G.P(W * 0.42, topY + 0.05), G.P(W * 0.5, topY - H * 0.15), G.P(W * 0.58, topY + 0.05)], 6)));
      side.push({ back });
    } else if (st.type === 'beltstrap') {
      front.push(fl([G.P(b.x0 - W * 0.5, topY + H * 0.35), G.P(b.x0, topY + H * 0.35), G.P(b.x0, topY + H * 0.35 + sw), G.P(b.x0 - W * 0.5, topY + H * 0.35 + sw)]), fl([G.P(b.x1, topY + H * 0.35), G.P(b.x1 + W * 0.5, topY + H * 0.35), G.P(b.x1 + W * 0.5, topY + H * 0.35 + sw), G.P(b.x1, topY + H * 0.35 + sw)]));
    }
  }
  const views = [{ label: 'FRONT', items: front }];
  if (D > 0.01) {
    const sd = [];
    if (o.bodyCon === 'barrel') { const er = runsToPts(panelRuns(D, H, { rb: Math.min(H, D) * 0.3, rt: Math.min(H, D) * 0.3 })); sd.push(fl(er), dashed(offsetIn(er, Math.max(0.1, D * 0.03)))); }
    else if (o.bodyCon === 'round') { const e = ellipsePts(0, H, W / 2, Math.max(0.1, W * 0.12), 40); sd.push(fl([G.P(-W / 2, 0), G.P(W / 2, 0), G.P(W / 2, H), G.P(-W / 2, H)]), ln(e.slice(0, 21)), ln(ellipsePts(0, 0, W / 2, Math.max(0.1, W * 0.12), 40))); }
    else { const t = F.taper || 0; const topD = o.bodyCon === 'boxed' ? D * 0.6 : D; sd.push(fl([G.P((D - topD) / 2, 0), G.P((D + topD) / 2, 0), G.P(D, H), G.P(0, H)])); sd.push(ln([G.P(D / 2, 0.1), G.P(D / 2, H * 0.12)], 'flatd')); }
    views.push({ label: o.bodyCon === 'round' ? 'BUCKET' : 'SIDE', items: sd });
  }
  if (side.length && side[0].back) views.push({ label: 'BACK', items: side[0].back });
  return views;
}
// ---------- hats (side view)
function hatFlat(out, F) {
  const o = out.o, p = out.plan;
  const band = p.band, r = band / (2 * Math.PI) * 1.05;   // half-width of the head seen from the side
  const items = [];
  const k = p.kind;
  const brimLines = (b, y) => {
    if (!b) return;
    const w = b.w, a = b.angle;
    if (a < -0.5) { const h = w * Math.sin(-a); items.push(fl([G.P(-r - 0.05, y), G.P(-r - w * Math.cos(-a), y - h), G.P(r + w * Math.cos(-a), y - h), G.P(r + 0.05, y)])); return; }
    const dx = w * Math.cos(a), dy = w * Math.sin(a);
    const thick = Math.max(0.08, w * 0.06);
    items.push(fl([G.P(-r, y), G.P(-r - dx, y + dy), G.P(-r - dx, y + dy + thick), G.P(r + dx, y + dy + thick), G.P(r + dx, y + dy), G.P(r, y)]));
    if (o.brimEdge === 'topstitched') for (let i = 1; i <= 3; i++) items.push(dashed([G.P(-r - dx * i / 4, y + dy * i / 4 + thick * 0.5), G.P(r + dx * i / 4, y + dy * i / 4 + thick * 0.5)]));
  };
  if (k === 'banded') {
    const h = p.crown.h, tw = r * (p.crown.top / band);
    items.push(fl([G.P(-r, 0), G.P(-tw, -h), G.P(tw, -h), G.P(r, 0)]));
    items.push(fl(ellipsePts(0, -h, tw, Math.max(0.1, tw * 0.12), 30)));
    if (p.cuff) items.push(fl([G.P(-r * 1.04, 0), G.P(-r * 1.04, -p.cuff), G.P(r * 1.04, -p.cuff), G.P(r * 1.04, 0)]));
    if (o.hatBand !== 'none' && o.hatBand) items.push(fl([G.P(-r * 0.99, -0.05), G.P(-r * 0.97, -Math.max(0.3, h * 0.18)), G.P(r * 0.97, -Math.max(0.3, h * 0.18)), G.P(r * 0.99, -0.05)]));
    if (o.hatBow) items.push(fl([G.P(r * 0.4, -h * 0.1), G.P(r * 0.95, -h * 0.25), G.P(r * 0.95, h * 0.02), G.P(r * 0.4, -h * 0.12)]));
    brimLines(p.brim, 0);
  } else if (k === 'gored' || k === 'beret' || k === 'trapper') {
    const gh = p.gores ? p.gores.gh : p.trapper ? p.trapper.hs + r * 0.2 : r * 0.9;
    const dome = []; const hh = Math.min(gh * 0.82, r * (p.gores && p.gores.shape === 'full' ? 1.15 : 1.05));
    const wide = p.gores && p.gores.shape === 'full' ? 1.12 : 1;
    for (let i = 0; i <= 30; i++) { const a = Math.PI * i / 30; dome.push(G.P(-r * wide * Math.cos(a), -hh * Math.sin(a))); }
    if (k === 'beret') { const D = p.beret.D; items.push(fl(ellipsePts(D * 0.08, -r * 0.35, D / 2, r * 0.42, 40))); items.push(fl([G.P(-r, 0), G.P(-r, -r * 0.12), G.P(r, -r * 0.12), G.P(r, 0)])); return [{ label: 'SIDE', items }]; }
    items.push(fl(dome.concat([G.P(r * wide, 0)])));
    if (p.gores) { items.push(ln([G.P(0, -hh), G.P(0, 0)], 'flatd')); items.push(ln(G.spline([G.P(0, -hh), G.P(r * 0.55, -hh * 0.75), G.P(r * 0.7, 0)], 6), 'flatd')); items.push(ln(G.spline([G.P(0, -hh), G.P(-r * 0.55, -hh * 0.75), G.P(-r * 0.7, 0)], 6), 'flatd')); }
    if (o.topButton && p.gores) items.push({ c: G.P(0, -hh - 0.12), r: 0.14, cls: 'flat' });
    if (p.headBand) items.push(fl([G.P(-r, 0), G.P(-r, -p.headBand * 0.8), G.P(r, -p.headBand * 0.8), G.P(r, 0)]));
    if (p.visor) items.push(fl(G.spline([G.P(r * 0.95, -0.05), G.P(r + p.visor.d * 0.7, 0.08), G.P(r + p.visor.d, 0.25), G.P(r * 0.9, 0.12)], 6)));
    if (p.brim) brimLines(p.brim, 0);
    if (p.trapper) { const t = p.trapper; items.push(fl(G.spline([G.P(-r * 0.25, 0), G.P(-r * 0.3, t.flapL * 0.7), G.P(-r * 0.05, t.flapL), G.P(r * 0.2, t.flapL * 0.7), G.P(r * 0.15, 0)], 6))); items.push(fl(o.frontFlap === 'up' ? [G.P(r * 0.95, 0), G.P(r * 1.05, -t.ffh), G.P(r * 0.8, -t.ffh), G.P(r * 0.7, 0)] : [G.P(r * 0.95, 0), G.P(r * 1.3, t.ffh * 0.6), G.P(r * 1.15, t.ffh * 0.9), G.P(r * 0.85, 0.1)])); }
  } else if (k === 'peaked') {
    const pk = p.peaked, tw = r * pk.topC / band;
    items.push(fl([G.P(-r, 0), G.P(-r, -pk.bh), G.P(r, -pk.bh), G.P(r, 0)]));
    items.push(fl([G.P(-r, -pk.bh), G.P(-tw, -pk.bh - pk.wallH), G.P(tw, -pk.bh - pk.wallH - pk.wallH * 0.3), G.P(r, -pk.bh)]));
    items.push(fl(G.spline([G.P(r * 0.95, -0.05), G.P(r + pk.vd * 0.7, 0.1), G.P(r + pk.vd, 0.3), G.P(r * 0.9, 0.12)], 6)));
    if (o.hatBand === 'cord') items.push(ln([G.P(-r, -pk.bh * 0.6), G.P(r, -pk.bh * 0.6)]));
  } else if (k === 'flatcap') {
    const c = p.flatcap;
    items.push(fl(G.spline([G.P(-r, 0), G.P(-r * 1.02, -r * 0.35), G.P(-r * 0.4, -r * 0.62), G.P(r * 0.6, -r * 0.5), G.P(r * 1.15, -r * 0.18), G.P(r * 1.05, -0.02)], 6).concat([G.P(-r, 0)])));
    items.push(fl(G.spline([G.P(r * 0.95, -0.05), G.P(r + c.vd * 0.7, 0.05), G.P(r + c.vd, 0.15), G.P(r * 0.9, 0.08)], 6)));
  } else if (k === 'witch') {
    const w = p.witch;
    if (o.tipBend) items.push(fl([G.P(-r, 0), G.P(-r * 0.22, -w.Hc * 0.72), G.P(-r * 0.95, -w.Hc * 0.84), G.P(r * 0.12, -w.Hc * 0.66), G.P(r, 0)]));
    else items.push(fl([G.P(-r, 0), G.P(0, -w.Hc), G.P(r, 0)]));
    brimLines(p.brim, 0);
  } else if (k === 'bonnet') {
    const b = p.bonnet;
    items.push(fl(G.spline([G.P(r * 0.9, r * 0.9), G.P(r * 1.05, -r * 0.5), G.P(r * 0.2, -r * 1.15), G.P(-r * 0.9, -r * 0.6), G.P(-r * 1.0, r * 0.35), G.P(-r * 0.4, r * 0.8)], 6)));
    items.push({ c: G.P(-r * 0.55, -r * 0.05), r: b.backD * 0.45, cls: 'flatd' });
    if (o.bonnetFrill) items.push(ln(G.spline([G.P(r * 0.95, r * 0.9), G.P(r * 1.15, -r * 0.5), G.P(r * 0.25, -r * 1.3)], 6), 'flatd'));
    if (o.ties) items.push(ln([G.P(r * 0.9, r * 0.9), G.P(r * 0.6, r * 1.7)]), ln([G.P(r * 0.9, r * 0.9), G.P(r * 1.1, r * 1.65)]));
  } else if (k === 'hood') {
    const pc = out.pieces.find(x => /Hood side|Balaclava side/.test(x.name));
    if (pc) { items.push(fl(pc.pts.map(q => G.P(-q.x, q.y)))); }
  }
  return [{ label: 'SIDE', items }];
}
// ---------- shoes
function shoeFlat(out, F) {
  const o = out.o, p = out.plan;
  const top = [fl(F.ring.map(q => G.P(q.x, -q.y)))];
  const side = [];
  const Ls = F.Ls, hB = p.upper ? p.upper.hB : out.m.ankleHeight * 0.7, hT = p.upper ? p.upper.hT : hB * 0.5;
  const soleT = Math.max(0.1, Ls * 0.03);
  side.push(fl([G.P(0, 0), G.P(Ls, 0), G.P(Ls, soleT), G.P(0, soleT)]));
  if (o.item === 'sandals') {
    side.push(ln([G.P(Ls * 0.78, 0), G.P(Ls * 0.72, -Ls * 0.14)]), fl(ellipsePts(Ls * 0.15, -out.m.ankleHeight * 0.95, Ls * 0.14, Ls * 0.03, 20)), ln([G.P(0.05, 0), G.P(Ls * 0.04, -out.m.ankleHeight * 0.95)]));
    if (o.sandalStyle === 'tbar') side.push(ln([G.P(Ls * 0.72, -Ls * 0.14), G.P(Ls * 0.28, -out.m.ankleHeight)]));
    top.push(ln([G.P(-F.Ws * 0.5, -Ls * 0.78), G.P(F.Ws * 0.55, -Ls * 0.78)], 'flat'));
    return [{ label: 'SIDE', items: side }, { label: 'TOP', items: top }];
  }
  const yT = p.upper.yT, Lv = p.upper.Lv;
  side.push(fl(G.spline([G.P(0, 0), G.P(-0.05, -hB * 0.7), G.P(0.2, -hB), G.P(Ls * 0.3, -hT * 1.1), G.P(yT, -hT), G.P(yT + (Ls - yT) * 0.5, -Math.min(Lv * 0.5, hT * 1.4)), G.P(Ls * 0.97, -soleT * 2), G.P(Ls, 0)], 6)));
  side.push(ln([G.P(yT, -hT), G.P(yT + 0.05, 0)], 'flatd'));
  if (o.item === 'maryjanes') side.push(fl([G.P(Ls * 0.5, -hT * 1.05), G.P(Ls * 0.58, -hT * 1.05 - Ls * 0.1), G.P(Ls * 0.64, -hT * 1.05 - Ls * 0.08), G.P(Ls * 0.56, -hT * 1.05 + Ls * 0.02)]));
  if (o.item === 'espadrilles') for (let i = 1; i < 12; i++) side.push(ln([G.P(Ls * i / 12, 0), G.P(Ls * i / 12, soleT)], 'flatd'));
  top.push(dashed(F.ring.filter(q => q.y > yT).map(q => G.P(q.x * 0.8, -q.y))));
  return [{ label: 'SIDE', items: side }, { label: 'SOLE', items: top }];
}
// ---------- belts, harnesses, suspenders, garters: drawn on a simple torso
function torso(m, legs) {
  const W = m.shoulderToWaist, cw = m.chestCirc / Math.PI / 2 * 1.25, ww = m.waistCirc / Math.PI / 2 * 1.25, hw = m.hipCirc / Math.PI / 2 * 1.3;
  const yW = W, yH = W + m.waistToHip, yC = yH + m.hipToCrotch, yT = W + m.waistToMidThigh;
  const sh = m.shoulderWidth + m.neckCirc / Math.PI / 2;
  const half = [G.P(m.neckCirc / Math.PI / 2, 0), G.P(sh, m.shoulderWidth * 0.3), G.P(cw, m.armholeDepth), G.P(ww, yW), G.P(hw, yH)].concat(legs ? [G.P(hw * 0.95, yT), G.P(hw * 0.12, yT), G.P(0.05, yC)] : [G.P(hw, yC)]);
  const R = G.spline(half, 6);
  return R.concat(R.slice().reverse().map(q => G.P(-q.x, q.y)));
}
function bodyFlat(out, F) {
  const m = out.m, o = out.o, p = out.plan;
  const items = [{ pts: torso(m, ['thighharness', 'waistharness', 'garters'].includes(o.item)), cls: 'flatd', close: true }];
  const yOf = (pos) => dropToPos(m, pos);
  const halfAt = (y) => { if (y <= m.armholeDepth) return m.chestCirc / Math.PI / 2 * 1.25; if (y <= m.shoulderToWaist) return m.waistCirc / Math.PI / 2 * 1.25 + (m.chestCirc - m.waistCirc) / Math.PI / 2 * 1.25 * (m.shoulderToWaist - y) / (m.shoulderToWaist - m.armholeDepth); return bodyCircAt(m, y - m.shoulderToWaist) / Math.PI / 2 * 1.28; };
  const band = (y, w, cls) => { const hw = halfAt(y + w / 2) * 1.02; items.push(fl([G.P(-hw, y), G.P(hw, y), G.P(hw, y + w), G.P(-hw, y + w)], cls)); return hw; };
  const ring = (x, y, r) => items.push({ c: G.P(x, y), r: Math.max(0.12, r), cls: 'flat' });
  const sw = (p.straps && p.straps[0] ? p.straps[0].w : p.belt ? p.belt.w : 0.5);
  if (o.item === 'corsetbelt') {
    const c = p.corset, yW = yOf(o.beltPos);
    const hw0 = halfAt(yW - c.H / 2), hw1 = halfAt(yW + c.H / 2), hww = halfAt(yW);
    const pt = o.corsetShape === 'pointed' ? c.H * 0.14 : 0;
    items.push(fl([G.P(-hw0, yW - c.H / 2), G.P(0, yW - c.H / 2 - pt), G.P(hw0, yW - c.H / 2), G.P(hww, yW), G.P(hw1, yW + c.H / 2), G.P(0, yW + c.H / 2 + pt), G.P(-hw1, yW + c.H / 2), G.P(-hww, yW)]));
    [-0.55, -0.18, 0.18, 0.55].forEach(f => items.push(ln([G.P(hw0 * f, yW - c.H / 2 - (Math.abs(f) < 0.2 ? pt * 0.6 : 0)), G.P(hww * f * 0.95, yW), G.P(hw1 * f, yW + c.H / 2 + (Math.abs(f) < 0.2 ? pt * 0.6 : 0))])));
    return [{ label: 'FRONT', items }];
  }
  if (o.item === 'obi') { const ob = p.obi, y = yOf(o.beltPos) - ob.H / 2; band(y, ob.H); return [{ label: 'FRONT', items }]; }
  if (o.item === 'suspenders') {
    const yW = m.shoulderToWaist, x0 = m.neckCirc / Math.PI / 2 + m.shoulderWidth * 0.5;
    [-1, 1].forEach(s => { items.push(fl([G.P(s * x0 - sw / 2, 0.1), G.P(s * x0 + sw / 2, 0.1), G.P(s * x0 * 0.95 + sw / 2, yW), G.P(s * x0 * 0.95 - sw / 2, yW)])); items.push(fl([G.P(s * x0 * 0.95 - sw * 0.7, yW * 0.45), G.P(s * x0 * 0.95 + sw * 0.7, yW * 0.45), G.P(s * x0 * 0.95 + sw * 0.7, yW * 0.45 + sw * 1.2), G.P(s * x0 * 0.95 - sw * 0.7, yW * 0.45 + sw * 1.2)])); });
    return [{ label: 'FRONT', items }];
  }
  if (o.item === 'garters') {
    const y = m.shoulderToWaist + (o.garterStyle === 'belt' ? 0 : m.waistToMidThigh);
    if (o.garterStyle === 'belt') { band(m.shoulderToWaist - 0.2, Math.max(0.5, m.waistToHip * 0.3)); [-0.6, -0.25, 0.25, 0.6].forEach(f => items.push(ln([G.P(halfAt(m.shoulderToWaist) * f, m.shoulderToWaist + m.waistToHip * 0.3), G.P(halfAt(m.shoulderToWaist) * f * 1.1, m.shoulderToWaist + m.waistToMidThigh * 0.95)]))); }
    else { const tx = m.hipCirc / Math.PI / 2 * 0.55, tr = thighCircAt(m, o.thighPos) / Math.PI / 2; items.push(fl([G.P(tx - tr, y), G.P(tx + tr, y), G.P(tx + tr, y + 0.5), G.P(tx - tr, y + 0.5)])); for (let i = 0; i <= 8; i++) items.push(ln([G.P(tx - tr + 2 * tr * i / 8, y + 0.5), G.P(tx - tr + 2 * tr * (i + 0.5) / 8, y + 0.85)])); }
    return [{ label: 'FRONT', items }];
  }
  // belts & harnesses
  const posY = (pos) => pos === 'neck' ? -0.2 : yOf(pos);
  if (p.belt || o.item === 'belt' || o.item === 'utilitybelt') {
    const y = posY(o.beltPos === 'underbust' && o.item === 'chestharness' ? 'underbust' : o.beltPos);
    if (o.item !== 'chestharness' || o.withWaist) { const hw = band(y, sw); if (o.beltClosure === 'pin buckle' || o.beltClosure === 'slide buckle') { items.push(fl([G.P(-sw * 0.8, y - sw * 0.25), G.P(sw * 0.8, y - sw * 0.25), G.P(sw * 0.8, y + sw * 1.25), G.P(-sw * 0.8, y + sw * 1.25)])); } if (p.holes) for (let i = 0; i < p.holes.n; i++) items.push({ c: G.P(sw * 1.2 + i * p.holes.sp, y + sw / 2), r: Math.max(0.05, sw * 0.12), cls: 'flat' }); }
  }
  if (p.pouches) { const pu = p.pouches, y = posY(o.beltPos); [-1, 1].slice(0, pu.n).forEach(s => { const x = s * halfAt(y) * 0.55; items.push(fl([G.P(x - pu.W / 2, y - pu.H * 0.2), G.P(x + pu.W / 2, y - pu.H * 0.2), G.P(x + pu.W / 2, y + pu.H * 0.8), G.P(x - pu.W / 2, y + pu.H * 0.8)])); items.push(fl([G.P(x - pu.W / 2, y - pu.H * 0.2), G.P(x + pu.W / 2, y - pu.H * 0.2), G.P(x + pu.W / 2, y + pu.H * 0.3), G.P(x, y + pu.H * 0.4), G.P(x - pu.W / 2, y + pu.H * 0.3)])); }); }
  if (o.item === 'chestharness') {
    const yU = yOf('underbust'); band(yU, sw);
    if (o.harnessStyle === 'cage') band(yU + sw * 1.8, sw);
    const sx = m.neckCirc / Math.PI / 2 + m.shoulderWidth * 0.45;
    if (o.harnessStyle === 'collar') { band(-0.2 - sw, sw); ring(0, m.neckToChin * 0.1 + sw, sw * 0.7); items.push(fl([G.P(-sw / 2, sw * 1.5), G.P(sw / 2, sw * 1.5), G.P(sw / 2, yU), G.P(-sw / 2, yU)])); [-1, 1].forEach(s => items.push(fl([G.P(s * sw * 0.8, sw * 1.3), G.P(s * sx, 0.05), G.P(s * sx + s * sw, 0.15), G.P(s * sw * 0.8, sw * 2)]))); ring(0, yU + sw / 2, sw * 0.7); }
    else [-1, 1].forEach(s => items.push(fl([G.P(s * sx - sw / 2, 0.05), G.P(s * sx + sw / 2, 0.05), G.P(s * sx * 0.75 + sw / 2, yU), G.P(s * sx * 0.75 - sw / 2, yU)])));
    if (o.withWaist) { const yW = yOf(o.beltPos); items.push(fl([G.P(-sw / 2, yU + sw), G.P(sw / 2, yU + sw), G.P(sw / 2, yW), G.P(-sw / 2, yW)])); ring(0, yW + sw / 2, sw * 0.7); }
  }
  if (o.item === 'waistharness') {
    const y1 = yOf(o.beltPos), h = p.harness;
    if (h && h.kind === 'double') { const y2 = y1 + h.vd; band(y2, sw); [-0.7, -0.25, 0.25, 0.7].forEach(f => { const x = halfAt(y1) * f; items.push(fl([G.P(x - sw / 2, y1 + sw), G.P(x + sw / 2, y1 + sw), G.P(x * 1.05 + sw / 2, y2), G.P(x * 1.05 - sw / 2, y2)])); ring(x, y1 + sw * 1.2, sw * 0.55); ring(x * 1.05, y2 - sw * 0.1, sw * 0.55); }); }
    else if (h) [-0.6, -0.25, 0.25, 0.6].forEach(f => { const x = halfAt(y1) * f; items.push(fl([G.P(x - sw / 2, y1 + sw), G.P(x + sw / 2, y1 + sw), G.P(x * 0.9 + sw / 2, y1 + h.vd), G.P(x * 0.9 - sw / 2, y1 + h.vd)])); ring(x, y1 + sw * 1.2, sw * 0.55); });
  }
  if (o.item === 'thighharness') {
    const tY = m.shoulderToWaist + ({ 'upper thigh': m.seatDepth + m.crotchToKnee * 0.12, 'mid thigh': m.waistToMidThigh, 'above knee': m.waistToKnee - m.crotchToKnee * 0.15 }[o.thighPos]);
    const tx = m.hipCirc / Math.PI / 2 * 0.62, tr = thighCircAt(m, o.thighPos) / Math.PI / 2 * 1.1;
    (o.bothLegs ? [-1, 1] : [1]).forEach(s => { items.push(fl([G.P(s * tx - tr, tY), G.P(s * tx + tr, tY), G.P(s * tx + tr, tY + sw), G.P(s * tx - tr, tY + sw)])); if (o.toBelt) { const yb = yOf(o.beltPos); items.push(fl([G.P(s * (tx + tr) - sw, yb + sw), G.P(s * (tx + tr), yb + sw), G.P(s * (tx + tr), tY), G.P(s * (tx + tr) - sw, tY)])); ring(s * (tx + tr) - sw / 2, tY - 0.05, sw * 0.55); } });
  }
  return [{ label: 'FRONT', items }];
}
// ---------- neck & hair & sash
function bowShape(cx, cy, bw, bh) {
  return [
    fl([G.P(cx, cy), G.P(cx - bw, cy - bh / 2), G.P(cx - bw * 1.05, cy), G.P(cx - bw, cy + bh / 2)]),
    fl([G.P(cx, cy), G.P(cx + bw, cy - bh / 2), G.P(cx + bw * 1.05, cy), G.P(cx + bw, cy + bh / 2)]),
    fl([G.P(cx - bh * 0.18, cy - bh * 0.3), G.P(cx + bh * 0.18, cy - bh * 0.3), G.P(cx + bh * 0.18, cy + bh * 0.3), G.P(cx - bh * 0.18, cy + bh * 0.3)])
  ];
}
function smallFlat(out, F) {
  const o = out.o, p = out.plan, m = out.m;
  const items = [];
  const it = o.item;
  if (it === 'choker') { const c = p.choker; const r = c.C / Math.PI / 2; items.push(fl(ellipsePts(0, 0, r * 1.3, r * 0.45, 40))); items.push(fl(ellipsePts(0, c.w, r * 1.3, r * 0.45, 40), 'flatl')); if (o.chokerStyle === 'ring') items.push({ c: G.P(0, r * 0.45 + c.w / 2), r: c.w * 0.6, cls: 'flat' }); }
  else if (it === 'tie') { const t = p.tie; items.push(fl([G.P(-t.wn * 0.8, 0), G.P(t.wn * 0.8, 0), G.P(t.wn * 0.6, t.wn * 1.6), G.P(-t.wn * 0.6, t.wn * 1.6)])); items.push(fl([G.P(-t.wn * 0.55, t.wn * 1.6), G.P(t.wn * 0.55, t.wn * 1.6), G.P(t.wb / 2, t.drop - t.wb * 0.45), G.P(0, t.drop), G.P(-t.wb / 2, t.drop - t.wb * 0.45)])); }
  else if (it === 'bowtie') { const b = p.bow; bowShape(0, 0, b.bw, b.bh).forEach(e => items.push(e)); }
  else if (it === 'cravat') { const w = m.neckToChin; items.push(fl(G.spline([G.P(-w, 0), G.P(w, 0), G.P(w * 1.4, w * 2.5), G.P(0, w * 3.4), G.P(-w * 1.4, w * 2.5)], 6))); }
  else if (it === 'hairbow' || it === 'ribbonbow') { const b = p.bow; bowShape(0, 0, b.bw / 2, b.bh).forEach(e => items.push(e)); if (o.tails) { items.push(fl([G.P(-b.bh * 0.15, b.bh * 0.2), G.P(-b.bw * 0.35, b.bw * 0.8), G.P(-b.bw * 0.2, b.bw * 0.75), G.P(b.bh * 0.05, b.bh * 0.25)])); items.push(fl([G.P(b.bh * 0.15, b.bh * 0.2), G.P(b.bw * 0.35, b.bw * 0.8), G.P(b.bw * 0.2, b.bw * 0.75), G.P(-b.bh * 0.05, b.bh * 0.25)])); } }
  else if (it === 'scrunchie') { const r = Math.max(1.5, m.headCircWig * 0.035); for (let i = 0; i < 12; i++) { const a = Math.PI * 2 * i / 12; items.push({ c: G.P(r * Math.cos(a), r * Math.sin(a)), r: r * 0.42, cls: 'flat' }); } }
  else if (it === 'headband') { const r = m.headEarToEar / Math.PI; const outer = ellipsePts(0, 0, r, r * 1.1, 30, Math.PI, Math.PI * 2), inner = ellipsePts(0, 0, r * 0.82, r * 0.92, 30, Math.PI * 2, Math.PI); items.push(fl(outer.concat(inner))); if (o.headbandStyle === 'knot') items.push({ c: G.P(0, -r * 1.0), r: r * 0.16, cls: 'flat' }); }
  else if (it === 'bandana' || it === 'headscarf') { const pc = out.pieces[0]; const s = pc.isRect ? pc.isRect.w : 10; items.push(fl([G.P(0, 0), G.P(s, 0), G.P(s, s), G.P(0, s)])); items.push(ln([G.P(0, 0), G.P(s, s)], 'flatd')); }
  else if (it === 'kerchief') { const pc = out.pieces[0]; items.push(fl(pc.pts)); }
  else if (it === 'sash') { const pc = out.pieces[0]; const b = G.bbox(pc.pts); items.push(fl(G.spline([G.P(-b.w * 0.15, 0), G.P(0, b.h * 2), G.P(b.w * 0.15, 0)], 6), 'flat')); items.push(fl([G.P(-b.h, -b.h * 0.3), G.P(b.h, -b.h * 0.3), G.P(b.h, b.h * 0.7), G.P(-b.h, b.h * 0.7)])); }
  return [{ label: 'VIEW', items }];
}
