// ===================== SHAPE HELPERS =====================
// Small builders for the flat shapes accessories are made of: rectangles with rounded corners,
// trapezoids, ellipses, cone bands (flattened frustums), brims, crown gores, visors, strips.
// Every edge carries a tag so seam allowances and matching lengths can be resolved later.
function runsPiece(runs, opts) {
  const ol = new Outline();
  runs.forEach(r => ol.add(r.pts, r.tag));
  ol.close(runs[runs.length - 1].tag);
  const pc = pieceFromOutline(ol, Object.assign({}, opts || {}));
  if (!pc.grain) autoGrain(pc);
  return pc;
}
function autoGrain(pc, angleRad) {
  const b = G.bbox(pc.pts);
  const c = G.P(b.x0 + b.w * 0.5, b.y0 + b.h * 0.5);
  let L = Math.min(b.h * 0.5, Math.max(b.h * 0.3, 1.2));
  if (b.h < 1.2) L = b.h * 0.6;
  let a = G.P(c.x, c.y - L / 2), e = G.P(c.x, c.y + L / 2);
  if (angleRad) { a = G.rot(a, angleRad, c); e = G.rot(e, angleRad, c); }
  // keep the arrow inside the piece; shift sideways if the centre is outside (crescents, rings)
  if (!G.pointInPoly(c, pc.pts)) {
    for (let k = 1; k < 12; k++) {
      const yy = b.y0 + b.h * (k / 12);
      const xs = []; const pts = pc.pts;
      for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; if ((p.y - yy) * (q.y - yy) <= 0 && p.y !== q.y) xs.push(p.x + (q.x - p.x) * (yy - p.y) / (q.y - p.y)); }
      xs.sort((u, v) => u - v);
      if (xs.length >= 2) { const x = (xs[0] + xs[1]) / 2; const half = Math.min(L / 2, b.h * 0.25); a = G.P(x, yy - half); e = G.P(x, yy + half); if (G.pointInPoly(a, pts) && G.pointInPoly(e, pts)) break; }
    }
  }
  pc.grain = { a, b: e };
  return pc;
}
function strip(w, h, opts, tags) {
  const pc = rectPiece(w, h, tags || {}, Object.assign({}, opts || {}));
  autoGrain(pc);
  return pc;
}
// Polygon with optional fillets. edges[i] = { tag, pts? (interior points of a curved edge) } runs from
// verts[i] to verts[i+1]; radii[i] rounds the corner at verts[i]. The fillet arc takes the tag of the
// edge listed in arcTag[i] ('in' | 'out'), default: the non-'top' edge.
function roundedRuns(verts, edges, radii) {
  const n = verts.length;
  const full = edges.map((e, i) => [verts[i]].concat(e.pts || [], [verts[(i + 1) % n]]));
  const trimS = new Array(n).fill(null), trimE = new Array(n).fill(null), arcs = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const r = radii && radii[i] || 0;
    if (r < 0.01) continue;
    const inc = full[(i - 1 + n) % n], out = full[i];
    const V = verts[i];
    const Pp = inc[inc.length - 2], Nn = out[1];
    const d1 = G.norm(G.sub(Pp, V)), d2 = G.norm(G.sub(Nn, V));
    const cosA = Math.max(-0.999, Math.min(0.999, G.dot(d1, d2)));
    const ang = Math.acos(cosA) / 2;
    if (ang < 0.05 || ang > Math.PI / 2 - 0.02) continue;
    let t = r / Math.tan(ang);
    const maxT = Math.min(G.dist(Pp, V), G.dist(Nn, V)) * 0.98;
    let rr = r;
    if (t > maxT) { t = maxT; rr = t * Math.tan(ang); }
    const T1 = G.add(V, G.mul(d1, t)), T2 = G.add(V, G.mul(d2, t));
    const bis = G.norm(G.add(d1, d2));
    const C = G.add(V, G.mul(bis, rr / Math.sin(ang)));
    let a1 = Math.atan2(T1.y - C.y, T1.x - C.x), a2 = Math.atan2(T2.y - C.y, T2.x - C.x);
    let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const m = Math.max(4, Math.round(Math.abs(da) * rr * 4 + 4));
    const arc = []; for (let k = 0; k <= m; k++) arc.push(G.polar(C, a1 + da * k / m, rr));
    arcs[i] = arc; trimE[(i - 1 + n) % n] = T1; trimS[i] = T2;
  }
  const runs = [];
  for (let i = 0; i < n; i++) {
    let pts = full[i].slice();
    if (trimS[i]) pts[0] = trimS[i];
    if (trimE[i]) pts[pts.length - 1] = trimE[i];
    runs.push({ pts, tag: edges[i].tag });
    const j = (i + 1) % n;
    if (arcs[j]) {
      const tg = edges[j].tag === 'top' ? edges[i].tag : edges[i].tag === 'top' ? edges[j].tag : edges[j].tag;
      runs.push({ pts: arcs[j], tag: tg });
    }
  }
  // rotate so the run list starts with a non-arc segment start
  return runs;
}
// Bag panel: width w, height h; top edge narrower by `taper` each side; bottom corners rounded by rb,
// top corners by rt; topCurve > 0 dips the top (hobo / crescent), < 0 arches it (dome / frame);
// bottomCurve rounds the whole bottom into a half-moon. Edges: 'top' (opening) and 'side'.
function panelRuns(w, h, o) {
  o = o || {};
  const t = Math.min(o.taper || 0, w * 0.35);
  const TL = G.P(t, 0), TR = G.P(w - t, 0), BR = G.P(w, h), BL = G.P(0, h);
  let topPts = [];
  if (o.topCurve) { const k = 24; for (let i = 1; i < k; i++) { const u = i / k; topPts.push(G.P(TL.x + (TR.x - TL.x) * u, o.topCurve * Math.sin(Math.PI * u))); } }
  if (o.bottomCurve) {
    const pts = [];
    const k = 40, cx = w / 2;
    for (let i = 1; i < k; i++) { const a = Math.PI * i / k; pts.push(G.P(cx + (w / 2) * Math.cos(a), h * Math.sin(a))); }
    // top: TL→TR, then the half-moon curve TR → TL
    return roundedRuns([G.P(0, 0), G.P(w, 0)], [{ tag: 'top', pts: topPts }, { tag: 'side', pts }], [0, 0]);
  }
  const rb = Math.min(o.rb || 0, h * 0.48, w * 0.48);
  const rt = o.topCurve ? 0 : Math.min(o.rt || 0, h * 0.48, (w - 2 * t) * 0.48);
  return roundedRuns([TL, TR, BR, BL], [{ tag: 'top', pts: topPts }, { tag: 'side' }, { tag: o.bottomTag || 'side' }, { tag: 'side' }], [rt, rt, rb, rb]);
}
function ellipsePts(cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push(G.P(cx + rx * Math.cos(a), cy + ry * Math.sin(a))); }
  return out;
}
// ellipse whose perimeter is `circ`, with ratio ry/rx = k
function ellipseForCirc(circ, k = 1) {
  // Ramanujan: P ≈ π(a+b)(1 + 3h/(10+√(4−3h)))
  const f = (a) => { const b = a * k; const hh = Math.pow(a - b, 2) / Math.pow(a + b, 2); return Math.PI * (a + b) * (1 + 3 * hh / (10 + Math.sqrt(4 - 3 * hh))); };
  let lo = 0.01, hi = circ;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(mid) < circ) lo = mid; else hi = mid; }
  return { rx: lo, ry: lo * k };
}
function ellipsePiece(circ, k, tag, opts) {
  const { rx, ry } = ellipseForCirc(circ, k);
  const pts = ellipsePts(rx, ry, rx, ry, 64).slice(0, -1);
  const ol = new Outline(); ol.add(pts.concat([pts[0]]), tag); ol.close(tag);
  const pc = pieceFromOutline(ol, opts || {});
  autoGrain(pc);
  pc.ell = { rx, ry };
  return pc;
}
// Flattened cone band (frustum): circumference cTop at the top edge, cBot at the bottom edge,
// slant height s. Drawn as a half piece cut on fold (fold = centre front, one seam at centre back).
// Equal circumferences give a straight strip.
function coneBand(cTop, cBot, s, tags, opts) {
  tags = Object.assign({ top: 'top', bottom: 'bottom', cb: 'cb' }, tags || {});
  if (Math.abs(cTop - cBot) < 1e-3) {
    const half = cTop / 2;
    const pc = rectPiece(half, s, { top: tags.top, right: tags.cb, bottom: tags.bottom, left: 'fold' }, Object.assign({ cut: { fabric: 1, fold: true } }, opts || {}));
    pc.foldTag = 'fold'; autoGrain(pc);
    pc.band = { cTop, cBot, s, R0: Infinity, theta: 0 };
    return pc;
  }
  const inv = cTop > cBot; // wider at the top (flared)
  const cs = Math.min(cTop, cBot), cl = Math.max(cTop, cBot);
  const R1 = s * cl / (cl - cs), R0 = R1 - s;
  const theta = cl / R1; // full sweep
  const half = theta / 2;
  const n = Math.max(12, Math.round(half * 20));
  // apex at origin, centre line pointing down (+y); fold at the centre line, piece extends to the right
  const a0 = Math.PI / 2, a1 = Math.PI / 2 - half;
  const inner = G.arc(G.P(0, 0), R0, a0, a1, n), outer = G.arc(G.P(0, 0), R1, a1, a0, n);
  let runs = [
    { pts: inner, tag: inv ? tags.bottom : tags.top },
    { pts: [inner[inner.length - 1], outer[0]], tag: tags.cb },
    { pts: outer, tag: inv ? tags.top : tags.bottom },
    { pts: [outer[outer.length - 1], inner[0]], tag: 'fold' }
  ];
  if (inv) {
    // flip so the wide edge is on top
    runs = runs.map(r => ({ pts: r.pts.map(p => G.P(p.x, -p.y)), tag: r.tag }));
    runs = runs.reverse().map(r => ({ pts: r.pts.slice().reverse(), tag: r.tag }));
  }
  const pc = runsPiece(runs, Object.assign({ cut: { fabric: 1, fold: true } }, opts || {}));
  pc.foldTag = 'fold';
  // grain along the centre front (the fold)
  const b = G.bbox(pc.pts);
  const fx = 0.6;
  const yIn = inv ? -R1 : R0, yOut = inv ? -R0 : R1;
  pc.grain = { a: G.P(Math.min(fx, b.w * 0.3), Math.min(yIn, yOut) + s * 0.2), b: G.P(Math.min(fx, b.w * 0.3), Math.min(yIn, yOut) + s * 0.8) };
  pc.band = { cTop, cBot, s, R0, R1, theta };
  return pc;
}
// Brim: inner edge circumference cIn (sewn to the crown), outer edge cOut, width w (measured on the brim).
function brimPiece(cIn, cOut, w, opts, tags) {
  return coneBand(cIn, cOut, w, Object.assign({ top: 'crown', bottom: 'edge', cb: 'cb' }, tags || {}), opts);
}
// Crown gore: base width bw, height hh (along the surface, base to apex). shape 'dome' (sphere-like),
// 'full' (newsboy, puffs out), 'point' (straight sides).
function gorePiece(bw, hh, shape, opts) {
  const n = 24, R = [], L = [];
  for (let i = 0; i <= n; i++) {
    const y = hh * i / n, u = i / n;
    let w;
    if (shape === 'point') w = bw * (1 - u);
    else if (shape === 'full') w = bw * Math.cos(Math.PI / 2 * u) * (1 + 0.32 * Math.sin(Math.PI * u));
    else if (shape === 'flat') w = bw * Math.pow(Math.cos(Math.PI / 2 * u), 0.75);
    else w = bw * Math.cos(Math.PI / 2 * u);
    R.push(G.P(w / 2, -y)); L.push(G.P(-w / 2, -y));
  }
  const apex = G.P(0, -hh);
  const right = R.slice(0, -1).concat([apex]);
  const left = [apex].concat(L.slice(0, -1).reverse());
  const pc = runsPiece([
    { pts: [G.P(-bw / 2, 0), G.P(bw / 2, 0)], tag: 'band' },
    { pts: right, tag: 'gore' },
    { pts: left, tag: 'gore' }
  ], opts);
  pc.grain = { a: G.P(0, -hh * 0.2), b: G.P(0, -hh * 0.75) };
  return pc;
}
// Visor / peak: inner edge length innerL (sewn to the front of the band), depth d at centre front.
// headC: the band circumference — the inner edge follows the front of the head (a circle of that size,
// a little flatter); the outer edge bulges d in front of it and meets it in rounded tips.
function visorPiece(innerL, d, headC, opts) {
  const R = (headC || innerL * 2.5) / (2 * Math.PI) * 1.2;
  const span = Math.min(innerL / R, Math.PI * 0.95);
  const n = 32, inner = [], outer = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 - span / 2 + span * i / n; inner.push(G.P(R * Math.cos(a), R * Math.sin(a) + R)); }
  // outer: same centre, radius grows from R (at the tips) to R + d (centre front), tips rounded
  for (let i = n; i >= 0; i--) {
    const u = i / n, a = -Math.PI / 2 - span / 2 + span * u;
    const t = Math.sin(Math.PI * u);
    const rr = R + d * (0.1 + 0.9 * Math.pow(t, 0.55));
    outer.push(G.P(rr * Math.cos(a), rr * Math.sin(a) + R));
  }
  const pc = runsPiece([{ pts: inner, tag: 'band' }, { pts: outer, tag: 'edge' }], opts);
  const b = G.bbox(pc.pts);
  pc.grain = { a: G.P(-Math.min(innerL * 0.15, b.w * 0.2), -d * 0.45), b: G.P(Math.min(innerL * 0.15, b.w * 0.2), -d * 0.45) };
  return pc;
}
// "D" shape: straight bottom of length L whose arched top has arc length A (side crown of a
// trapper hat). Returns runs, or null when A is too short.
function dShapeHeight(L, A) {
  // semi-ellipse a = L/2, height b: half perimeter ≈ π/2·(3(a+b) − √((3a+b)(a+3b)))/2 … solve numerically
  const a = L / 2;
  const half = (b) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))) / 2;
  let lo = 0.01, hi = A;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (half(mid) < A) lo = mid; else hi = mid; }
  return lo;
}
// polygon area/perimeter helpers on pieces
function tagLen(pc, tag) { return edgeLength(pc, tag); }
function pieceSize(pc) { const b = G.bbox(pc.pts); return { w: b.w, h: b.h }; }
function shiftPiece(pc, dx, dy) { return transformPiece(pc, p => G.P(p.x + dx, p.y + dy)); }
// resample a run so curves are smooth
function smoothRun(pts, n) { return G.resample(pts, n || 24); }
