// ===================== LEG & BOOT ITEMS =====================
// Boot covers, spats / gaiters, boot cuffs and ankle cuffs. Covers and spats use the same "side profile"
// as Doll sew's socks (hosiery.js — the hose* functions below are copied from there unchanged): two
// mirrored layers per leg, seamed down the front and back, every width half the girth at that point.
// A boot cover is that sock with an open sole (an elastic casing tucks under the shoe) and a stirrup;
// a spat stops across the instep. Over shoes, the foot measurements grow by the shoe's bulk.

function hoseLevels(m) {
  const aH = m.ankleHeight;
  const kA = Math.max(m.footLength * 0.8, m.waistToAnkle - m.waistToKnee); // ankle to knee
  const zK = aH + kA;
  return { aH, kA, zC: aH + kA * 0.68, zK, zT: zK + m.crotchToKnee };
}
function hoseCircAt(m, L, z) {
  const a = m.ankleCirc, c = Math.max(m.calfCirc, a), k = Math.max(m.kneeCirc, a), t = Math.max(m.thighCirc, k, c);
  const tab = [[-50, a], [L.aH, a], [L.zC, c], [L.zK, k], [L.zT, t], [L.zT + 100, t]];
  for (let i = 1; i < tab.length; i++) if (z <= tab[i][0]) { const [z0, c0] = tab[i - 1], [z1, c1] = tab[i]; return c0 + (c1 - c0) * (z - z0) / (z1 - z0); }
  return t;
}
function hoseFootGirth(m, s) {
  const FL = m.footLength;
  const tab = [[-99, m.instepCirc], [0.42 * FL, m.instepCirc], [0.72 * FL, m.footCirc], [0.95 * FL, m.footCirc * 0.62], [99, m.footCirc * 0.62]];
  for (let i = 1; i < tab.length; i++) if (s <= tab[i][0]) { const [s0, c0] = tab[i - 1], [s1, c1] = tab[i]; return c0 + (c1 - c0) * (s - s0) / (s1 - s0); }
  return m.footCirc * 0.62;
}
function hoseInstepTarget(m, endS, endH) {
  const FL = m.footLength, hL = m.heelLift || 0;
  const lift = (s) => hL * Math.max(0, 1 - s / (0.72 * FL));
  const s0 = Math.min(0.36 * FL, m.ankleCirc / Math.PI * 1.05);
  const pts = [[s0, m.ankleHeight * 0.95], [0.42 * FL, m.instepCirc / Math.PI * 0.95], [0.72 * FL, m.footCirc / Math.PI * 0.72], [endS * FL, endH]];
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], (pts[i][1] + lift(pts[i][0])) - (pts[i - 1][1] + lift(pts[i - 1][0])));
  return L * 1.03; // the surface is curved, not straight
}
function hoseClip(pts, tags, a, b, keep, newTag) {
  const side = (p) => G.cross(G.sub(b, a), G.sub(p, a));
  const s0 = Math.sign(side(keep)) || 1;
  const inside = (p) => side(p) * s0 >= -1e-9;
  const outP = [], arrive = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const P = pts[i], Q = pts[(i + 1) % n], t = tags[i];
    const iP = inside(P), iQ = inside(Q);
    const X = () => { const r = G.lineIntersect(P, G.sub(Q, P), a, G.sub(b, a)); return r || P; };
    if (iP && iQ) { outP.push(Q); arrive.push(t); }
    else if (iP && !iQ) { outP.push(X()); arrive.push(t); }
    else if (!iP && iQ) { outP.push(X()); arrive.push(newTag); outP.push(Q); arrive.push(t); }
  }
  if (outP.length < 3) return null;
  const ol = new Outline();
  ol.add([outP[0]], arrive[1]);
  for (let k = 1; k < outP.length; k++) ol.add([outP[k]], arrive[k]);
  ol.close(arrive[0]);
  return ol;
}
function hoseCross(a, b) {
  for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) {
    const r = G.segIntersect(a[i - 1], a[i], b[j - 1], b[j]);
    if (r) return { p: r.p, i, j };
  }
  return null;
}
function hoseLayer(m, L, P) {
  const aH = L.aH;
  // always drafted with enough leg for the instep corner to form, then cut down to the real top edge
  const zTop = Math.max(P.zTop, aH + L.kA * 0.45, aH * 2.2);
  const yA = (zTop - aH) * P.lenK;
  // leg widths (half girth), opened up at the ankle if the heel would not get through
  // slouch socks stay fitted round the ankle and only get loose higher up
  const redA = P.redAnkle ?? P.redLeg, zLoose = aH + L.kA * 0.35;
  const redAt = (z) => z >= zLoose ? P.redLeg : redA + (P.redLeg - redA) * Math.max(0, (z - aH) / (zLoose - aH));
  const wRaw = (z) => hoseCircAt(m, L, z) * (1 - redAt(z)) / 2;
  const wA0 = wRaw(aH), add = Math.max(0, P.wAnkleMin - wA0), blendTo = aH + L.kA * 0.3;
  const w = (z) => wRaw(z) + (z < blendTo ? add * (1 - (z - aH) / (blendTo - aH)) : 0);
  const wA = w(aH);
  const N = 18, front = [], back = [];
  for (let i = 0; i <= N; i++) {
    const z = zTop - (zTop - aH) * i / N, y = (zTop - z) * P.lenK;
    const xb = -(w(z) - wA) * 0.6;
    back.push(G.P(xb, y)); front.push(G.P(xb + w(z), y));
  }
  const frontExt = front.concat([G.P(wA, yA + aH * 4 + 6)]);
  const sAnkle = G.plen(front);
  // foot in its own frame: u along the sole from the heel-sole point H0, v up into the foot
  const hb = aH * 0.42;                             // heel bulge behind the back of the ankle
  const A = G.P(-aH * 0.12, aH * 1.0);              // back of the ankle in the foot frame
  const u0 = aH * 0.5;                                // tabi uppers bend (like a moccasin upper) from here forward
  const build = (phi, kap = 0) => {
    const c = Math.cos(phi), s = Math.sin(phi);
    const bend = (p) => {
      if (!(kap > 1e-6) || p.x <= u0) return p;
      const R = 1 / kap, ur = p.x - u0;
      return G.P(u0 + (R - p.y) * Math.sin(ur / R), R - (R - p.y) * Math.cos(ur / R));
    };
    const W = (p0) => { const p = bend(p0); return G.P(p.x - A.x, p.y - A.y); };
    const T = (p) => { const q = W(p); return G.P(q.x * c + q.y * s, yA + q.x * s - q.y * c); };
    const top = [], ub = P.Lb;
    // top line, from far behind (so it is sure to meet the leg) to the ball
    const uBall = P.uBall;
    for (let u = -m.footLength * 1.2; u < uBall; u += m.footLength / 30) top.push(G.P(u, P.depth(u)));
    top.push(G.P(uBall, P.depth(uBall)));
    const dB = P.depth(uBall);
    let toe, sole;
    if (P.toe === 'split') {
      toe = G.bez(G.P(uBall, dB), G.P(uBall + (ub - uBall) * 0.65, dB), G.P(ub, dB * 0.55), G.P(ub, 0), 12);
      sole = [G.P(ub, 0), G.P(aH * 0.15, 0)];
    } else {
      const tip = G.P(ub, dB * 0.42);
      toe = G.bez(G.P(uBall, dB), G.P(uBall + (ub - uBall) * 0.6, dB), G.P(ub, dB * 0.78), tip, 10)
        .concat(G.bez(tip, G.P(ub, dB * 0.1), G.P(ub - dB * 0.2, 0), G.P(ub - dB * 0.42, 0), 8).slice(1));
      sole = [G.P(ub - dB * 0.42, 0), G.P(aH * 0.15, 0)];
    }
    const heel = G.bez(G.P(aH * 0.15, 0), G.P(-hb * 0.9, 0), G.P(-hb, aH * 0.55), A, 12);
    const topW = top.map(T), toeW = toe.map(T), soleW = sole.map(T), heelW = heel.map(T);
    // the leg meets the foot on the top line — or, on chubby small dolls whose leg is wider than the foot is long, on the toe
    const contour = topW.concat(toeW.slice(1));
    const X = hoseCross(frontExt, contour);
    if (!X) return null;
    const nTop = topW.length;
    // round the inside corner where the leg meets the top of the foot
    const r = Math.min(0.35, aH * 0.25);
    const fPart = frontExt.slice(0, X.i).concat([X.p]);
    const tPart = [X.p].concat(contour.slice(X.j));          // from the corner to the end of the toe
    const fL = G.plen(fPart), tL = G.plen(tPart);
    const rr = Math.min(r, tL * 0.3);
    const a1 = G.pointAt(fPart, Math.max(0, fL - rr)).p, b1 = G.pointAt(tPart, Math.min(tL, rr)).p;
    const corner = G.qbez(a1, X.p, b1, 6);
    const frontRun = G.slice(fPart, 0, Math.max(0, fL - rr)).concat(corner.slice(1)).concat(G.slice(tPart, Math.min(tL, rr), tL).slice(1));
    const sJ = fL; // position of the corner along the leg front
    // seam over the instep: corner → toe tip (the round toe's tip is halfway round it)
    const tipLen = P.toe === 'split' ? 0 : G.plen(toeW) * 0.5;
    const frontLen = (sJ - sAnkle) + tL - tipLen;
    void nTop;
    return { frontRun, soleW, heelW, J: X.p, frontLen, T, phi, dB, kap };
  };
  // swing the foot down until the seam over the instep is as long as on the doll
  // (the angle may also go negative — foot tipped up — when the seam over the instep is already too long)
  const angles = []; for (let a = -0.7; a <= 1.25 + 1e-9; a += 0.05) angles.push(a);
  const tries = angles.map(a => ({ a, r: build(a) })).filter(x => x.r);
  let best = null;
  const flat0 = P.bend ? build(0.55, 0) : null;
  if (flat0 && flat0.frontLen > P.target) {
    // tabi: the bottom edge (half the sole's outline) is longer than the seam over the instep — curl the
    // foot so the instep seam is on the inside of the curve, at a natural foot angle
    // the foot is tipped down by half of its curl, so the toe ends up pointing forward and down
    const kMax = 1 / (Math.max(P.depth(P.uBall), P.depth(0)) * 1.25);
    let phi0 = 0.55, good = null;
    for (let pass = 0; pass < 4; pass++) {
      let lo = 0, hi = kMax, r0 = build(phi0, 0);
      for (let it = 0; it < 40 && r0; it++) { const mid = (lo + hi) / 2, r = build(phi0, mid); if (!r) { hi = mid; continue; } if (r.frontLen > P.target) lo = mid; else hi = mid; r0 = r; }
      if (!r0) break;
      good = r0;
      phi0 = Math.min(1.1, 0.45 + Math.max(0, P.Lb - u0) * r0.kap / 2);
    }
    best = good;
  } else if (tries.length) {
    const k = tries.findIndex(x => x.r.frontLen >= P.target);
    if (k <= 0) best = (k === 0 ? tries[0] : tries.reduce((p, q) => Math.abs(q.r.frontLen - P.target) < Math.abs(p.r.frontLen - P.target) ? q : p)).r;
    else {
      let lo = tries[k - 1].a, hi = tries[k].a; best = tries[k].r;
      for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2, r = build(mid); if (!r) break; if (r.frontLen < P.target) lo = mid; else hi = mid; best = r; }
    }
  }
  if (!best) throw new Error('foot draft failed');
  // assemble the outline: top → front & instep & toe → sole → heel → back
  const ol = new Outline();
  ol.add([back[0], front[0]], 'top');
  ol.add(best.frontRun, 'seam');
  ol.add(best.soleW, 'sole');
  ol.add(best.heelW, 'seam');
  ol.add(back.slice().reverse(), 'seam');
  ol.close('seam');
  const heelPt = best.T(G.P(-hb, aH * 0.4));
  let cut = ol, openLen = 0;
  if (P.cut === 'ankle') {
    // the foot of tights: cut along the ankle line, back of the ankle → front corner
    const Ab = G.P(0, yA);
    cut = hoseClip(ol.pts, ol.tags, Ab, best.J, heelPt, 'top') || ol;
    openLen = G.dist(Ab, best.J);
  } else if (P.zTop < zTop - 1e-6) {
    const yCut = P.zTop >= aH ? (zTop - P.zTop) * P.lenK : yA + (aH - P.zTop);
    cut = hoseClip(ol.pts, ol.tags, G.P(-100, yCut), G.P(100, yCut), G.P(0, yCut + 100), 'top') || ol;
  }
  return { ol: cut, best, yA, wA, wAdd: add, front, back, zTop, openLen, heelPt, toePt: best.T(G.P(P.Lb, best.dB * 0.4)) };
}
function hoseSpan(pts, y) {
  const xs = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) xs.push(a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y)); }
  return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : null;
}

