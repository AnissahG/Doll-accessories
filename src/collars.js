// ===================== COLLARS & CUFFS (detachable) =====================
// Worn over any garment. Flat collars are drafted in the "flat collar plane" (front and back
// necklines laid together at the shoulders): the neck edge is an arc of 88 % of a circle (the bit
// missing gives the collar its slight roll), radius = neckline length / sweep. CB is straight down,
// CF near the top. Peter Pan / pointed / scalloped collars are two halves (CB → CF); a Bertha is one
// piece on the fold at CF that opens at the back; a sailor collar is one piece on the fold at CB with
// a V-neck at the front. All attach to a bias band (with ties) or a neckband with a snap.

const COLLAR_SWEEP = Math.PI * 2 * 0.88;
function collarNeckLen(m, o) { return m.neckCirc * 1.06 + 0.3; }           // base of the neck, over a garment
function collarPt(rho, phi) { return G.P(rho * Math.sin(phi), rho * Math.cos(phi)); }
function arcPts(rho, a0, a1, n) { const p = []; for (let i = 0; i <= n; i++) p.push(collarPt(rho, a0 + (a1 - a0) * i / n)); return p; }
// parallel ribbon / topstitch line, set in from an open polyline toward a point
function insetLine(pts, d, toward) { return pts.map(p => { const v = G.sub(toward, p), l = G.len(v) || 1; return G.add(p, G.mul(v, Math.min(d / l, 0.45))); }); }

function collarNeckFinish(m, o, S, out, P, N, add) {
  // the collar's neck edge is bound; the binding runs on as ties, or a neckband closes with a snap
  const bw = Math.max(0.5, m.k * 0.8);
  if (o.collarFasten === 'neckband + snap') {
    const L = N + Math.max(0.6, bw * 1.3);
    const nb = strip(bw * 2, L, { name: 'Neckband', cut: { fabric: 1, interfacing: 1, note: 'folded lengthwise over the collar\'s neck edge' } });
    nb.marks.push({ type: 'fold', a: G.P(bw, 0), b: G.P(bw, L) });
    nb.marks.push({ type: 'line', cls: 'centre', pts: [G.P(0, L / 2), G.P(bw * 2, L / 2)], label: 'CF' });
    P.push(nb); addNotion(out, 'snap', 'snap ' + (HW.snap.filter(v => v / 10 <= bw * 1.1).pop() || 4) + ' mm', 1);
    add('Bind the neck edge with the neckband.', 'Sew the neckband to the collar\'s neck edge right sides together (centre marks matching), fold it over to the back, turn the edge under and slipstitch. Add the snap at the back so the band just meets round the doll\'s neck.');
  } else {
    const tie = o.collarFasten === 'ribbon ties' ? 0 : N * 0.45;
    const L = N + tie * 2;
    const b = strip(L, bw * 4, { name: o.collarFasten === 'ribbon ties' ? 'Neck binding' : 'Neck binding & ties', cut: { fabric: 1, bias: true, note: 'cut on the bias' + (tie ? '; the ends become the ties' : '') } });
    b.marks.push({ type: 'fold', a: G.P(0, bw * 2), b: G.P(L, bw * 2), label: 'fold' });
    if (tie) { b.marks.push({ type: 'notch', p: G.P(tie, 0), n: 1 }, { type: 'notch', p: G.P(L - tie, 0), n: 1 }); }
    P.push(b);
    if (!tie) addNotion(out, 'ribbon', 'narrow ribbon for the ties', 2, cm(Math.ceil(N * 0.5)) + ' each');
    add('Bind the neck edge.', 'Press the binding in half and the raw edges to the middle. Centre it on the collar\'s neck edge (notches at the back corners), sandwich the neck edge and edgestitch from one end to the other' + (tie ? ' — the overhanging ends become the ties.' : '. Sew a ribbon to each back corner.'));
  }
}

