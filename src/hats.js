// ===================== SEWN HATS =====================
// Everything is drafted from the head measured over the wig: band circumference, the arc over the
// crown (front–back and ear–ear) and top-of-head to chin. Crown pieces, side bands and brims are
// flattened cones / domes whose joining edges are measured so they always match.
const BRIM_ANGLE = { flat: 0, slight: 14, droop: 30, deep: 48, up: -72 };
function hatBase(m, o) {
  const Cw = m.headCircWig;
  const soft = o.stiffness === 'soft';
  const ease = +o.hatEase > 0 || o.hatEase === 0 ? +o.hatEase : Cw * (['beret', 'hood', 'balaclava', 'bonnet'].includes(o.item) ? 0.015 : 0.03) + 0.15;
  const band = Cw + ease;
  const hDome = (m.headFrontBack + m.headEarToEar) / 4;   // band line to the top of the head, on the surface
  return { Cw, ease, band, hDome, soft, k: m.k };
}
function hatCut(o, n, extra) {
  const c = Object.assign({ fabric: n }, extra || {});
  return c;
}
function stiffFor(o, n, piece) {
  // medium: fusible interfacing on the outer pieces; stiff: buckram / felt cut without seam allowance
  if (o.stiffness === 'medium') piece.cut.interfacing = (piece.cut.interfacing || 0) + n;
  if (o.stiffness === 'stiff') { piece.cut.stiffener = (piece.cut.stiffener || 0) + n; }
}
function hatLined(o) { return o.lining === 'yes' || o.reversible; }
function buildHat(m, o, S, out) {
  const hb = hatBase(m, o);
  const { Cw, band, hDome } = hb;
  out.used = ['headCircWig', 'headFrontBack', 'headEarToEar'];
  out.plan.family = 'hat';
  out.readout.band = 'head band ' + cm(band) + ' (head over wig ' + cm(Cw) + ' + ' + cm(band - Cw) + ' ease)';
  const P = [];
  const lined = hatLined(o);
  const it = o.item;
  const ellK = o.crownShape === 'oval' ? 1.15 : 1;
  const taperK = { none: 1, slight: 0.9, strong: 0.8 }[o.crownTaper] || 0.9;
  const plan = out.plan;
  plan.band = band; plan.Cw = Cw;
  const linKey = o.reversible ? 'contrast' : 'lining';
  const withLining = (pc, n) => { if (lined) pc.cut[linKey] = (pc.cut[linKey] || 0) + n; return pc; };
  // ---- brim helper
  const brim = (wDef, name) => {
    const w = +o.brimW > 0 ? +o.brimW : wDef;
    const a = (BRIM_ANGLE[o.brimShape] ?? 14) * Math.PI / 180;
    const outer = band + 2 * Math.PI * w * Math.cos(a);
    const pc = brimPiece(band, outer, w, { name: name || 'Brim', cut: hatCut(o, 2, { fold: true, note: 'upper & under brim' }) });
    pc.edges = { crown: { kind: 'seam' }, edge: o.brimEdge === 'bound' ? { kind: 'none' } : { kind: 'seam' }, cb: { kind: 'seam' } };
    if (o.stiffness !== 'soft') stiffFor(o, 1, pc);
    if (o.brimEdge === 'topstitched') { const rows = Math.max(2, Math.round(w / Math.max(0.35, 0.5 * hb.k * 2))); pc.notes.push(rows + ' rows of topstitching, ' + fmt(w / (rows + 1) * 10, 0) + ' mm apart, keep the brim flat.'); }
    if (o.brimEdge === 'wired') addNotion(out, 'wire', 'millinery wire / floral wire (fine) for the brim edge', 1, cm(Math.ceil(outer + 2)));
    if (o.brimEdge === 'bound') addNotion(out, 'bias', 'bias binding for the brim edge', 1, cm(Math.ceil(outer + 3)));
    plan.brim = { w, outer, angle: a, inner: band };
    P.push(pc);
    return pc;
  };
  const top = (circ, name) => {
    const pc = ellipsePiece(circ, ellK, 'top', { name: name || 'Crown top', cut: hatCut(o, 1) });
    pc.edges = { top: { kind: 'seam' } };
    const b = G.bbox(pc.pts);
    // notches at front (single) and back (double)
    pc.marks.push({ type: 'notch', p: G.P(b.x0 + b.w / 2, b.y1) }, { type: 'notch', p: G.P(b.x0 + b.w / 2, b.y0), n: 2 }, { type: 'notch', p: G.P(b.x0, b.y0 + b.h / 2) }, { type: 'notch', p: G.P(b.x1, b.y0 + b.h / 2) });
    pc.marks.push({ type: 'text', p: G.P(b.x0 + b.w / 2 + 0.4, b.y1 - 0.5), text: 'front', small: true });
    withLining(pc, 1); stiffFor(o, 1, pc);
    P.push(pc); return pc;
  };
  const side = (cTop, cBot, h, name) => {
    const pc = coneBand(cTop, cBot, h, { top: 'top', bottom: 'crown', cb: 'cb' }, { name: name || 'Crown side', cut: hatCut(o, 1, { fold: true }) });
    pc.edges = { top: { kind: 'seam' }, crown: { kind: 'seam' }, cb: { kind: 'seam' } };
    withLining(pc, 1); stiffFor(o, 1, pc);
    P.push(pc); return pc;
  };
  const extras = () => {
    if (o.hatBand === 'fabric') { const bh = Math.max(0.4, Cw * 0.035); const st = strip(band + 1.2, bh * 2, { name: 'Hat band', cut: { fabric: 1, fold: false, note: 'fold lengthwise' } }); st.marks.push({ type: 'fold', a: G.P(0, bh), b: G.P(band + 1.2, bh) }); P.push(st); }
    if (o.hatBand === 'ribbon') addNotion(out, 'ribbon', 'ribbon ' + fmt(Math.max(3, Cw * 0.035 * 10), 0) + ' mm for the band', 1, cm(Math.ceil(band + 2 + (o.hatBow ? Cw * 0.5 : 0))));
    if (o.hatBand === 'cord') addNotion(out, 'cord', 'cord for the band', 1, cm(Math.ceil(band * 0.6 + 2)));
    if (o.hatBow && o.hatBand !== 'ribbon') { const bw = Cw * 0.18, bh = Cw * 0.07; const bl = strip(bw * 2 + 0.2, bh * 2, { name: 'Bow loop', cut: { fabric: 1 } }); const bk = strip(bh * 1.2, bh * 1.6, { name: 'Bow knot', cut: { fabric: 1 } }); P.push(bl, bk); }
    if (o.ties) { const tw = Math.max(0.4, Cw * 0.025); const tl = m.crownToChin * 0.75 + Cw * 0.2; const t = strip(tw * 2, tl, { name: 'Chin tie', cut: { fabric: 2 } }); t.marks.push({ type: 'fold', a: G.P(tw, 0), b: G.P(tw, tl) }); P.push(t); out.used.push('crownToChin'); }
  };
  const crownH = (def) => +o.crownH > 0 ? +o.crownH : def;
  // ---------------- per hat
  if (it === 'buckethat' || it === 'sunhat' || it === 'pillbox' || it === 'sailor') {
    const h = crownH({ buckethat: Cw * 0.14, sunhat: Cw * 0.16, pillbox: Cw * (o.style === 'fur / Cossack hat' ? 0.2 : 0.12), sailor: Cw * 0.13 }[it]);
    const tk = it === 'pillbox' && o.crownTaper === 'none' ? 1 : taperK;
    const tc = band * tk;
    top(tc);
    side(tc, band, h);
    plan.crown = { h, top: tc };
    if (it === 'pillbox') {
      if (o.brimShape === 'up') { const cuffH = +o.brimW > 0 ? +o.brimW : Cw * 0.09; const cf = coneBand(band * 1.04, band * 1.04, cuffH * 2, { top: 'edge', bottom: 'crown', cb: 'cb' }, { name: 'Turned-up cuff', cut: { fabric: 1, fold: true, note: 'fold lengthwise — outside and inside of the cuff' } }); cf.marks.push({ type: 'fold', a: G.P(0, cuffH), b: G.P(band * 0.52, cuffH), label: 'fold' }); P.push(cf); plan.cuff = cuffH; }
    } else if (it === 'sailor') {
      const w = +o.brimW > 0 ? +o.brimW : Cw * 0.085;
      const outer = band * 1.13;
      const bp = coneBand(band, outer, w, { top: 'crown', bottom: 'edge', cb: 'cb' }, { name: 'Brim (turned up)', cut: { fabric: 2, fold: true, note: 'outer & inner brim' } });
      stiffFor(o, 1, bp);
      P.push(bp); plan.brim = { w, outer, angle: -1.2, inner: band };
    } else {
      brim(it === 'sunhat' ? Cw * 0.21 : Cw * 0.11);
    }
    extras();
    plan.kind = 'banded';
  } else if (AR.gored.includes(it)) {
    const n = +o.panels || 6;
    const shapeG = it === 'newsboy' ? 'full' : it === 'bakerboy' ? 'full' : it === 'cap' ? 'flat' : 'dome';
    const hf = { cap: 1.02, newsboy: 1.12, bakerboy: 1.04, cloche: 1.1, tulip: 1.0 }[it] || 1;
    const gh = +o.crownH > 0 ? +o.crownH : hDome * hf;
    const bw = band / n;
    const g = gorePiece(bw, gh, shapeG, { name: 'Crown panel', cut: hatCut(o, n) });
    g.edges = { band: { kind: 'seam' }, gore: { kind: 'seam' } };
    withLining(g, n); stiffFor(o, n, g);
    if (it === 'cap' && o.eyelets) g.marks.push({ type: 'dot', kind: 'eyelet', p: G.P(0, -gh * 0.58), label: 'eyelet' });
    g.marks.push({ type: 'notch', p: G.P(0, 0) });
    P.push(g);
    plan.gores = { n, bw, gh, shape: shapeG };
    if (it === 'cap' && o.capBack !== 'closed') {
      // back opening: an arch cut from the two back panels
      const ow = band * 0.13, oh = Math.min(gh * 0.3, Cw * 0.08);
      const xa = bw / 2 - ow / 2;
      const sideR = []; for (let i = 0; i <= 24; i++) { const y = gh * i / 24, u = i / 24; const w = bw * Math.pow(Math.cos(Math.PI / 2 * u), 0.75); sideR.push(G.P(w / 2, -y)); }
      const sideTop = sideR.filter(p => -p.y >= oh);
      const xs = sideTop[0].x; const archPts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI / 2 * i / 14; archPts.push(G.P(xs - (xs - xa) * Math.cos(a), -oh * Math.sin(a))); }
      const left = []; for (let i = 24; i >= 0; i--) { const y = gh * i / 24, u = i / 24; const w = bw * Math.pow(Math.cos(Math.PI / 2 * u), 0.75); left.push(G.P(-w / 2, -y)); }
      const back = runsPiece([
        { pts: [G.P(-bw / 2, 0), G.P(xa, 0)], tag: 'band' },
        { pts: archPts, tag: 'opening' },
        { pts: sideTop.concat([G.P(0, -gh)]), tag: 'gore' },
        { pts: left.slice(1), tag: 'gore' }
      ], { name: 'Back panel (with opening)', cut: hatCut(o, 2, { mirrored: true }) });
      back.edges = { band: { kind: 'seam' }, gore: { kind: 'seam' }, opening: { kind: 'none' } };
      withLining(back, 2); stiffFor(o, 2, back);
      back.notes.push('The opening edge is bound (or faced) — no seam allowance.');
      g.cut.fabric = n - 2; if (g.cut[linKey]) g.cut[linKey] = n - 2; if (g.cut.interfacing) g.cut.interfacing = n - 2; if (g.cut.stiffener) g.cut.stiffener = n - 2;
      P.push(back);
      plan.backOpen = { ow, oh };
      if (o.capBack === 'snapback') { const sw = Math.max(0.4, oh * 0.5); const sl = ow + Cw * 0.06; const s1 = strip(sw * 2, sl + 1, { name: 'Back strap', cut: { fabric: 2 } }); s1.marks.push({ type: 'fold', a: G.P(sw, 0), b: G.P(sw, sl + 1) }); P.push(s1); addNotion(out, 'snap', 'snaps (or a tiny buckle) for the back strap', 2); }
      if (o.capBack === 'elastic') addNotion(out, 'elastic', 'narrow elastic for the back', 1, cm(Math.ceil(ow * 0.8 + 1)));
      addNotion(out, 'bias', 'bias binding for the back opening', 1, cm(Math.ceil(ow + oh * 2 + 2)));
    }
    // band (newsboy, baker-boy) and visor
    if (it === 'newsboy' || it === 'bakerboy') { const bh = Cw * 0.06; const bp = strip(band, bh, { name: 'Head band', cut: { fabric: 1, interfacing: 1 } }, { top: 'seam', right: 'seam', bottom: 'seam', left: 'seam' }); withLining(bp, 1); P.push(bp); plan.headBand = bh; }
    if (it === 'cap' || it === 'newsboy' || it === 'bakerboy') {
      const vd = +o.visorD > 0 ? +o.visorD : Cw * (it === 'cap' ? 0.125 : 0.085);
      const vin = band * (it === 'cap' ? 0.4 : 0.36);
      const v = visorPiece(vin, vd, band, { name: 'Visor', cut: { fabric: 2, stiffener: 1, note: 'stiffener: cut without seam allowance' } });
      v.edges = { band: { kind: 'seam' }, edge: { kind: 'seam' } };
      P.push(v); plan.visor = { d: vd, inner: vin };
      addNotion(out, 'visorboard', 'visor stiffener: template plastic or heavy card', 1);
    }
    if (it === 'cloche' || it === 'tulip') brim(Cw * (it === 'cloche' ? 0.085 : 0.11));
    if (o.topButton) { if (it === 'cap') { const bc = ellipsePiece(Math.PI * Math.max(0.8, Cw * 0.045) * 2, 1, 'edge', { name: 'Button cover', cut: { fabric: 1, note: 'gather over a ' + fmt(Math.max(4, Cw * 0.045 * 10), 0) + ' mm button' } }); bc.edges = { edge: { kind: 'none' } }; P.push(bc); } addNotion(out, 'button', 'button for the crown top ' + fmt(Math.max(3, Math.round(Cw * 0.04 * 10)), 0) + ' mm', 1); }
    if (it === 'cap') { const sb = strip(band, Math.max(0.5, Cw * 0.04) * 2, { name: 'Sweatband', cut: { fabric: 1, bias: false, note: 'or grosgrain ribbon' } }); sb.marks.push({ type: 'fold', a: G.P(0, sb.isRect.h / 2), b: G.P(band, sb.isRect.h / 2) }); P.push(sb); }
    extras();
    plan.kind = 'gored';
  } else if (it === 'beret') {
    const D = Cw * (o.style === 'big slouchy beret' ? 0.62 : 0.5);
    const topC = Math.PI * D;
    const tp = ellipsePiece(topC, 1, 'top', { name: 'Beret top', cut: hatCut(o, 1) });
    tp.edges = { top: { kind: 'seam' } }; withLining(tp, 1);
    const bandB = Cw * 0.97 + (+o.hatEase > 0 ? +o.hatEase : 0);
    const ring = coneBand(bandB, topC, D / 2 - bandB / (2 * Math.PI), { top: 'band', bottom: 'top', cb: 'cb' }, { name: 'Beret underside', cut: hatCut(o, 1, { fold: true }) });
    ring.edges = { band: { kind: 'seam' }, top: { kind: 'seam' }, cb: { kind: 'seam' } }; withLining(ring, 1);
    const bh = Math.max(0.5, Cw * 0.04);
    const hbP = strip(bandB, bh * 2, { name: 'Head band', cut: { fabric: 1, interfacing: 1, note: 'fold lengthwise' } });
    hbP.marks.push({ type: 'fold', a: G.P(0, bh), b: G.P(bandB, bh) });
    P.push(tp, ring, hbP);
    plan.beret = { D, band: bandB };
    out.readout.band = 'head band ' + cm(bandB) + ' (snug: berets grip the head)';
    plan.kind = 'beret';
  } else if (it === 'peaked') {
    const military = o.style === 'military / officer cap';
    const bh = crownH(Cw * (military ? 0.075 : 0.065));
    const topC = band * (military ? 1.28 : 1.04);
    const wallH = Cw * (military ? 0.075 : 0.035);
    top(topC);
    side(topC, band, wallH, 'Crown wall');
    const bp = strip(band, bh, { name: 'Head band', cut: { fabric: 1, interfacing: 1 } }, { top: 'seam', right: 'seam', bottom: 'seam', left: 'seam' });
    withLining(bp, 1); stiffFor(o, 1, bp); P.push(bp);
    const vd = +o.visorD > 0 ? +o.visorD : Cw * 0.085;
    const v = visorPiece(band * 0.38, vd, band, { name: 'Visor', cut: { fabric: 2, stiffener: 1, note: 'stiffener: cut without seam allowance' } });
    v.edges = { band: { kind: 'seam' }, edge: { kind: 'seam' } }; P.push(v);
    addNotion(out, 'visorboard', 'visor stiffener: template plastic or heavy card', 1);
    if (military) addNotion(out, 'wire', 'stiff wire / boning ring for the crown top edge', 1, cm(Math.ceil(topC + 1)));
    plan.peaked = { bh, topC, wallH, vd };
    extras();
    plan.kind = 'peaked';
  } else if (it === 'flatcap') {
    const Ls = band * 0.68, hBack = Cw * 0.085, hFront = Cw * 0.03;
    const n = 30, topE = [], botE = [];
    for (let i = 0; i <= n; i++) { const u = i / n, x = Ls * u; const hh = hFront + (hBack - hFront) * Math.sin(Math.PI * u); botE.push(G.P(x, 0)); topE.push(G.P(x, -hh)); }
    const sideP = runsPiece([{ pts: botE, tag: 'band' }, { pts: [botE[n], topE[n]], tag: 'end' }, { pts: topE.slice().reverse(), tag: 'top' }, { pts: [topE[0], botE[0]], tag: 'end' }], { name: 'Side band', cut: hatCut(o, 1) });
    sideP.edges = { band: { kind: 'seam' }, top: { kind: 'seam' }, end: { kind: 'seam' } };
    sideP.marks.push({ type: 'notch', p: G.P(Ls / 2, 0), n: 2 });
    withLining(sideP, 1); stiffFor(o, 1, sideP);
    const sideTop = G.plen(topE);
    const frontL = band - Ls;
    // top panel: egg shape, wider and longer at the front, perimeter = side top + front edge (eased 10 %)
    const target = sideTop + frontL * 1.1;
    const egg = (sx) => { const pts = []; for (let i = 0; i < 72; i++) { const a = Math.PI * 2 * i / 72; const x = Math.cos(a), y = Math.sin(a); const wf = y > 0 ? 1 + 0.18 * y : 1 - 0.12 * -y; pts.push(G.P(sx * 0.82 * x * wf, sx * y * (y > 0 ? 1.12 : 0.9))); } return pts; };
    let lo = 0.1, hi = target; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; const e = egg(mid); if (G.plen(e.concat([e[0]])) < target) lo = mid; else hi = mid; }
    const ep = egg(lo);
    // split the egg into a front edge (centred at the front, y>0) of length frontL*1.1 and the rest
    const ring = ep.concat([ep[0]]);
    const Lr = G.plen(ring);
    // front centre is at angle 90° (index 18)
    const sFront = G.plen(ring.slice(0, 19));
    const f0 = sFront - frontL * 0.55, f1 = sFront + frontL * 0.55;
    const runA = G.slice(ring, f0, f1), runB = G.slice(ring, f1, Lr).concat(G.slice(ring, 0, f0).slice(1));
    const topP = runsPiece([{ pts: runA, tag: 'front' }, { pts: runB, tag: 'side' }], { name: 'Top panel', cut: hatCut(o, 1) });
    topP.edges = { front: { kind: 'seam' }, side: { kind: 'seam' } };
    topP.marks.push({ type: 'notch', p: runA[0] }, { type: 'notch', p: runA[runA.length - 1] }, { type: 'notch', p: G.pointAt(runB, G.plen(runB) / 2).p, n: 2 });
    topP.marks.push({ type: 'gather', pts: G.slice(runA, G.plen(runA) * 0.2, G.plen(runA) * 0.8), label: 'ease / 2 small pleats', light: true });
    withLining(topP, 1); stiffFor(o, 1, topP);
    const vd = +o.visorD > 0 ? +o.visorD : Cw * 0.075;
    const v = visorPiece(frontL, vd, band * 0.9, { name: 'Visor', cut: { fabric: 2, stiffener: 1, note: 'stiffener: cut without seam allowance' } });
    v.edges = { band: { kind: 'seam' }, edge: { kind: 'seam' } };
    P.push(topP, sideP, v);
    addNotion(out, 'visorboard', 'visor stiffener: template plastic or heavy card', 1);
    addNotion(out, 'snap', 'snap (holds the front of the top to the visor)', 1);
    plan.flatcap = { Ls, frontL, vd };
    plan.kind = 'flatcap';
  } else if (it === 'witch') {
    const Hc = crownH(Cw * 0.62);
    const r = band / (2 * Math.PI);
    const slant = Math.hypot(Hc, r);
    const cone = coneBand(0.0001, band, slant, { top: 'tip', bottom: 'crown', cb: 'cb' }, { name: 'Cone', cut: hatCut(o, 1, { fold: true }) });
    cone.edges = { tip: { kind: 'none' }, crown: { kind: 'seam' }, cb: { kind: 'seam' } };
    withLining(cone, 1); stiffFor(o, 1, cone);
    P.push(cone);
    brim(Cw * 0.22);
    plan.witch = { Hc, slant };
    if (o.tipBend) addNotion(out, 'wire2', 'thin wire for the bent tip', 1, cm(Math.ceil(slant * 0.4)));
    extras();
    plan.kind = 'witch';
  } else if (it === 'bonnet') {
    out.used.push('crownToChin');
    const backD = Cw * 0.27;
    const backC = Math.PI * backD;
    const Lb = m.crownToChin * 2 * 0.9;
    const bw = +o.brimW > 0 ? +o.brimW : m.headFrontBack * 0.34;
    const bk = ellipsePiece(backC, 1, 'back', { name: 'Bonnet back', cut: hatCut(o, 1) });
    bk.edges = { back: { kind: 'seam' } };
    const bb = G.bbox(bk.pts);
    // the bottom quarter is the neck edge: mark the notches where the band starts and ends
    const cx = bb.x0 + bb.w / 2, cy = bb.y0 + bb.h / 2, R = bb.w / 2;
    [Math.PI / 2 + Math.PI / 4, Math.PI / 2 - Math.PI / 4].forEach(a => bk.marks.push({ type: 'notch', p: G.P(cx + R * Math.cos(a), cy + R * Math.sin(a)) }));
    bk.marks.push({ type: 'text', p: G.P(cx - 0.8, cy + R * 0.8), text: 'neck edge', small: true });
    withLining(bk, 1);
    const bandP = strip(Lb, bw, { name: 'Bonnet band', cut: hatCut(o, 1) }, { top: 'face', right: 'neck', bottom: 'back', left: 'neck' });
    bandP.edges = { face: { kind: 'seam' }, back: { kind: 'seam' }, neck: { kind: 'hem' } };
    bandP.marks.push({ type: 'gather', pts: [G.P(Lb * 0.1, bw), G.P(Lb * 0.9, bw)], label: 'gather to fit the back' });
    bandP.marks.push({ type: 'notch', p: G.P(Lb / 2, 0) }, { type: 'notch', p: G.P(Lb / 2, bw), n: 2 });
    withLining(bandP, 1); stiffFor(o, 1, bandP);
    P.push(bk, bandP);
    if (o.bonnetFrill) { const fh = Math.max(0.6, Cw * 0.05); const fr = strip(Lb * 1.8, fh * 2, { name: 'Face frill', cut: { fabric: 1, note: 'fold lengthwise, gather' } }); fr.marks.push({ type: 'fold', a: G.P(0, fh), b: G.P(Lb * 1.8, fh) }); P.push(fr); }
    addNotion(out, 'ribbon', 'narrow ribbon or cord for the neck casing', 1, cm(Math.ceil(backC * 0.25 + 4)));
    plan.bonnet = { backD, Lb, bw };
    extras();
    plan.kind = 'bonnet';
  } else if (it === 'trapper') {
    out.used.push('crownToChin');
    const wc = Cw * 0.13;
    const Lc = m.headFrontBack * 1.04;
    const Lb = (band - 2 * wc) / 2;
    const hs = dShapeHeight(Lb, Lc);
    const n = 40, arcPts = [];
    for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; arcPts.push(G.P(Lb / 2 - Lb / 2 * Math.cos(a), -hs * Math.sin(a))); }
    const flapL = Math.max(Cw * 0.12, (m.crownToChin - m.headEarToEar / 2) * 0.85);
    const e0 = Lb * 0.3, e1 = Lb * 0.78;
    const flapPts = G.spline([G.P(e1, 0), G.P(e1 - (e1 - e0) * 0.05, flapL * 0.7), G.P((e0 + e1) / 2, flapL), G.P(e0 + (e1 - e0) * 0.05, flapL * 0.7), G.P(e0, 0)], 8);
    const sideP = runsPiece([
      { pts: [G.P(0, 0), G.P(e0, 0)], tag: 'band' },
      { pts: flapPts.slice().reverse(), tag: 'flap' },
      { pts: [G.P(e1, 0), G.P(Lb, 0)], tag: 'band' },
      { pts: arcPts.slice().reverse(), tag: 'top' }
    ], { name: 'Side crown with ear flap', cut: hatCut(o, 2, { mirrored: true }) });
    sideP.edges = { band: { kind: 'seam' }, flap: { kind: 'seam' }, top: { kind: 'seam' } };
    sideP.marks.push({ type: 'text', p: G.P(Lb * 0.06, -0.4), text: 'front', small: true });
    withLining(sideP, 2);
    const cen = runsPiece(roundedRuns([G.P(0, 0), G.P(wc, 0), G.P(wc, Lc), G.P(0, Lc)], [{ tag: 'band' }, { tag: 'top' }, { tag: 'band' }, { tag: 'top' }], [0, 0, 0, 0]), { name: 'Centre strip', cut: hatCut(o, 1) });
    cen.edges = { band: { kind: 'seam' }, top: { kind: 'seam' } };
    cen.isRect = { w: wc, h: Lc };
    cen.marks.push({ type: 'text', p: G.P(wc * 0.1, 0.5), text: 'front', small: true });
    withLining(cen, 1);
    const ffw = band * 0.42, ffh = +o.brimW > 0 ? +o.brimW : Cw * 0.11;
    const ff = runsPiece(roundedRuns([G.P(0, 0), G.P(ffw, 0), G.P(ffw, ffh), G.P(0, ffh)], [{ tag: 'band' }, { tag: 'edge' }, { tag: 'edge' }, { tag: 'edge' }], [0, 0, ffh * 0.5, ffh * 0.5]), { name: 'Front flap', cut: { fabric: 1, lining: 1, note: 'lining = fur / fleece' } });
    ff.edges = { band: { kind: 'seam' }, edge: { kind: 'seam' } };
    P.push(sideP, cen, ff);
    plan.trapper = { wc, Lc, Lb, hs, flapL, ffh };
    if (o.ties) { const tw = Math.max(0.35, Cw * 0.02); const t = strip(tw * 2, Cw * 0.35, { name: 'Flap tie', cut: { fabric: 2 } }); t.marks.push({ type: 'fold', a: G.P(tw, 0), b: G.P(tw, Cw * 0.35) }); P.push(t); }
    plan.kind = 'trapper';
  } else if (it === 'hood' || it === 'balaclava') {
    out.used.push('crownToChin', 'neckCirc', 'neckToChin');
    const snug = o.hoodFit === 'snug' || it === 'balaclava';
    const e = snug ? 1.03 : 1.12;
    const Hh = m.crownToChin * (snug ? 1.0 : 1.08) + m.neckToChin * (it === 'balaclava' ? 1.6 : 1.0);
    const Dh = m.headFrontBack * 0.52 * e;
    const neckHalf = m.neckCirc / 2 * (snug ? 1.08 : 1.25);
    // outline: front edge x=0 from top (0,0) to bottom (0,Hh); back curve
    const back = G.spline([G.P(0, 0), G.P(Dh * 0.62, -Hh * 0.02), G.P(Dh, Hh * 0.28), G.P(Dh * 0.96, Hh * 0.6), G.P(Dh * 0.78, Hh * 0.86)], 10);
    const neckEnd = G.P(Dh * 0.78, Hh * 0.86);
    const neck = G.spline([neckEnd, G.P(Dh * 0.45, Hh * 0.98), G.P(0, Hh)], 10);
    // stretch the neck curve so its length matches the neck
    let runs;
    if (it === 'balaclava') {
      const yb = m.crownToChin * 0.3, yc = m.crownToChin * 0.92;
      const depth = Cw * 0.085;
      const face = G.spline([G.P(0, yb), G.P(depth * 0.8, yb + (yc - yb) * 0.15), G.P(depth, (yb + yc) / 2), G.P(depth * 0.7, yc - (yc - yb) * 0.12), G.P(0, yc)], 8);
      runs = [{ pts: [G.P(0, Hh), G.P(0, yc)], tag: 'cf' }, { pts: face.slice().reverse(), tag: 'face' }, { pts: [G.P(0, yb), G.P(0, 0)], tag: 'cf' }, { pts: back, tag: 'cb' }, { pts: neck, tag: 'neck' }];
      plan.balaclava = { yb, yc, depth };
    } else {
      runs = [{ pts: [G.P(0, Hh), G.P(0, 0)], tag: 'face' }, { pts: back, tag: 'cb' }, { pts: neck, tag: 'neck' }];
    }
    const pc = runsPiece(runs, { name: it === 'hood' ? 'Hood side' : 'Balaclava side', cut: { fabric: 2, mirrored: true } });
    pc.edges = { face: { kind: it === 'hood' && lined ? 'seam' : 'hem' }, cb: { kind: 'seam' }, cf: { kind: 'seam' }, neck: { kind: lined || it === 'balaclava' ? 'hem' : 'seam' } };
    if (lined) pc.cut.lining = 2;
    const nl = edgeLength(pc, 'neck');
    if (Math.abs(nl - neckHalf) > 0.3) pc.notes.push('Neck edge ' + cm(nl) + ' — ' + (nl > neckHalf ? 'ease or gather it slightly onto a ' + cm(neckHalf) + ' neckline.' : 'it stretches over the head; use a stretch fabric.'));
    P.push(pc);
    if (it === 'balaclava') out.notes.push('Balaclava: use a knit with good stretch (jersey, rib or fleece) so the face opening and neck can pass over the head. Finish the face opening with a band or bias.');
    plan.hood = { Hh, Dh };
    extras();
    plan.kind = 'hood';
  }
  out.pieces.push(...P);
  hatSteps(out, P);
  out.flat = Object.assign({}, plan, { kind: 'hat', item: it });
}
function hatSteps(out, P) {
  const { o, plan, S } = out;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  const lined = hatLined(o);
  add('Cut all pieces and transfer the marks.', 'Cut the outer pieces' + (lined ? (o.reversible ? ', the second (reversible) fabric pieces' : ' and the lining') : '') + '. ' + (['hood', 'balaclava'].includes(o.item) ? '' : o.stiffness === 'medium' ? 'Fuse interfacing to the outer crown and brim pieces. ' : o.stiffness === 'stiff' ? 'Cut the stiffener (buckram, heavy felt or stiff interfacing) without seam allowance and baste / fuse it inside the stitching line of the outer pieces. ' : '') + 'Mark the front (single) and back (double) notches — they keep the crown, side band and brim lined up. Seam allowance is ' + (S.useSA ? fmt(S.sa) + ' cm' : 'not included') + '; on curves trim it to 2–3 mm after stitching.');
  const k = plan.kind;
  if (k === 'banded') {
    add('Close the crown side.', 'Fold the crown side (cut on fold) right sides together and stitch the centre-back seam. Press open.');
    add('Sew the top into the crown side.', 'Staystitch the top edge of the side band and clip it every 3–4 mm. Pin the crown top in, matching the front and back notches to the fold and the seam, and the side notches to the halfway points. Stitch with the side band on top, easing as you go. Notch the allowance of the top piece, press toward the side and topstitch if you like.');
    if (plan.cuff) add('Make the turned-up cuff.', 'Close the cuff\'s back seam, fold it in half lengthwise (wrong sides together) and baste the raw edges. Sew it to the bottom of the crown, raw edges together; turn it up after the lining is in.');
    else if (plan.brim) add('Make the brim.', 'Sew the centre-back seam of the upper and the under brim. Place them right sides together and stitch the outer edge' + (o.brimEdge === 'wired' ? ' — then sew a narrow channel 2 mm from the edge and slide the wire in, overlapping the ends 1 cm and taping them' : '') + '. Trim, notch, turn, press. ' + (o.brimEdge === 'topstitched' ? 'Topstitch rows around the brim from the edge inward. ' : '') + 'Baste the inner edges together and clip them.');
    if (plan.brim) add('Attach the brim.', 'Pin the brim to the bottom of the crown, right sides together, matching the CB seams and the front notches. Stitch with the crown on top.');
  }
  if (k === 'gored') {
    add('Sew the crown panels.', 'Sew the panels together in pairs (or threes) from the band edge to the point, then sew the two halves together across the top in one seam so the points meet exactly. Backtack 2 mm from the top. Press the seams open over a ham (a rolled sock works) and topstitch both sides of every seam.' + (o.eyelets ? ' Hand-sew or set the vent eyelets.' : ''));
    if (plan.backOpen) add('Finish the back opening.', 'Bind the arch of the back opening with bias binding' + (o.capBack === 'snapback' ? '; make the two back straps (fold the edges in, fold, edgestitch), sew one to each side of the opening and add the snaps.' : o.capBack === 'elastic' ? '; then stitch a piece of elastic across the opening, stretching it slightly.' : '.'));
    if (plan.visor) add('Make the visor.', 'Sew the two visor pieces right sides together around the outer curve, trim to 2 mm, turn and press. Slide the stiffener in, push it to the edge and stitch along the inner edge to hold it. Topstitch rows parallel to the outer edge if you like (stitch through the plastic with a sharp needle and long stitch).');
    if (plan.visor) add('Attach the visor.', 'Centre the visor on the front seam (or the centre of the front panel), right sides together with the crown, and stitch along the band edge.');
    if (plan.headBand) add('Attach the head band.', 'Close the head band\'s back seam, sew it to the bottom of the crown (crown gathered or eased to fit), then sandwich the visor between the band and the crown.');
    if (plan.brim) add('Make and attach the brim.', 'Sew the brim\'s CB seams, sew upper and under brim together around the outer edge, turn, press, topstitch, then sew it to the crown matching the CB seams and the front.');
  }
  if (k === 'beret') {
    add('Sew the beret.', 'Close the underside\'s CB seam. Place top and underside right sides together around the outer edge and stitch; notch the allowance, turn, press the edge. Close the head band into a ring, fold it lengthwise and sew it to the underside\'s inner edge, stretching the beret slightly to fit.');
  }
  if (k === 'peaked') add('Assemble the crown.', 'Close the crown wall\'s CB seam and sew the top into it (match notches, ease). Close the head band, sew it to the bottom of the crown wall. Make the visor (two layers + stiffener) and sew it to the front of the band, centred. ' + (o.style === 'military / officer cap' ? 'Slide the wire / boning ring into the top seam allowance so the top stays stretched flat.' : ''));
  if (k === 'flatcap') {
    add('Sew the side band.', 'Sew the top panel to the side band\'s top edge from notch to notch, matching the back notches. The front of the top panel stays free.');
    add('Make and attach the visor.', 'Make the visor (two layers + stiffener), sew it to the front edge of the opening between the side band ends, then sew the front of the top panel onto the visor seam, easing (or folding two tiny pleats) so it overhangs the visor. Sew a snap under the front of the top to hold it down on the visor.');
  }
  if (k === 'witch') {
    add('Make the cone.', 'Fuse / baste the stiffener, fold the cone right sides together and stitch the back seam to the tip. Trim the tip, turn with a chopstick.' + (o.tipBend ? ' Slide a wire up into the tip so you can bend it.' : ''));
    add('Make and attach the brim.', 'Stitch the brim\'s CB seams, sew the two brim layers together around the outer edge (wired edge: sew a channel and insert the wire), turn, press. Sew the brim to the bottom of the cone.');
  }
  if (k === 'bonnet') {
    add('Gather the band onto the back.', 'Run two gathering rows along the back edge of the band between the marks. Pin the band to the back piece between the two notches (the bottom quarter of the back stays free as the neck edge), pull up the gathers to fit and stitch.');
    if (o.bonnetFrill) add('Add the face frill.', 'Fold the frill in half lengthwise, gather it to the length of the face edge and baste it to the right side of the face edge.');
    add('Line and finish.', 'Make the lining the same way, place it right sides together with the bonnet along the face edge, stitch, turn and press. Turn the neck edge in to make a casing, thread the ribbon through' + (o.ties ? ' and sew the chin ties at the band ends.' : '.'));
  }
  if (k === 'trapper') {
    add('Sew the crown.', 'Sew the centre strip between the two side pieces, matching the front of the strip with the front of the sides: stitch one long edge from front to back, then the other. Clip the curves.');
    add('Make the lining (fur / fleece) the same way.', 'Sew the lining crown exactly like the outer crown.');
    add('Add the front flap and join.', 'Sew the front flap and its fur lining right sides together around the curved edge, turn. Baste it to the front of the outer crown (right sides together, flap pointing down). Put outer and lining right sides together, stitch around the band and the ear flaps' + (o.ties ? ' (with the ties caught at the flap tips)' : '') + ', leaving a gap at the back. Turn, close the gap, and fold the front flap ' + (o.frontFlap === 'up' ? 'up.' : 'down.'));
  }
  if (k === 'hood') {
    if (out.o.item === 'balaclava') add('Sew the balaclava.', 'Sew the centre-front seam above the face opening (forehead) and below it (chin to neck). Sew the centre-back seam. Finish the face opening with a narrow band or binding, stretching it slightly so it hugs the face; hem the neck edge.');
    else add('Sew the hood.', 'Sew the centre-back seam of the hood and of the lining. ' + (lined ? 'Place them right sides together and stitch the face edge' + (o.ties ? ' with the ties sandwiched at the lower corners' : '') + '; turn, press, topstitch. Baste the neck edges together and bind them, or sew the hood to a neckline.' : 'Hem the face edge (double fold) and bind or hem the neck edge.'));
  }
  if (lined && ['banded', 'gored', 'peaked', 'flatcap', 'witch'].includes(k)) add('Line the hat.', 'Make the lining crown like the outer crown (without the brim / visor). Turn the hat\'s bottom allowance up inside, drop the lining in (wrong sides together), turn its bottom edge under and slip-stitch it over the brim / band seam. ' + (o.reversible ? 'For a reversible hat, make two complete hats (crown + brim), place them right sides together, stitch around the brim edge, turn through a gap in a crown seam, close and topstitch.' : ''));
  else if (['banded', 'gored', 'peaked', 'flatcap', 'witch'].includes(k)) add('Finish the inside.', 'Cover the crown–brim seam with the sweatband / a strip of grosgrain or bias, stitched to the seam allowance and folded up inside.');
  if (o.hatBand !== 'none' || o.hatBow) add('Add the band and bow.', 'Wrap the band around the crown just above the brim, overlap the ends at the side or back and tack them by hand.' + (o.hatBow ? ' Make the bow (fold the loop strip into a tube, flatten it with the seam at the back centre, pinch the middle with the knot piece) and tack it over the join.' : ''));
  if (o.ties && !['trapper', 'hood', 'bonnet'].includes(o.item)) add('Sew on the chin ties.', 'Make the ties (fold edges in, fold, edgestitch) and sew them inside the crown at the sides, just above the band.');
  if (o.topButton && plan.gores) add('Sew the top button on.', 'Cover the button (or use a fabric yo-yo) and sew it to the top where the panels meet.');
  add('Shape and press.', 'Press the hat over a rolled towel or a ball of the right size, steam lightly and let it dry in shape.');
}