// ---------- leg & boot items
// Over shoes, the foot is bigger: add the shoe's bulk and sole to the foot measurements.
function legFootFor(m, o) {
  const m2 = Object.assign({}, m);
  if (o.legOver === 'over shoes') {
    const sole = 0.15 + m.footLength * 0.03;
    m2.footLength = m.footLength * 1.05 + 0.25;
    m2.footCirc = m.footCirc * 1.12 + 0.5;
    m2.instepCirc = m.instepCirc * 1.12 + 0.5;
    m2.ankleCirc = m.ankleCirc * 1.05 + 0.2;
    m2.ankleHeight = m.ankleHeight + sole;
  }
  m2.heelDiag = Math.max(m2.instepCirc * 1.12, m2.ankleCirc * 1.25);
  return m2;
}
function legRed(o) { return { woven: -0.06, stretch: 0.05, 'faux leather': -0.04 }[o.legFabric] ?? -0.06; }
function legLenZ(m, L, o, key) {
  const v = o[key];
  return {
    ankle: L.aH * 2.1, 'ankle boot': L.aH + L.kA * 0.22, 'mid-calf': L.aH + L.kA * 0.55, 'knee-high': L.zK - L.kA * 0.05,
    'over-the-knee': L.zK + m.crotchToKnee * 0.3, 'thigh-high': L.zK + m.crotchToKnee * 0.65, knee: L.zK - L.kA * 0.05
  }[v] ?? (L.aH + L.kA * 0.55);
}
// the boot-cover / spat layer: the sock profile with an open sole
function legCoverLayer(m, o, L, zTop) {
  const red = legRed(o), redFoot = red * 0.6;
  const FLp = m.footLength * (1 - redFoot * 0.25);
  const hb = L.aH * 0.42, ub = FLp - hb;
  const depth = (u) => hoseFootGirth(m, u + hb) * (1 - redFoot) / 2;
  const target = hoseInstepTarget(m, 1, m.footCirc / Math.PI * 0.3);
  const stretch = o.legFabric === 'stretch';
  return hoseLayer(m, L, { zTop, lenK: 1, redLeg: red, redFoot, wAnkleMin: stretch ? m.heelDiag / 1.4 / 2 : 0, Lb: ub, uBall: 0.72 * FLp - hb, depth, toe: 'round', target });
}