function buildCollar(m, o, S, out) {
  const P = [];
  out.plan.family = 'collar';
  out.used = ['neckCirc', 'neckToChin', 'shoulderWidth', 'acrossBack', 'napeToWaist', 'frontNeckToWaist', 'armholeDepth', 'wristCirc', 'handCirc', 'elbowCirc', 'shoulderToWrist', 'chestCirc'];
  const it = o.item, k = m.k;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  const N = collarNeckLen(m, o);
  const allLace = o.collarEdge === 'all lace';
  const twoLayer = !allLace;
  const cutQ = (n, mirrored) => allLace ? { fabric: n, mirrored, note: 'single layer of wide lace — place the scalloped lace edge on the outer edge' } : { fabric: n * 2, mirrored, interfacing: o.interfacing === 'fusible' ? n : 0, note: 'top collar + under collar' };
  const outerEdge = allLace ? { kind: 'none', label: 'lace edge' } : { kind: 'seam' };
  add('Cut the pieces.', allLace ? 'Cut the collar from wide lace with the finished scalloped edge on the outer edge — it needs no seam allowance there.' : 'Cut a top and an under collar of every collar piece' + (o.interfacing === 'fusible' ? ', and interface the top collar' : '') + '. Fine cotton, lawn or poplin sits best at doll scale.');
  if (it === 'flatcollar') {
    const shape = o.collarShape;
    const r = N / COLLAR_SWEEP;
    const W = +o.collarW > 0 ? +o.collarW : shape === 'Bertha' ? Math.max(m.shoulderWidth * 1.15, m.armholeDepth * 0.85) : Math.max(0.8, m.neckCirc * 0.19);
    const R = r + W, aCF = COLLAR_SWEEP / 2, n = 28;
    let outer, piece;
    if (shape === 'Bertha') {
      // one piece on the fold at CF, opening at CB (round outer edge, covers the shoulders)
      const ol = new Outline();
      ol.add([collarPt(R, 0), collarPt(r, 0)], 'cb');
      ol.add(arcPts(r, 0, aCF, n), 'neck');
      ol.add([collarPt(r, aCF), collarPt(R, aCF)], 'fold');
      outer = arcPts(R, aCF, 0, n);
      ol.add(outer, 'outer');
      ol.close('outer');
      piece = pieceFromOutline(ol, { name: 'Bertha collar', cut: Object.assign(cutQ(1, false), { fold: true }) });
      piece.foldTag = 'fold'; piece.edges.fold = { kind: 'fold' };
    } else {
      // half collar CB → CF; the CF end is rounded, pointed or (scalloped) rounded
      const fr = Math.min(W * 0.85, R * 0.4);
      const aEnd = aCF - fr / R;
      if (shape === 'scalloped') {
        const nS = Math.max(3, Math.round(R * aEnd / Math.max(0.6, W * 0.75)));
        outer = []; for (let i = 0; i <= nS * 8; i++) { const t = i / (nS * 8), ph = aEnd * t; const s = Math.abs(Math.sin(Math.PI * nS * t)); outer.push(collarPt(r + W * (0.8 + 0.2 * Math.sqrt(s)), ph)); }
      } else outer = arcPts(R, 0, aEnd, n);
      let end;
      const neckCF = collarPt(r, aCF);
      if (shape === 'pointed') {
        const tip = collarPt(R + W * 0.08, aCF + (W * 0.45) / R);
        end = [outer[outer.length - 1], tip, neckCF];
      } else {
        const a = outer[outer.length - 1], dirCF = G.norm(G.sub(collarPt(R, aCF), neckCF));
        end = G.bez(a, collarPt(R, aCF), G.add(neckCF, G.mul(dirCF, W * 0.75)), neckCF, 12);
      }
      const ol = new Outline();
      ol.add([collarPt(R * (shape === 'scalloped' ? (r + W * 0.8) / R : 1), 0), collarPt(r, 0)], 'cb');
      ol.add(arcPts(r, 0, aCF, n), 'neck');
      ol.add(end.slice().reverse(), 'outer');
      ol.add(outer.slice().reverse(), 'outer');
      ol.close('outer');
      piece = pieceFromOutline(ol, { name: { round: 'Peter Pan collar', pointed: 'Pointed collar', scalloped: 'Scalloped collar' }[shape] || 'Collar', cut: cutQ(2, true) });
      piece.edges.cb = twoLayer ? { kind: 'seam' } : { kind: 'hem', sa: 0.3, label: 'narrow hem' };
    }
    piece.edges.neck = { kind: 'seam', label: 'bound' }; piece.edges.outer = outerEdge;
    piece.marks.push({ type: 'notch', p: collarPt(r, Math.PI / 2 * 0.95), n: 1 });
    piece.marks.push({ type: 'text', p: G.add(collarPt(r, Math.PI / 2 * 0.95), G.P(0.3, 0.5)), text: 'shoulder', small: true });
    if (o.collarEdge === 'lace edging' || o.collarEdge === 'ruffle edge' || o.collarEdge === 'piping') {
      const edgeLen = G.plen(outer) * (shape === 'Bertha' ? 2 : 2) + (shape === 'Bertha' ? 0 : W * 2);
      if (o.collarEdge === 'ruffle edge') {
        const rh = Math.max(0.5, W * 0.35);
        const rf = strip(edgeLen * 1.8, rh * 2, { name: 'Edge frill', cut: { fabric: 1, note: 'folded lengthwise, gathered into the outer seam' } });
        rf.marks.push({ type: 'fold', a: G.P(0, rh), b: G.P(edgeLen * 1.8, rh), label: 'fold' });
        P.push(rf);
      } else addNotion(out, o.collarEdge === 'piping' ? 'piping' : 'lace', o.collarEdge === 'piping' ? 'mini piping (or a folded bias strip)' : 'narrow lace edging', 1, cm(Math.ceil(edgeLen * (o.collarEdge === 'lace edging' ? 1.1 : 1.05))));
      out.plan.edgeLen = edgeLen;
    }
    P.push(piece);
    if (twoLayer) add('Make the collar.', (o.collarEdge === 'lace edging' || o.collarEdge === 'ruffle edge' || o.collarEdge === 'piping' ? 'Baste the ' + (o.collarEdge === 'ruffle edge' ? 'gathered frill' : o.collarEdge) + ' to the outer edge of the top collar, raw edges together. ' : '') + 'Place top and under collar right sides together, stitch round the outer edge' + (shape === 'Bertha' ? ' and the two back edges' : ' and the back end') + ', leaving the neck edge open. Trim, clip the curves (notch the outside curves), turn, press — roll the seam slightly to the underside.');
    else add('Finish the back edges.', 'Turn the back edges under twice and stitch; lace usually needs no other finishing.');
    out.readout.size = (shape === 'Bertha' ? 'Bertha' : 'collar') + ' ' + cm(W) + ' wide, neck ' + cm(N);
    out.plan.collar = { shape, r, W, R, N };
    collarNeckFinish(m, o, S, out, P, N, add);
  } else if (it === 'sailorcollar') {
    const r = N / COLLAR_SWEEP, aCF = COLLAR_SWEEP / 2;
    const D = +o.collarW > 0 ? +o.collarW : m.napeToWaist * 0.42;           // depth of the back flap
    const hw = m.acrossBack * 0.48;
    const Wsh = m.shoulderWidth * 0.95;
    const Vd = m.frontNeckToWaist * 0.36;
    const aS = Math.PI / 2 * 1.05;                                         // the V starts at the side of the neck
    const S0 = collarPt(r + Wsh, Math.PI / 2 * 1.02);
    const V = collarPt(r + Vd, aCF);
    const ol = new Outline();
    ol.add([collarPt(r + D, 0), collarPt(r, 0)], 'fold');
    ol.add(arcPts(r, 0, aS, 18), 'neck');
    ol.add([collarPt(r, aS), V], 'vneck');
    const outerPts = [V, S0, G.P(Math.max(hw, S0.x * 0.9), r + D * 0.25), G.P(Math.max(hw, S0.x * 0.9), r + D), G.P(0, r + D)];
    ol.add(outerPts, 'outer');
    ol.close('fold');
    const pc = pieceFromOutline(ol, { name: 'Sailor collar', cut: Object.assign(cutQ(1, false), { fold: true }) });
    pc.foldTag = 'fold'; pc.edges.fold = { kind: 'fold' }; pc.edges.neck = { kind: 'seam', label: 'bound' }; pc.edges.vneck = { kind: 'seam' }; pc.edges.outer = outerEdge;
    const stripes = +o.sailorStripes || 0;
    const sw = Math.max(0.15, k * 0.25);
    for (let i = 0; i < stripes; i++) {
      const d = Math.max(0.35, k * 0.6) + i * sw * 2.2;
      const ctr = G.P(0, r + D * 0.3);
      pc.marks.push({ type: 'line', cls: 'place', pts: insetLine(outerPts.slice(1), d, ctr), label: i === 0 ? 'ribbon' : '' });
    }
    if (stripes) addNotion(out, 'ribbon', 'flat ribbon / braid ' + fmt(sw * 10, 0) + ' mm for the stripes', stripes, cm(Math.ceil(G.plen(outerPts.slice(1)) * 2 + 2)) + ' each');
    pc.marks.push({ type: 'dot', kind: 'dot', p: G.lerp(collarPt(r, aS), V, 0.98), label: 'V point' });
    P.push(pc);
    if (o.sailorBow) {
      const bl = m.frontNeckToWaist * 0.9, bwid = Math.max(0.8, m.k * 1.6);
      const bow = strip(bl, bwid * 2, { name: 'Sailor tie', cut: { fabric: 1, bias: true, note: 'folded lengthwise, stitched, turned; knotted or tied at the V' } });
      bow.marks.push({ type: 'fold', a: G.P(0, bwid), b: G.P(bl, bwid), label: 'fold' });
      P.push(bow);
    }
    if (stripes) add('Stitch the stripes.', 'Edgestitch the ribbon along the placement lines on the top collar before assembling; mitre it at the corners.');
    if (twoLayer) add('Make the collar.', 'Top and under collar right sides together: stitch the outer edge from V point to V point. Trim, clip, turn and press. Stitch the V edges of top and under collar together.');
    out.readout.size = 'back flap ' + cm(D) + ' deep, V ' + cm(Vd) + ' below the neck';
    out.plan.collar = { shape: 'sailor', r, D, hw, Vd, Wsh, stripes, N };
    collarNeckFinish(m, o, S, out, P, N, add);
    if (o.sailorBow) add('Make the sailor tie.', 'Fold, stitch and turn the tie; slip it under the collar at the V and knot it, or sew a small loop at the V to hold it.');
  } else if (it === 'rufflecollar') {
    const tiers = Math.max(1, Math.min(3, +o.ruffleTiers || 1));
    const H = +o.collarW > 0 ? +o.collarW : Math.max(0.8, m.neckToChin * 0.85);
    for (let i = 0; i < tiers; i++) {
      const h = H * (1 - i * 0.22), L = N * (o.ruffleFull === 'full' ? 2.6 : 2);
      const rf = strip(L, h * 2, { name: tiers > 1 ? 'Ruffle tier ' + (i + 1) : 'Ruffle', cut: { fabric: 1, note: 'folded lengthwise (no hem), gathered to the neck length' } });
      rf.marks.push({ type: 'fold', a: G.P(0, h), b: G.P(L, h), label: 'fold' });
      rf.marks.push({ type: 'gather', pts: [G.P(0.2, 0.05), G.P(L - 0.2, 0.05)], label: '' });
      P.push(rf);
    }
    if (o.collarEdge === 'lace edging') addNotion(out, 'lace', 'narrow lace for the ruffle edge', tiers, cm(Math.ceil(N * 2.2)) + ' each');
    add('Make the ruffle' + (tiers > 1 ? 's' : '') + '.', 'Fold each strip in half lengthwise (wrong sides together) and press — the fold is the finished edge' + (o.collarEdge === 'lace edging' ? ' (sew the lace under it first, or use a single layer with the lace edge)' : '') + '. Gather the raw edges to ' + cm(N) + '.' + (tiers > 1 ? ' Stack the tiers, widest at the bottom, and baste them together.' : ''));
    out.readout.size = 'ruffle ' + cm(H) + ' deep, neck ' + cm(N);
    out.plan.collar = { shape: 'ruffle', H, tiers, N };
    collarNeckFinish(m, o, S, out, P, N, add);
  } else if (it === 'shirtcollar') {
    // false shirt collar: stand + collar on the fold at CB, closes at CF
    const hs = Math.max(0.45, m.neckToChin * 0.5), ext = Math.max(0.4, k * 0.7);
    const Ls = N / 2;
    const rise = hs * 0.3;
    const ol = new Outline();
    const bot = G.bez(G.P(0, 0), G.P(Ls * 0.45, 0), G.P(Ls * 0.85, -rise * 0.4), G.P(Ls, -rise), 10);
    const topL = G.bez(G.P(Ls - hs * 0.12, -rise - hs), G.P(Ls * 0.8, -rise * 0.4 - hs), G.P(Ls * 0.4, -hs), G.P(0, -hs), 10);
    const front = G.bez(G.P(Ls, -rise), G.P(Ls + ext, -rise - 0.05), G.P(Ls + ext, -rise - hs * 0.8), G.P(Ls - hs * 0.12, -rise - hs), 10);
    ol.add(bot, 'neck'); ol.add(front, 'edge'); ol.add(topL, 'top'); ol.close('fold');
    const stand = pieceFromOutline(ol, { name: 'Collar stand', cut: { fabric: 2, fold: true, interfacing: 1, note: 'outer + inner stand' } });
    stand.foldTag = 'fold'; stand.edges.fold = { kind: 'fold' }; stand.edges.neck = { kind: 'seam' }; stand.edges.edge = { kind: 'seam' }; stand.edges.top = { kind: 'seam' };
    stand.marks.push({ type: 'buttonhole', p: G.P(Ls + ext * 0.45, -rise - hs * 0.5), vertical: false, len: Math.min(0.5, hs * 0.6) });
    stand.marks.push({ type: 'line', cls: 'centre', pts: [G.P(Ls, -rise), G.P(Ls - 0.05, -rise - hs)], label: 'CF' });
    stand.grain = { a: G.P(0.3, -hs * 0.2), b: G.P(0.3, -hs * 0.8) };
    const Lc = G.plen(topL), hc = +o.collarW > 0 ? +o.collarW : hs * 1.55;
    const pt = o.shirtPoint;
    const spread = pt === 'rounded' ? hc * 0.25 : pt === 'button-down' ? hc * 0.45 : hc * 0.6;
    const c2 = new Outline();
    const inner = G.bez(G.P(0, 0), G.P(Lc * 0.5, 0), G.P(Lc * 0.85, rise * 0.25), G.P(Lc, rise * 0.4), 10);
    c2.add(inner, 'top');
    const tip = G.P(Lc + spread, rise * 0.4 - hc * 1.02);
    if (pt === 'rounded') c2.add(G.bez(G.P(Lc, rise * 0.4), G.P(Lc + spread * 1.4, rise * 0.2 - hc * 0.3), G.P(Lc + spread, -hc * 0.95), G.P(Lc - hc * 0.2, -hc), 10), 'outer');
    else c2.add([G.P(Lc, rise * 0.4), tip], 'outer');
    c2.add(G.bez(c2.last(), G.P(Lc * 0.6, -hc * 1.02), G.P(Lc * 0.3, -hc), G.P(0, -hc), 10), 'outer');
    c2.close('fold');
    const leaf = pieceFromOutline(c2, { name: 'Collar', cut: { fabric: 2, fold: true, interfacing: 1, note: 'top collar + under collar' } });
    leaf.foldTag = 'fold'; leaf.edges.fold = { kind: 'fold' }; leaf.edges.top = { kind: 'seam', label: 'joins the stand' }; leaf.edges.outer = { kind: 'seam' };
    leaf.grain = { a: G.P(0.3, -hc * 0.2), b: G.P(0.3, -hc * 0.8) };
    if (pt === 'button-down') { leaf.marks.push({ type: 'dot', kind: 'button', p: G.lerp(G.P(Lc, rise * 0.4), tip, 0.75), label: 'button-down' }); addNotion(out, 'button', 'tiny buttons for the collar points', 2); }
    P.push(stand, leaf);
    addNotion(out, 'button', 'button (or a snap) for the stand', 1);
    add('Make the collar.', 'Interface the top collar. Stitch top and under collar together round the outer edge, trim the points, turn, press and edgestitch.');
    add('Attach the stand.', 'Sandwich the collar between the two stands (notches and CB matching), stitch along the top edge and round the front ends. Turn, press.');
    add('Finish the neck edge.', 'Turn the inner stand\'s neck edge under and slipstitch it over the outer one — or bind it. Make the buttonhole on the right end and sew the button on the left (or use a snap).');
    out.readout.size = 'stand ' + cm(hs) + ', collar ' + cm(hc) + ' deep, neck ' + cm(N);
    out.plan.collar = { shape: 'shirt', hs, hc, Ls, N, pt, spread };
  } else if (it === 'dickey') {
    // a false shirt front (bib) with a collar; back opens at CB
    const nw = m.neckCirc / Math.PI / 2 * 1.05, nd = m.neckCirc * 0.14, ndb = nd * 0.22;
    const bw = m.acrossFront * 0.47, D = m.frontNeckToWaist * 0.55, Db = m.napeToWaist * 0.32;
    const shL = m.shoulderWidth * 0.55, slope = shL * 0.3;
    const mkBib = (front) => {
      const depth = front ? D : Db, ndp = front ? nd : ndb, ol = new Outline();
      const SP = G.P(nw + shL, slope);
      ol.add(G.bez(G.P(0, ndp), G.P(nw * 0.55, ndp), G.P(nw, ndp * 0.4), G.P(nw, 0), 8), 'neck');
      ol.add([G.P(nw, 0), SP], 'shoulder');
      ol.add(G.spline([SP, G.P(bw * 0.97, slope + depth * 0.35), G.P(bw * 0.92, depth * 0.85), G.P(bw * 0.75, depth)], 6), 'edge');
      ol.add(G.qbez(G.P(bw * 0.75, depth), G.P(bw * 0.2, depth * (front && o.dickeyFront !== 'straight' ? 1.08 : 1)), G.P(0, depth * (front && o.dickeyFront !== 'straight' ? 1.08 : 1)), 8), 'edge');
      ol.close(front ? 'fold' : 'cb');
      const pc = pieceFromOutline(ol, { name: front ? 'Dickey front' : 'Dickey back', cut: front ? { fabric: 2, fold: true, note: 'outer + facing' } : { fabric: 4, mirrored: true, note: 'outer + facing, 2 mirrored pairs' } });
      if (front) { pc.foldTag = 'fold'; pc.edges.fold = { kind: 'fold' }; } else pc.edges.cb = { kind: 'seam', label: 'opening (snaps)' };
      pc.edges.edge = { kind: 'seam' }; pc.edges.shoulder = { kind: 'seam' }; pc.edges.neck = { kind: 'seam' };
      pc.grain = { a: G.P(Math.min(0.6, nw * 0.5), ndp + 0.4), b: G.P(Math.min(0.6, nw * 0.5), depth * 0.85) };
      return pc;
    };
    const F = mkBib(true), B = mkBib(false);
    if (o.dickeyFront === 'mock placket') { const pw = Math.max(0.5, k * 0.9); F.marks.push({ type: 'line', cls: 'topstitch', pts: [G.P(pw, nd), G.P(pw, D * 0.98)], label: 'placket' }); for (let i = 0; i < 3; i++) F.marks.push({ type: 'dot', kind: 'button', p: G.P(0.05, nd + (D - nd) * (0.2 + i * 0.3)), label: i ? '' : 'buttons' }); addNotion(out, 'button', 'tiny buttons (decorative)', 3); }
    if (o.dickeyFront === 'pintucks') for (let i = 0; i < 3; i++) { const x = Math.max(0.4, k * 0.6) * (i + 1); F.marks.push({ type: 'fold', a: G.P(x, nd + 0.2), b: G.P(x, D * 0.95), label: i ? '' : 'tuck' }); }
    if (o.dickeyFront === 'jabot ruffles') { const L = (D - nd) * 1.8, h = Math.max(0.6, bw * 0.3); const jr = strip(L, h * 2, { name: 'Jabot ruffle', cut: { fabric: 2, note: 'folded lengthwise, gathered down the centre front, one each side' } }); jr.marks.push({ type: 'fold', a: G.P(0, h), b: G.P(L, h), label: 'fold' }); P.push(jr); }
    P.push(F, B);
    // collar
    const neckLen = 2 * (G.plen(G.bez(G.P(0, nd), G.P(nw * 0.55, nd), G.P(nw, nd * 0.4), G.P(nw, 0), 8)) + G.plen(G.bez(G.P(0, ndb), G.P(nw * 0.55, ndb), G.P(nw, ndb * 0.4), G.P(nw, 0), 8)));
    if (o.dickeyCollar === 'Peter Pan') {
      const r = neckLen / COLLAR_SWEEP, W = Math.max(0.8, m.neckCirc * 0.17), R = r + W, aCF = COLLAR_SWEEP / 2;
      const outer = arcPts(R, 0, aCF - W * 0.85 / R, 24), neckCF = collarPt(r, aCF);
      const end = G.bez(outer[outer.length - 1], collarPt(R, aCF), G.add(neckCF, G.mul(G.norm(G.sub(collarPt(R, aCF), neckCF)), W * 0.75)), neckCF, 10);
      const ol = new Outline(); ol.add([collarPt(R, 0), collarPt(r, 0)], 'cb'); ol.add(arcPts(r, 0, aCF, 24), 'neck'); ol.add(end.slice().reverse(), 'outer'); ol.add(outer.slice().reverse(), 'outer'); ol.close('outer');
      const c = pieceFromOutline(ol, { name: 'Peter Pan collar', cut: { fabric: 4, mirrored: true, note: 'top + under collar' } });
      c.edges.cb = { kind: 'seam' }; c.edges.outer = { kind: 'seam' }; c.edges.neck = { kind: 'seam' };
      P.push(c);
    } else if (o.dickeyCollar === 'shirt collar') {
      const hc = Math.max(0.6, m.neckToChin * 0.75), L = neckLen / 2;
      const c = new Outline(); c.add([G.P(0, 0), G.P(L, 0)], 'neck'); c.add([G.P(L, 0), G.P(L + hc * 0.55, -hc)], 'outer'); c.add([G.P(L + hc * 0.55, -hc), G.P(0, -hc)], 'outer'); c.close('fold');
      const cp = pieceFromOutline(c, { name: 'Shirt collar (one-piece)', cut: { fabric: 2, fold: true, interfacing: 1, note: 'top + under collar' } });
      cp.foldTag = 'fold'; cp.edges.fold = { kind: 'fold' }; cp.edges.outer = { kind: 'seam' };
      cp.grain = { a: G.P(0.3, -hc * 0.2), b: G.P(0.3, -hc * 0.8) };
      P.push(cp);
    }
    // ties under the arms
    const tl = m.chestCirc * 0.35, tw = Math.max(0.35, k * 0.5);
    const t = strip(tl, tw * 2, { name: 'Side tie', cut: { fabric: 4, note: '2 on the front, 2 on the back — tied under the arms' } });
    t.marks.push({ type: 'fold', a: G.P(0, tw), b: G.P(tl, tw), label: 'fold' });
    P.push(t);
    addNotion(out, 'snap', 'snaps for the back opening', 2);
    out.notes.push('The back opens all the way down: put the dickey on from the front like a bib and close the snaps at the back of the neck — nothing has to go over the head.');
    add('Prepare the front.', o.dickeyFront === 'pintucks' ? 'Fold and stitch the pintucks along the tuck lines, press them toward the sides.' : o.dickeyFront === 'mock placket' ? 'Topstitch the mock placket line and sew on the little buttons.' : o.dickeyFront === 'jabot ruffles' ? 'Fold the ruffles lengthwise, gather them and baste them down the centre front, one on each side.' : 'Press the front; it stays plain.');
    add('Sew the shoulders.', 'Sew the front to the backs at the shoulders, and the facings the same way.');
    if (o.dickeyCollar !== 'none') add('Make and attach the collar.', 'Stitch top and under collar together round the outer edge, trim, turn, press. Baste it to the neckline of the dickey, matching CF and the shoulders.');
    add('Face the dickey.', 'Lay the facing over the dickey right sides together (collar sandwiched), slip the ties in at the lower side corners, and stitch all round leaving a turning gap at the hem. Clip, turn, press, close the gap. Add snaps down the back opening.');
    out.readout.size = 'front ' + cm(D) + ' deep, ' + cm(bw * 2) + ' wide';
    out.plan.collar = { shape: 'dickey', nw, nd, bw, D, Db, collar: o.dickeyCollar, front: o.dickeyFront };
  } else if (it === 'cuffs') {
    const cs = o.cuffStyle;
    const over = Math.max(0.3, m.wristCirc * 0.12) + 0.3;                    // over a sleeve
    const pull = o.cuffClose === 'elastic (pull-on)';
    const ov = pull || o.cuffClose === 'ribbon tie' ? 0 : Math.max(0.5, k * 0.9);
    let C = m.wristCirc + over;
    if (pull) C = Math.max(C * 1.25, m.handCirc * 1.05);
    const h = +o.cuffH > 0 ? +o.cuffH : Math.max(0.8, m.shoulderToWrist * (cs === 'flared gauntlet' ? 0.22 : cs === 'French (fold-back)' ? 0.11 : 0.1));
    const lined = !pull;
    if (cs === 'flared gauntlet') {
      const forearm = m.shoulderToWrist - m.shoulderToElbow;
      const Ctop = m.wristCirc + (m.elbowCirc - m.wristCirc) * Math.min(1, h / Math.max(1, forearm)) + over + h * 0.35;
      const g = coneBand(Ctop + ov, C + ov, h, { top: 'top', bottom: 'bottom', cb: 'cb' }, { name: 'Gauntlet cuff', cut: { fabric: 4, fold: true, note: 'outer + lining, 2 each (one pair of cuffs)' } });
      g.edges.top = { kind: 'seam' }; g.edges.bottom = { kind: 'seam' }; g.edges.cb = { kind: 'seam', label: 'opening' };
      P.push(g);
    } else {
      const hh = cs === 'French (fold-back)' ? h * 2 : h;
      const c = strip(C + ov, hh * (lined ? 2 : 1) + (pull ? Math.max(0.6, k * 0.8) : 0), { name: cs === 'lolita wrist cuff' ? 'Wrist cuff' : 'Cuff', cut: { fabric: 2, interfacing: lined && o.interfacing === 'fusible' ? 2 : 0, note: lined ? 'folded lengthwise (self-lined)' : 'casing for the elastic along one edge' } });
      if (lined) c.marks.push({ type: 'fold', a: G.P(0, hh), b: G.P(C + ov, hh), label: 'fold' });
      if (cs === 'French (fold-back)') c.marks.push({ type: 'fold', a: G.P(0, h), b: G.P(C + ov, h), label: 'turn back' });
      P.push(c);
    }
    if (cs === 'ruffle' || cs === 'lolita wrist cuff') {
      const rh = Math.max(0.5, h * (cs === 'ruffle' ? 0.9 : 0.6)), L = C * 2;
      const rf = strip(L, rh * 2, { name: 'Cuff ruffle', cut: { fabric: cs === 'lolita wrist cuff' ? 4 : 2, note: cs === 'lolita wrist cuff' ? 'two per cuff — one each edge' : 'folded lengthwise, gathered to the cuff' } });
      rf.marks.push({ type: 'fold', a: G.P(0, rh), b: G.P(L, rh), label: 'fold' });
      P.push(rf);
    }
    if (o.collarEdge === 'lace edging') addNotion(out, 'lace', 'lace edging for the cuffs', 2, cm(Math.ceil(C * (cs === 'ruffle' ? 2 : 1.1))) + ' each');
    if (cs === 'lolita wrist cuff') addNotion(out, 'ribbon', 'ribbon for the bows', 2, cm(Math.ceil(C * 1.2)) + ' each');
    if (pull) addNotion(out, 'elastic', 'narrow elastic', 2, cm(Math.ceil(m.wristCirc * 1.05 + 0.6)) + ' each');
    else if (o.cuffClose === 'snap') addNotion(out, 'snap', 'snaps', 2);
    else if (o.cuffClose === 'button') addNotion(out, 'button', 'tiny buttons', 2);
    else addNotion(out, 'ribbon', 'narrow ribbon for the ties', 2, cm(Math.ceil(C * 1.1)) + ' each');
    add('Make the cuffs.', cs === 'flared gauntlet' ? 'Stitch outer and lining right sides together along the top, bottom and opening edges, leaving a gap; clip, turn, press, close the gap.' : pull ? 'Turn a casing along one edge, thread the elastic, join the ends into a loop.' : 'Fold each cuff lengthwise right sides together, stitch the short ends, turn and press.' + (cs === 'French (fold-back)' ? ' Turn the cuff back along the "turn back" line when worn.' : ''));
    if (cs === 'ruffle' || cs === 'lolita wrist cuff') add('Add the ruffle' + (cs === 'lolita wrist cuff' ? 's' : '') + '.', 'Fold, gather and sew the ruffle' + (cs === 'lolita wrist cuff' ? 's to both long edges' : ' to the lower edge') + ' of the cuff, raw edges inside.' + (cs === 'lolita wrist cuff' ? ' Sew a small ribbon bow to the centre.' : ''));
    if (!pull) add('Add the closure.', o.cuffClose === 'ribbon tie' ? 'Sew a ribbon to each end of the cuff and tie it in a bow round the wrist.' : 'Overlap the ends by ' + cm(ov) + ' and sew on the ' + (o.cuffClose === 'button' ? 'button and buttonhole' : 'snap') + '. The cuff goes on over the sleeve.');
    out.readout.size = 'cuff ' + cm(C) + ' round, ' + cm(h) + ' high';
    out.plan.collar = { shape: 'cuffs', C, h, cs };
  }
  out.pieces.push(...P);
  out.flat = Object.assign({ kind: 'collar', item: it }, out.plan.collar || {});
}