function buildLeg(m0, o, S, out) {
  const P = [];
  out.plan.family = 'leg';
  out.used = ['footLength', 'footCirc', 'instepCirc', 'ankleHeight', 'heelLift', 'ankleCirc', 'calfCirc', 'kneeCirc', 'thighCirc', 'waistToKnee', 'waistToAnkle', 'crotchToKnee'];
  const it = o.item, k = m0.k;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  const m = legFootFor(m0, o);
  const L = hoseLevels(m);
  const stretch = o.legFabric === 'stretch', raw = o.legFabric === 'faux leather';
  const ew = Math.max(0.25, k * 0.35);
  add('Cut the pieces.', 'Cut every layer as a mirrored pair (one for each leg)' + (stretch ? ', with the greatest stretch going round the leg' : '') + '. ' + (raw ? 'Faux leather and felt need no hems: trim the edges cleanly.' : 'Transfer the notches: single = instep corner, double = heel.') + (o.legOver === 'over shoes' ? ' The pattern is sized to go over the doll\'s shoes.' : ''));
  if (it === 'bootcovers' || it === 'spats') {
    const zTop = legLenZ(m, L, o, it === 'spats' ? 'spatLen' : 'bootLen');
    const ly = legCoverLayer(m, o, L, zTop);
    let ol = ly.ol;
    const ub = m.footLength * (1 - legRed(o) * 0.15) - L.aH * 0.42;
    if (it === 'spats') {
      // spats stop across the instep: cut the foot off in front of the instep corner
      const uc = ub * 0.5;
      const a = ly.best.T(G.P(uc, -5)), b = ly.best.T(G.P(uc, 8));
      const c = hoseClip(ol.pts, ol.tags, a, b, ly.heelPt, 'vamp');
      if (c) ol = c;
    }
    const name = it === 'spats' ? (o.spatLen === 'ankle' ? 'Spat' : 'Gaiter') : 'Boot cover';
    const pc = pieceFromOutline(ol, { name, cut: { fabric: 4, mirrored: true, lining: o.legLined && !raw ? 4 : 0, note: 'two layers per leg (inner + outer side) — 2 mirrored pairs' } });
    pc.edges.top = raw ? { kind: 'none', label: 'raw edge' } : o.legLined ? { kind: 'seam' } : { kind: 'hem', sa: 0.6, label: 'hem' };
    pc.edges.sole = raw ? { kind: 'none', label: 'raw edge' } : { kind: 'hem', sa: ew + 0.3, label: 'elastic casing — under the shoe edge' };
    pc.edges.vamp = raw ? { kind: 'none', label: 'raw edge' } : o.legLined ? { kind: 'seam' } : { kind: 'hem', sa: 0.5, label: 'hem' };
    pc.edges.seam = { kind: 'seam' };
    const bb = G.bbox(pc.pts);
    const yg = bb.y0 + Math.min(0.5, bb.h * 0.1), sp = hoseSpan(pc.pts, yg) || [bb.x0, bb.x1];
    pc.grain = { a: G.P(sp[0] + (sp[1] - sp[0]) * 0.35, yg + 0.1), b: G.P(sp[0] + (sp[1] - sp[0]) * 0.35, Math.max(yg + 0.6, ly.yA - 0.2)) };
    if (stretch) pc.stretch = { a: G.P(sp[0] + (sp[1] - sp[0]) * 0.2, yg + 0.8), b: G.P(sp[0] + (sp[1] - sp[0]) * 0.8, yg + 0.8) };
    pc.marks.push({ type: 'notch', p: ly.heelPt, n: 2 });
    if (it === 'bootcovers') pc.marks.push({ type: 'notch', p: ly.best.J, n: 1 });
    // opening down the back seam (woven covers must open to get over the heel)
    const close = it === 'spats' ? o.spatClose : o.bootClose;
    const opening = close && close !== 'none';
    let openLen = 0;
    if (opening) {
      const yEnd = ly.yA + L.aH * 0.15;
      openLen = yEnd - bb.y0;
      const spE = hoseSpan(pc.pts, yEnd);
      if (spE) pc.marks.push({ type: 'dot', kind: 'dot', p: G.P(spE[0] + 0.05, yEnd), label: 'opening ends' });
      const nF = Math.max(2, Math.round(openLen / Math.max(0.8, k * 2.2)));
      if (close === 'buttons' || close === 'snaps') addNotion(out, close === 'buttons' ? 'button' : 'snap', close === 'buttons' ? 'tiny buttons' : 'small snaps', nF * 2);
      if (close === 'zip') addNotion(out, 'zip', 'doll zip', 2, cm(Math.ceil(openLen)));
      if (close === 'hook & loop') addNotion(out, 'velcro', 'thin sew-on hook & loop', 2, cm(Math.ceil(openLen)));
      if (close === 'lacing') { addNotion(out, 'eyelet', 'mini eyelets', nF * 4); addNotion(out, 'lace', 'narrow cord / ribbon for the lacing', 2, cm(Math.ceil(openLen * 3 + 6))); }
    } else if (!stretch) out.warnings.push('Without an opening, a ' + o.legFabric + ' cover won\'t get over the heel — choose a closure, or a stretch fabric.');
    if (!opening && stretch && ly.wA * 2 * 1.4 < m.heelDiag) out.warnings.push('The ankle is snug for the heel — add a closure down the back.');
    P.push(pc);
    // under-foot strap / stirrup
    const strapL = m.instepCirc * 0.5 + (raw ? 0.6 : 0.4), sw = Math.max(0.4, k * 0.7);
    const st = strip(strapL, raw ? sw : sw * 2, { name: it === 'spats' ? 'Instep strap' : 'Stirrup strap', cut: { fabric: 2, note: raw ? 'single layer' : 'folded lengthwise' } });
    if (!raw) st.marks.push({ type: 'fold', a: G.P(0, sw), b: G.P(strapL, sw), label: 'fold' });
    P.push(st);
    if (it === 'spats') { addNotion(out, 'button', 'buttons for the instep strap', 2); }
    if (!raw && it === 'bootcovers') addNotion(out, 'elastic', 'narrow elastic for the sole edge', 2, cm(Math.ceil(edgeLength(pc, 'sole') * 2 * 0.8)) + ' each');
    // top finish
    if (o.bootTop === 'fold-down cuff' || o.bootTop === 'faux-fur trim') {
      const g = hoseCircAt(m, L, zTop) * (1 - legRed(o)) + 0.4, h = Math.max(0.6, L.kA * (o.bootTop === 'faux-fur trim' ? 0.12 : 0.16));
      const band = strip(g, h * 2, { name: o.bootTop === 'faux-fur trim' ? 'Faux-fur trim' : 'Fold-down cuff', cut: o.bootTop === 'faux-fur trim' ? { fabric: 0, contrast: 2, note: 'faux fur, one per leg; split at the opening' } : { fabric: 2, note: 'folded lengthwise; one per leg' } });
      band.marks.push({ type: 'fold', a: G.P(0, h), b: G.P(g, h), label: 'fold' });
      P.push(band);
      pc.edges.top = { kind: 'seam', label: 'joins the ' + (o.bootTop === 'faux-fur trim' ? 'trim' : 'cuff') };
    }
    // steps
    add('Sew the layers together.', 'Place an inner and an outer layer right sides together (notches matching). Stitch the front seam from the top, over the instep and round the toe to the sole edge; stitch the back seam from the heel up' + (opening ? ' to the "opening ends" dot' : ' to the top') + '.' + (it === 'spats' ? ' The spat stops across the instep — that edge is hemmed.' : ''));
    if (o.legLined && !raw) add('Line it.', 'Make the lining the same way, slip it inside right sides together, stitch round the top' + (it === 'spats' ? ' and the instep edge' : '') + (opening ? ' and the opening edges' : '') + ', turn through the sole opening and press.');
    if (opening) add('Make the closure.', { zip: 'Sew the zip into the back opening (finish the edges first).', 'hook & loop': 'Sew hook & loop strips to the two back edges so they overlap.', lacing: 'Fold the back edges under, set the mini eyelets in pairs down each side and lace with cord or ribbon.', buttons: 'Hem the back edges, add a small overlap tab on one side, and sew the buttons and buttonholes (or loops).', snaps: 'Hem the back edges with a small overlap and sew on the snaps.' }[close] || 'Add the closure down the back.');
    if (it === 'bootcovers' && !raw) add('Elastic at the sole edge.', 'Turn the sole edge up into a casing and thread the elastic; pull it so the edge tucks under the shoe sole, and stitch the ends.');
    add(it === 'spats' ? 'Add the instep strap.' : 'Add the stirrup strap.', 'Fold and stitch the strap; sew one end inside the ' + (it === 'spats' ? 'inner side at the instep and button the other end on the outer side' : 'sole edge on each side, so it runs under the arch in front of the heel') + '.');
    if (o.bootTop === 'fold-down cuff' || o.bootTop === 'faux-fur trim') add('Add the ' + (o.bootTop === 'faux-fur trim' ? 'fur trim.' : 'cuff.'), 'Fold the band lengthwise and sew it round the top edge right sides together' + (opening ? ', ending at the opening' : '') + '; ' + (o.bootTop === 'fold-down cuff' ? 'wear it folded down.' : 'brush the pile out of the seam.'));
    else if (!raw && !o.legLined) add('Hem the top.', 'Turn the top under twice and stitch.');
    out.plan.leg = { type: 'cover', it, zTop, L, openLen, opening, close, phi: ly.best.phi };
    out.readout.size = (it === 'spats' ? name.toLowerCase() : 'cover') + ' ' + cm(zTop) + ' up from the floor';
  } else if (it === 'bootcuffs' || it === 'anklecuffs') {
    const z = it === 'anklecuffs' ? L.aH * 1.15 : legLenZ(m, L, o, 'cuffPos');
    const over = it === 'bootcuffs' ? (o.legOver === 'over shoes' ? 0.14 : 0.08) : 0.05;
    const girth = hoseCircAt(m, L, z) * (1 + over) + (stretch ? -hoseCircAt(m, L, z) * 0.08 : 0.4);
    const h = +o.cuffBandH > 0 ? +o.cuffBandH : Math.max(0.6, L.kA * (it === 'bootcuffs' ? 0.2 : 0.1));
    const cs = it === 'bootcuffs' ? o.bootCuffStyle : o.ankleCuffStyle;
    const close = it === 'anklecuffs' ? o.ankleClose : 'none';
    const pull = it === 'bootcuffs' || close === 'elastic';
    const passNeed = it === 'anklecuffs' ? m.heelDiag : 0;
    let bandL = girth + (pull ? 0 : Math.max(0.5, k * 0.9));
    if (it === 'anklecuffs' && close === 'elastic') bandL = Math.max(girth * 1.3, passNeed / 1.6 * 1.05);
    const fold = cs === 'fold-over' || cs === 'cable knit' || it === 'anklecuffs';
    const band = strip(bandL, h * (fold ? 2 : 1) + (raw ? 0 : 0), { name: it === 'bootcuffs' ? 'Boot cuff' : 'Ankle cuff', cut: cs === 'faux fur' ? { fabric: 0, contrast: 2, note: 'faux fur, one per leg' } : { fabric: 2, note: fold ? 'folded lengthwise; ends joined into a loop' : 'one per leg' } });
    if (fold) band.marks.push({ type: 'fold', a: G.P(0, h), b: G.P(bandL, h), label: 'fold' });
    if (stretch || cs === 'cable knit') band.stretch = { a: G.P(bandL * 0.3, h * 0.5), b: G.P(bandL * 0.7, h * 0.5) };
    P.push(band);
    if (cs === 'ruffle' || cs === 'double ruffle' || cs === 'lace ruffle') {
      [0, cs === 'double ruffle' ? 1 : -1].filter(i => i >= 0).forEach(i => {
        const rh = h * (i ? 0.7 : 1), rl = bandL * 1.9;
        const r = strip(rl, rh + 0.5, { name: i ? 'Second ruffle' : 'Ruffle', cut: { fabric: 2, note: 'narrow-hem one long edge, gather the other to the cuff' } }, { top: 'seam', right: 'seam', bottom: 'hem', left: 'seam' });
        r.edges.hem = { kind: 'hem', sa: 0.3, label: 'narrow hem' };
        r.marks.push({ type: 'gather', pts: [G.P(0.2, 0.05), G.P(rl - 0.2, 0.05)], label: '' });
        P.push(r);
      });
    }
    if (cs === 'lace ruffle' || cs === 'lace') addNotion(out, 'lace', 'lace edging', 2, cm(Math.ceil(bandL * (cs === 'lace' ? 1.1 : 1.9))) + ' each');
    if (it === 'anklecuffs' && o.ankleBow) addNotion(out, 'ribbon', 'ribbon for the bows', 2, cm(Math.ceil(girth * 1.2)) + ' each');
    if (close === 'snap') addNotion(out, 'snap', 'snaps', 2);
    if (close === 'ribbon tie') addNotion(out, 'ribbon', 'narrow ribbon for the ties', 2, cm(Math.ceil(girth * 1.2)) + ' each');
    if (close === 'elastic') addNotion(out, 'elastic', 'narrow elastic', 2, cm(Math.ceil(girth + 0.6)) + ' each');
    if (it === 'bootcuffs' && !stretch && cs !== 'cable knit') out.notes.push('Boot cuffs in a woven fabric are cut ' + cm(bandL) + ' round so they slip over the boot top; a knit (sweater-knit, rib) hugs it better.');
    if (cs === 'cable knit') out.notes.push('Cable-knit look: cut the cuffs from an old sweater sleeve or cuff (put the ribbed edge at the fold), or from cable-knit jersey.');
    add('Make the cuff.', fold ? 'Join the short ends into a loop' + (pull ? '' : ' (leave them open for the closure)') + ', fold it in half lengthwise wrong sides together and baste the raw edges.' : 'Join the short ends into a loop.');
    if (cs === 'ruffle' || cs === 'double ruffle' || cs === 'lace ruffle') add('Add the ruffle' + (cs === 'double ruffle' ? 's' : '') + '.', 'Narrow-hem the ruffle' + (cs === 'lace ruffle' ? ' with the lace under it' : '') + ', gather it and sew it under the folded edge (stacked if two).');
    if (it === 'bootcuffs') add('Put them on.', 'Slip the cuff over the boot top so it sits just over the edge, fold side up' + (cs === 'fold-over' ? ', and fold it down over the boot.' : '.'));
    else add('Add the closure.', close === 'elastic' ? 'Thread elastic through the folded band before closing the loop.' : close === 'ribbon tie' ? 'Sew a ribbon to each end and tie it at the outer ankle.' : 'Overlap the ends and sew on the snap.' + (o.ankleBow ? ' Sew a small ribbon bow at the outer side.' : ''));
    out.plan.leg = { type: 'cuff', it, z, girth, h, cs, L };
    out.readout.size = 'cuff ' + cm(girth) + ' round, ' + cm(h) + ' high';
  }
  out.pieces.push(...P);
  out.flat = Object.assign({ kind: 'leg', item: it }, out.plan.leg || {});
}

function legFlat(out, F) {
  const m = legFootFor(out.m, out.o), o = out.o, L = F.L;
  const zMax = F.type === 'cover' ? Math.max(F.zTop, L.aH * 2) * 1.12 : Math.max(F.z + F.h, L.aH * 2.5) * 1.3;
  const legW = (z) => hoseCircAt(m, L, z) / Math.PI;
  const yOf = (z) => zMax - z;
  const zs = []; for (let i = 0; i <= 16; i++) zs.push(L.aH + (zMax - L.aH) * i / 16);
  // a stylised leg + foot in side view, the item drawn over it
  const FL = m.footLength, dA = m.ankleCirc / Math.PI, hL = m.heelLift || 0;
  const foot = G.spline([G.P(dA * 0.45, yOf(L.aH)), G.P(FL * 0.35, yOf(m.instepCirc / Math.PI * 0.85 + hL * 0.4)), G.P(FL * 0.8, yOf(m.footCirc / Math.PI * 0.5)), G.P(FL * 0.92, yOf(m.footCirc / Math.PI * 0.2)), G.P(FL * 0.8, yOf(0)), G.P(FL * 0.2, yOf(hL * 0.2)), G.P(-dA * 0.6, yOf(hL + L.aH * 0.15)), G.P(-dA * 0.55, yOf(L.aH * 0.8 + hL)), G.P(-dA * 0.45, yOf(L.aH))], 6);
  const backE = zs.map(z => G.P(-legW(z) * 0.45, yOf(z))), frontE = zs.map(z => G.P(legW(z) * 0.55, yOf(z)));
  const side = [ln(backE, 'flatd'), ln(frontE, 'flatd'), ln(foot, 'flatd')];
  const front = [ln(zs.map(z => G.P(-legW(z) / 2, yOf(z))), 'flatd'), ln(zs.map(z => G.P(legW(z) / 2, yOf(z))), 'flatd')];
  if (F.type === 'cover') {
    const zt = F.zTop, sel = zs.filter(z => z <= zt).concat([zt]).sort((a, b) => a - b);
    const bE = sel.map(z => G.P(-legW(z) * 0.5, yOf(z))).reverse(), fE = sel.map(z => G.P(legW(z) * 0.6, yOf(z)));
    const toeEnd = F.it === 'spats' ? FL * 0.5 : FL * 0.95;
    const footTop = G.spline([G.P(legW(L.aH) * 0.6, yOf(L.aH)), G.P(FL * 0.38, yOf(m.instepCirc / Math.PI * 0.9 + hL * 0.4)), G.P(toeEnd, yOf(F.it === 'spats' ? m.footCirc / Math.PI * 0.7 : m.footCirc / Math.PI * 0.25))], 6);
    const shape = bE.concat([G.P(-dA * 0.65, yOf(hL + L.aH * 0.1)), G.P(-dA * 0.2, yOf(hL * 0.4 + 0.1))]).concat([G.P(toeEnd * (F.it === 'spats' ? 0.85 : 0.95), yOf(0.12))]).concat(footTop.slice().reverse()).concat(fE);
    side.push(fl(shape));
    side.push(ln([G.P(-dA * 0.1, yOf(0.05)), G.P(FL * 0.45, yOf(0.05))], 'flatl'));        // strap under the foot
    if (F.opening) side.push(ln([G.P(-legW(zt) * 0.5, yOf(zt)), G.P(-legW(L.aH) * 0.5, yOf(L.aH + L.aH * 0.15))], o.spatClose === 'buttons' || o.bootClose === 'buttons' ? 'flatd' : 'flatl'));
    if (F.it === 'spats' && (o.spatClose === 'buttons')) for (let i = 0; i < 4; i++) { const z = L.aH * 1.1 + (zt - L.aH * 1.1) * (i + 0.5) / 4; side.push({ c: G.P(-legW(z) * 0.5 + 0.15, yOf(z)), r: Math.max(0.08, dA * 0.05), cls: 'flat' }); }
    const fw = m.footWidth / 2, wt = legW(zt) / 2;
    front.push(fl([G.P(-wt, yOf(zt))].concat(sel.map(z => G.P(-legW(z) / 2 * 1.05, yOf(z))).reverse(), [G.P(-fw * 1.05, yOf(0.2)), G.P(fw * 1.05, yOf(0.2))], sel.map(z => G.P(legW(z) / 2 * 1.05, yOf(z))), [G.P(wt, yOf(zt))])));
    if (o.bootTop === 'fold-down cuff' || o.bootTop === 'faux-fur trim') { const h = Math.max(0.6, L.kA * 0.14); front.push(fl([G.P(-wt * 1.1, yOf(zt)), G.P(wt * 1.1, yOf(zt)), G.P(wt * 1.1, yOf(zt) + h), G.P(-wt * 1.1, yOf(zt) + h)])); }
  } else {
    const z = F.z, w = legW(z) / 2 * 1.08, y0 = yOf(z + F.h * 0.5), y1 = yOf(z - F.h * 0.5);
    front.push(fl([G.P(-w, y0), G.P(w, y0), G.P(w, y1), G.P(-w, y1)]));
    if (F.cs === 'fold-over' || F.cs === 'cable knit') front.push(ln([G.P(-w, (y0 + y1) / 2), G.P(w, (y0 + y1) / 2)], 'flatl'));
    if (F.cs === 'cable knit') for (let i = 1; i < 4; i++) front.push(ln([G.P(-w + w * 2 * i / 4, y0), G.P(-w + w * 2 * i / 4, y1)], 'flatd'));
    if (F.cs === 'faux fur') { const p = []; for (let i = 0; i <= 12; i++) p.push(G.P(-w * 1.05 + w * 2.1 * i / 12, y1 + (i % 2 ? 0.2 : 0))); front.push(ln(p, 'flat')); }
    if (F.cs && F.cs.includes('ruffle')) {
      const frill = (y, dir, rh) => { const p = [], a = -w * 1.35, b = w * 1.35; for (let i = 0; i <= 12; i++) p.push(G.P(a + (b - a) * i / 12, y + dir * (rh - (i % 2 ? rh * 0.2 : 0)))); front.push(ln([G.P(-w, y)].concat(p, [G.P(w, y)]), 'flat')); };
      frill(y1, 1, F.h * 0.8);
      if (F.cs === 'double ruffle') frill(y0, -1, F.h * 0.55);
    }
    if (F.it === 'anklecuffs' && o.ankleBow) { const c = G.P(w * 0.9, (y0 + y1) / 2), s = F.h * 0.45; front.push(fl([c, G.P(c.x - s, c.y - s * 0.6), G.P(c.x - s, c.y + s * 0.6)]), fl([c, G.P(c.x + s, c.y - s * 0.6), G.P(c.x + s, c.y + s * 0.6)])); }
    side.push(fl([G.P(-legW(z) * 0.5, y0), G.P(legW(z) * 0.62, y0), G.P(legW(z) * 0.62, y1), G.P(-legW(z) * 0.5, y1)]));
  }
  return [{ label: 'SIDE', items: side }, { label: 'FRONT', items: front }];
}