function collarFlat(out, F) {
  const m = out.m, o = out.o;
  const T = torso(m, false);
  const top = T.filter(p => p.y <= m.armholeDepth * 1.6);
  const nw = m.neckCirc / Math.PI / 2;
  const views = [];
  if (F.shape === 'cuffs') {
    const w = m.wristCirc / Math.PI, h = F.h, C = F.C / Math.PI;
    const arm = [G.P(-w / 2 * 1.4, -h * 2.2), G.P(-w / 2, h * 1.6), G.P(w / 2, h * 1.6), G.P(w / 2 * 1.4, -h * 2.2)];
    const items = [ln(arm, 'flatd')];
    const cw = C / 2, ctw = F.cs === 'flared gauntlet' ? cw * 1.4 : cw;
    items.push(fl([G.P(-ctw, 0), G.P(ctw, 0), G.P(cw, h), G.P(-cw, h)]));
    if (F.cs === 'French (fold-back)') items.push(ln([G.P(-cw, h * 0.5), G.P(cw, h * 0.5)]));
    if (F.cs === 'ruffle' || F.cs === 'lolita wrist cuff') {
      // gathered frill hanging from the cuff edge: flared sides, wavy free edge, gather lines
      const rh = h * (F.cs === 'ruffle' ? 0.8 : 0.5);
      const frill = (y0, dir) => {
        const a = -cw * 1.3, b = cw * 1.3, yb = y0 + dir * rh, wave = [];
        for (let i = 0; i <= 10; i++) wave.push(G.P(a + (b - a) * i / 10, yb - dir * (i % 2 ? rh * 0.2 : 0)));
        items.push(ln([G.P(-cw, y0)].concat(wave, [G.P(cw, y0)]), 'flat'));
        for (let i = 1; i < 6; i++) { const x0 = -cw + cw * 2 * i / 6, x1 = a + (b - a) * i / 6; items.push(ln([G.P(x0, y0), G.P(x1, yb - dir * rh * 0.3)], 'flatd')); }
      };
      frill(h, 1);
      if (F.cs === 'lolita wrist cuff') {
        frill(0, -1);
        const bs = Math.min(cw * 0.45, h * 0.38), cy = h / 2;   // small bow in the middle of the cuff
        items.push(fl([G.P(0, cy), G.P(-bs, cy - bs * 0.6), G.P(-bs, cy + bs * 0.6)]), fl([G.P(0, cy), G.P(bs, cy - bs * 0.6), G.P(bs, cy + bs * 0.6)]));
        items.push(ln([G.P(-bs * 0.15, cy), G.P(-bs * 0.5, cy + bs * 1.3)], 'flat'), ln([G.P(bs * 0.15, cy), G.P(bs * 0.45, cy + bs * 1.35)], 'flat'));
      }
    }
    if (o.cuffClose === 'button' || o.cuffClose === 'snap') items.push({ c: G.P(cw * 0.7, h / 2), r: Math.max(0.08, h * 0.08), cls: 'flat' });
    return [{ label: 'CUFF', items }];
  }
  ['FRONT', 'BACK'].forEach(label => {
    const front = label === 'FRONT';
    const items = [ln(top, 'flatd')];
    if (F.shape === 'round' || F.shape === 'pointed' || F.shape === 'scalloped' || F.shape === 'Bertha') {
      const W = F.W;
      if (F.shape === 'Bertha') { const b = G.spline([G.P(-nw, 0), G.P(-nw - m.shoulderWidth * 1.2, W * 0.45), G.P(-nw - m.shoulderWidth * 0.8, W * 1.05), G.P(0, W * (front ? 1.15 : 1.1)), G.P(nw + m.shoulderWidth * 0.8, W * 1.05), G.P(nw + m.shoulderWidth * 1.2, W * 0.45), G.P(nw, 0)], 8); items.push(fl(b)); if (!front) items.push(ln([G.P(0, 0), G.P(0, W * 1.1)])); }
      else [-1, 1].forEach(sg => {
        const lobe = front
          ? (F.shape === 'pointed' ? [G.P(sg * 0.05, nw * 0.35), G.P(sg * (nw + W * 0.2), -0.05), G.P(sg * (nw + W * 0.9), W * 0.35), G.P(sg * W * 0.9, W * 1.1)] : G.spline([G.P(sg * 0.05, nw * 0.35), G.P(sg * (nw + W * 0.2), -0.05), G.P(sg * (nw + W * 0.95), W * 0.4), G.P(sg * W * 0.95, W * 1.0), G.P(sg * 0.15, nw * 0.4 + W * 0.25)], 8))
          : [G.P(sg * 0.05, -0.05), G.P(sg * (nw + W * 0.95), W * 0.2), G.P(sg * (nw + W * 0.6), W * 0.9), G.P(sg * 0.05, W * 0.95)];
        items.push(fl(lobe));
        if (F.shape === 'scalloped') { const s = []; for (let i = 0; i <= 8; i++) s.push(G.P(sg * (W * 0.3 + (nw + W * 0.5) * i / 8), W * (front ? 0.85 : 0.9) - (i % 2 ? W * 0.12 : 0))); items.push(ln(s, 'flatd')); }
      });
      if (o.collarEdge === 'lace edging' || o.collarEdge === 'ruffle edge') items.push(ln([G.P(-nw - W, W * 1.15), G.P(nw + W, W * 1.15)], 'flatd'));
      if (front && o.collarFasten !== 'neckband + snap') items.push(ln([G.P(0, -0.05), G.P(-nw * 0.4, -nw * 0.8)], 'flat'));
    } else if (F.shape === 'sailor') {
      if (front) { [-1, 1].forEach(sg => items.push(fl([G.P(sg * nw, 0), G.P(sg * (nw + F.Wsh), F.Wsh * 0.4), G.P(0, F.Vd + nw * 0.4)]))); items.push(ln([G.P(-nw * 0.9, F.Vd * 0.4), G.P(0, F.Vd + nw * 0.4), G.P(nw * 0.9, F.Vd * 0.4)], 'flatl')); if (o.sailorBow) items.push(fl([G.P(0, F.Vd + nw * 0.4), G.P(-nw, F.Vd * 1.6), G.P(nw, F.Vd * 1.6)])); }
      else { const sq = [G.P(-nw, 0), G.P(-F.hw, nw * 0.2), G.P(-F.hw, F.D), G.P(F.hw, F.D), G.P(F.hw, nw * 0.2), G.P(nw, 0)]; items.push(fl(sq)); for (let i = 0; i < F.stripes; i++) { const d = 0.4 + i * 0.35; items.push(ln([G.P(-F.hw + d, nw * 0.3), G.P(-F.hw + d, F.D - d), G.P(F.hw - d, F.D - d), G.P(F.hw - d, nw * 0.3)], 'flatl')); } }
    } else if (F.shape === 'ruffle') {
      for (let t = 0; t < F.tiers; t++) { const H = F.H * (1 - t * 0.22), p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * 0.08 + Math.PI * 0.84 * i / 16; p.push(G.P(-Math.cos(a) * (nw + H), Math.sin(a) * H * 0.9 - H * 0.2 + (i % 2 ? H * 0.12 : 0) - t * 0.2)); } items.push(ln(p, 'flat')); }
      items.push(ln([G.P(-nw, 0), G.P(nw, 0)], 'flat'));
    } else if (F.shape === 'shirt') {
      const hs = F.hs, hc = F.hc;
      items.push(fl([G.P(-nw, 0), G.P(-nw, -hs), G.P(nw, -hs), G.P(nw, 0)]));
      if (front) [-1, 1].forEach(sg => items.push(fl([G.P(sg * nw, -hs), G.P(sg * (nw + hc * 0.5), hc * 0.2), G.P(sg * (0.05 + F.spread * 0.3), hc * 0.85), G.P(sg * 0.05, -hs * 0.2)])));
      else items.push(fl([G.P(-nw * 1.1, -hs), G.P(-nw * 1.2, hc * 0.45), G.P(nw * 1.2, hc * 0.45), G.P(nw * 1.1, -hs)]));
    } else if (F.shape === 'dickey') {
      const D = front ? F.D : F.Db;
      items.push(fl([G.P(-nw, 0), G.P(-F.bw, m.shoulderWidth * 0.2), G.P(-F.bw * 0.9, D), G.P(F.bw * 0.9, D), G.P(F.bw, m.shoulderWidth * 0.2), G.P(nw, 0)]));
      if (front && F.front === 'mock placket') { items.push(ln([G.P(0.3, F.nd), G.P(0.3, D)])); for (let i = 0; i < 3; i++) items.push({ c: G.P(0.05, F.nd + (D - F.nd) * (0.2 + 0.3 * i)), r: 0.12, cls: 'flat' }); }
      if (front && F.front === 'pintucks') for (let i = 1; i <= 3; i++) [-1, 1].forEach(s => items.push(ln([G.P(s * 0.35 * i, F.nd), G.P(s * 0.35 * i, D * 0.95)], 'flatl')));
      if (front && F.front === 'jabot ruffles') { const p = []; for (let i = 0; i <= 10; i++) p.push(G.P((i % 2 ? 0.5 : -0.5), F.nd + (D - F.nd) * i / 10)); items.push(ln(p, 'flat')); }
      if (F.collar !== 'none') [-1, 1].forEach(sg => items.push(fl(front ? [G.P(sg * nw, -0.1), G.P(sg * (nw + 0.9), 0.7), G.P(sg * 0.1, 1.1)] : [G.P(sg * nw, -0.1), G.P(sg * (nw + 0.8), 0.8), G.P(0, 0.9)])));
      if (!front) items.push(ln([G.P(0, 0), G.P(0, D)]));
    }
    views.push({ label, items });
  });
  return views;
}
