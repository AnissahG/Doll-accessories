// ===================== BELTS, HARNESSES, SUSPENDERS =====================
// Long straps are given as measured rectangles (printed as dimensioned diagrams when they don't
// fit the page) plus small true-scale templates for the parts that need a shape: belt tips,
// hole spacing, corset panels, pouches.
function strapW(m, o, human, ringKind) {
  let w = +o.beltW > 0 ? +o.beltW : Math.max(0.3, human * m.k);
  let mm = 0;
  if (ringKind) {
    mm = o.hwSize === 'auto' ? hwPick(ringKind, w * 10 + 0.5) : +o.hwSize;
    if (!(+o.beltW > 0)) w = strapForRing(mm);
  }
  return { w, mm };
}
// one strap as a pattern rectangle, built the way the Construction field says
function beltStrip(name, w, L, o, n, note) {
  if (o.beltMake === 'ribbon') return null;
  if (o.beltMake === 'folded') {
    const pc = strip(w * 4, L, { name, cut: { fabric: n, note: note || 'press the edges to the centre, fold, edgestitch' } });
    pc.tags = pc.tags.map(() => 'none'); pc.edges = { none: { kind: 'none' } };
    [1, 2, 3].forEach(i => pc.marks.push({ type: 'fold', a: G.P(w * i, 0), b: G.P(w * i, L) }));
    return pc;
  }
  if (o.beltMake === 'layers') {
    const pc = strip(w, L, { name, cut: { fabric: 2 * n, interfacing: n, note: note || 'two layers right sides together, stitch, turn (or stitch wrong sides together and edgestitch)' } });
    return pc;
  }
  const pc = strip(w, L, { name, cut: { fabric: n, note: note || 'faux leather / felt — no seam allowance, edges stay raw' } });
  pc.tags = pc.tags.map(() => 'none'); pc.edges = { none: { kind: 'none' } };
  return pc;
}
function addStrap(out, P, name, w, L, o, n, note) {
  const pc = beltStrip(name, w, L, o, n, note);
  if (pc) P.push(pc); else addNotion(out, 'strap-' + name, 'ribbon / webbing / leather strip ' + fmt(w * 10, 0) + ' mm — ' + name.toLowerCase(), n, cm(Math.ceil(L)) + (n > 1 ? ' each' : ''));
  out.plan.straps = (out.plan.straps || []).concat([{ name, w, L, n }]);
  return pc;
}
function clothesEase(m, o, C) { return o.overClothes ? Math.max(0.5, C * 0.06) : Math.max(0.15, C * 0.01); }
// tip template: last part of a belt with the point and the holes
function tipTemplate(w, holes, spacing, o, firstFromTip) {
  const tipL = w * 0.9;
  const span = (holes - 1) * spacing + firstFromTip + tipL + w;
  const pts = [G.P(0, 0), G.P(span - tipL, 0), G.P(span, w / 2), G.P(span - tipL, w), G.P(0, w)];
  const pc = runsPiece([{ pts: [pts[0], pts[1]], tag: 'edge' }, { pts: [pts[1], pts[2], pts[3]], tag: 'tip' }, { pts: [pts[3], pts[4]], tag: 'edge' }, { pts: [pts[4], pts[0]], tag: 'cut' }], { name: 'Belt tip & holes template', cut: { fabric: 0, note: 'paper template — lay it on the tail end of the belt, trace the point and mark the holes' } });
  pc.edges = { edge: { kind: 'none' }, tip: { kind: 'none' }, cut: { kind: 'none' } };
  for (let i = 0; i < holes; i++) pc.marks.push({ type: 'dot', kind: 'eyelet', p: G.P(span - tipL - firstFromTip - i * spacing, w / 2) });
  pc.marks.push({ type: 'text', p: G.P(0.3, w + 0.5), text: 'centre hole = the doll\'s size', small: true });
  pc.grain = null;
  return pc;
}
function buildBeltFamily(m, o, S, out) {
  const P = [];
  out.plan.family = 'belt';
  out.used = ['waistCirc', 'hipCirc', 'chestCirc'];
  const it = o.item;
  if (it === 'belt' || it === 'utilitybelt') {
    const r = beltBasic(m, o, S, out, P);
    if (it === 'utilitybelt') {
      const n = Math.max(1, Math.min(6, Math.round(+o.pouches || 2)));
      const W = Math.max(1.4, r.C * 0.13), H = W * 1.1, D = W * 0.45;
      P.push(pouchPiece(W, H, D, n, o.beltMake === 'single'));
      const lp = strip(Math.max(r.w * 1.2, 0.6), r.w + 1.0, { name: 'Pouch belt loop', cut: { fabric: n } });
      P.push(lp);
      addNotion(out, 'snap', 'snaps for the pouch flaps ' + (HW.snap.filter(v => v / 10 <= W * 0.3).pop() || 4) + ' mm', n);
      out.plan.pouches = { n, W, H, D };
    }
  }
  else if (it === 'corsetbelt') corsetBelt(m, o, S, out, P);
  else if (it === 'obi') obiBelt(m, o, S, out, P);
  else if (it === 'waistharness' || it === 'chestharness' || it === 'thighharness') harness(m, o, S, out, P);
  out.pieces.push(...P);
  beltSteps(out, P);
  out.flat = Object.assign({ kind: 'belt', item: it }, out.plan);
}
function beltBasic(m, o, S, out, P, opt) {
  opt = opt || {};
  const pos = opt.pos || o.beltPos;
  const C0 = opt.circ || beltCirc(m, pos);
  const C = C0 + clothesEase(m, o, C0);
  const clos = opt.closure || o.beltClosure;
  const buckled = clos === 'pin buckle' || clos === 'slide buckle';
  const { w, mm } = opt.w ? { w: opt.w, mm: opt.mm } : strapW(m, o, opt.human || 3.2, buckled ? 'buckle' : null);
  const tail = +o.beltTail > 0 ? +o.beltTail : Math.max(w * 3, C * 0.2);
  const fold = buckled ? w * 2.4 : 0;
  let L;
  if (clos === 'pin buckle' || clos === 'slide buckle') L = C + tail + fold;
  else if (clos === 'ties') L = C + 2 * C * 0.45;
  else L = C + Math.max(w * 1.5, 0.8);
  const name = opt.name || 'Belt';
  addStrap(out, P, name, w, L, o, 1, opt.note);
  out.readout.belt = (opt.label || 'belt') + ' ' + cm(C) + ' around (' + pos + ' ' + cm(C0) + ' + ease), ' + fmt(w * 10, 0) + ' mm wide' + (mm ? ' · buckle ' + mm + ' mm' : '');
  if (buckled) {
    addNotion(out, 'buckle-' + mm, (clos === 'pin buckle' ? 'pin buckle ' : 'slide buckle ') + mm + ' mm inner width', 1);
    const keeper = strip(o.beltMake === 'folded' ? Math.max(0.2, w * 0.3) * 4 : Math.max(0.2, w * 0.3), w * 2 + 0.5, { name: 'Keeper loop', cut: { fabric: 1, note: 'wraps around the belt; ends butted or overlapped behind' } });
    keeper.tags = keeper.tags.map(() => 'none'); keeper.edges = { none: { kind: 'none' } };
    if (o.beltMake !== 'ribbon') P.push(keeper);
  }
  if (clos === 'pin buckle') {
    const n = Math.max(1, Math.round(+o.holes || 5));
    const sp = Math.max(w * 0.8, C * 0.035, 0.5);
    const tip = tipTemplate(w, n, sp, o, Math.max(0, tail - sp * (n - 1) / 2));
    P.push(tip);
    addNotion(out, 'eyelet', 'mini eyelets ' + (HW.eyelet.filter(v => v / 10 <= w * 0.4).pop() || 1.5) + ' mm (or punch / awl holes)', n);
    out.plan.holes = { n, sp };
  }
  if (clos === 'snap') addNotion(out, 'snap', 'snaps ' + (HW.snap.filter(v => v / 10 <= w * 0.8).pop() || 4) + ' mm', Math.max(1, Math.round(w / 0.8)));
  if (clos === 'hook') addNotion(out, 'hook', 'hooks & eyes', Math.max(1, Math.round(w / 0.6)));
  if (clos === 'velcro') addNotion(out, 'velcro', 'hook & loop tape (thin, sew-on)', 1, cm(Math.max(w * 1.5, 0.8)));
  out.plan.belt = { C, w, L, tail, clos, mm, pos };
  return { C, w, L };
}
// ---------- corset belt
function corsetBelt(m, o, S, out, P) {
  out.used.push('underbustCirc', 'shoulderToWaist', 'waistToHip', 'shoulderToBust');
  const H = +o.corsetH > 0 ? +o.corsetH : m.waistToHip * 1.15;
  const hUp = H * 0.5, hDn = H * 0.5;
  const dU = m.shoulderToWaist - dropToPos(m, 'underbust');
  const Cw0 = beltCirc(m, o.beltPos);
  const ease = clothesEase(m, o, Cw0) * 0.6;
  const Ct = m.waistCirc + (m.underbustCirc - m.waistCirc) * Math.min(1, hUp / Math.max(0.5, dU)) + ease;
  const Cw = Cw0 + ease;
  const Cb = bodyCircAt(m, hDn + (o.beltPos === 'high hip' ? m.waistToHighHip : 0)) + ease;
  const lace = o.beltClosure === 'lace-up';
  const gap = lace ? Math.max(0.3, Cw * 0.05) : 0;
  const half = (c) => (c - gap) / 2;
  const fr = [0.22, 0.28, 0.28, 0.22];
  const names = ['Centre front', 'Side front', 'Side back', 'Centre back'];
  const pointed = o.corsetShape === 'pointed', curved = o.corsetShape === 'curved';
  const pdepth = H * 0.14;
  out.plan.corset = { H, Ct, Cw, Cb, gap };
  out.readout.belt = 'corset ' + cm(H) + ' tall at CF · top ' + cm(Ct) + ', waist ' + cm(Cw) + ', bottom ' + cm(Cb) + (gap ? ' · lacing gap ' + cm(gap) : '');
  let xAcc = [0, 0, 0];
  fr.forEach((f, i) => {
    const wt = half(Ct) * f, ww = half(Cw) * f, wb = half(Cb) * f;
    // vertical offsets: pointed front (CF longer at top & bottom), curved top edge dips at the sides
    const u0 = xAcc[1] / half(Cw), u1 = (xAcc[1] + ww) / half(Cw);
    const topY = (u) => -hUp - (pointed ? pdepth * Math.max(0, 1 - u * 4) : 0) + (curved ? H * 0.12 * Math.sin(Math.PI * Math.min(1, u * 1.1)) : 0);
    const botY = (u) => hDn + (pointed ? pdepth * Math.max(0, 1 - u * 4) : 0) - (curved ? H * 0.08 * Math.sin(Math.PI * Math.min(1, u * 1.1)) : 0);
    const L = [G.P(-wt / 2, topY(u0)), G.P(-ww / 2, 0), G.P(-wb / 2, botY(u0))];
    const R = [G.P(wt / 2, topY(u1)), G.P(ww / 2, 0), G.P(wb / 2, botY(u1))];
    const left = G.spline(L, 8), right = G.spline(R, 8);
    const isCF = i === 0, isCB = i === 3;
    const runs = [
      { pts: [left[0], right[0]], tag: 'top' },
      { pts: right, tag: isCB ? 'cb' : 'seam' },
      { pts: [right[right.length - 1], left[left.length - 1]], tag: 'bottom' },
      { pts: left.slice().reverse(), tag: isCF ? 'cf' : 'seam' }
    ];
    const pc = runsPiece(runs, { name: names[i], cut: { fabric: isCF ? 1 : 2, fold: isCF, mirrored: !isCF, lining: o.lining === 'yes' ? (isCF ? 1 : 2) : 0, interfacing: o.interfacing !== 'none' ? (isCF ? 1 : 2) : 0 } });
    pc.edges = { top: { kind: 'none' }, bottom: { kind: 'none' }, cf: { kind: 'seam' }, cb: { kind: lace ? 'hem' : 'seam' } };
    if (isCF) pc.foldTag = 'cf';
    pc.marks.push({ type: 'notch', p: G.P(-ww / 2, 0) }, { type: 'notch', p: G.P(ww / 2, 0) });
    pc.marks.push({ type: 'line', cls: 'centre', pts: [G.P(-ww / 2, 0), G.P(ww / 2, 0)], label: 'waist' });
    if (o.boning && !isCF) pc.marks.push({ type: 'line', cls: 'topstitch', pts: left.map(p => G.P(p.x + 0.25, p.y)).slice(1, -1), label: '' });
    if (isCB && lace) {
      const n = Math.max(4, Math.round(H / Math.max(0.6, H * 0.12)));
      for (let j = 0; j < n; j++) { const y = -hUp + H * (j + 0.5) / n; pc.marks.push({ type: 'dot', kind: 'eyelet', p: G.P(ww / 2 - Math.max(0.3, ww * 0.18), y) }); }
      addNotion(out, 'eyelet', 'mini eyelets ' + (HW.eyelet.filter(v => v / 10 <= ww * 0.15).pop() || 1.5) + ' mm', n * 2);
      addNotion(out, 'lace', 'lacing cord / ribbon', 1, cm(Math.ceil(H * 3 + gap * n + Cw * 0.4)));
    }
    pc.grain = { a: G.P(0, -hUp * 0.5), b: G.P(0, hDn * 0.5) };
    xAcc[1] += ww;
    P.push(pc);
  });
  if (o.boning) addNotion(out, 'boning', 'boning (thin plastic / cable ties)', 8, cm(Math.ceil(H * 0.9)) + ' each');
  if (!lace) addNotion(out, o.beltClosure, o.beltClosure === 'hook' ? 'hooks & eyes' : 'snaps', Math.max(2, Math.round(H / 0.9)));
  addNotion(out, 'bias', 'bias binding for the top and bottom edges', 1, cm(Math.ceil((Ct + Cb) * 1.1)));
}
// ---------- obi
function obiBelt(m, o, S, out, P) {
  const C0 = beltCirc(m, o.beltPos);
  const C = C0 + clothesEase(m, o, C0);
  const H = +o.corsetH > 0 ? +o.corsetH : m.waistToHip * 0.85;
  const tieW = Math.max(0.4, H * 0.3);
  let L = C + (o.obiTie === 'wrap' ? H * 0.6 : 0);
  // band: full height for the front 60 %, tapering to the tie width at the ends
  const front = C * 0.62, taperL = (L - front) / 2;
  const pts = [G.P(0, (H - tieW) / 2), G.P(taperL, 0), G.P(taperL + front, 0), G.P(L, (H - tieW) / 2), G.P(L, (H + tieW) / 2), G.P(taperL + front, H), G.P(taperL, H), G.P(0, (H + tieW) / 2)];
  const pc = runsPiece([{ pts: pts.slice(0, 4), tag: 'edge' }, { pts: [pts[3], pts[4]], tag: 'end' }, { pts: pts.slice(4, 8), tag: 'edge' }, { pts: [pts[7], pts[0]], tag: 'end' }], { name: 'Obi band', cut: { fabric: 2, interfacing: 1, note: 'outer + facing' } });
  pc.edges = { edge: { kind: 'seam' }, end: { kind: 'seam' } };
  pc.marks.push({ type: 'centre', a: G.P(L / 2, 0), b: G.P(L / 2, H), label: 'CF' });
  P.push(pc);
  if (o.obiTie !== 'wrap') {
    const tl = o.obiTie === 'bow' ? C * 0.55 : C * 0.75;
    const t = strip(tieW * 2, tl, { name: 'Tie', cut: { fabric: 2, note: 'fold lengthwise, stitch, turn' } });
    t.marks.push({ type: 'fold', a: G.P(tieW, 0), b: G.P(tieW, tl) });
    P.push(t);
  } else addNotion(out, 'snap', 'snaps', 2);
  out.plan.obi = { C, H, L, tieW };
  out.readout.belt = 'obi ' + cm(H) + ' tall, ' + cm(C) + ' around';
}
// ---------- utility belt pouches: one-piece net (flap, back, bottom, front, two sides)
function pouchPiece(W, H, D, n, raw) {
  const fl = D + H * 0.5;
  const V = [G.P(0, -fl), G.P(W, -fl), G.P(W, 0), G.P(W, H), G.P(W, H + D), G.P(W + D, H + D), G.P(W + D, 2 * H + D), G.P(W, 2 * H + D), G.P(0, 2 * H + D), G.P(-D, 2 * H + D), G.P(-D, H + D), G.P(0, H + D), G.P(0, H), G.P(0, 0)];
  const T = ['edge', 'edge', 'sideA', 'sideB', 'sideB', 'sideA', 'hem', 'hem', 'hem', 'sideA', 'sideB', 'sideB', 'sideA', 'edge'];
  const runs = V.map((p, i) => ({ pts: [p, V[(i + 1) % V.length]], tag: T[i] }));
  const pc = runsPiece(runs, { name: 'Pouch (one-piece net)', cut: { fabric: n, lining: raw ? 0 : n } });
  pc.edges = { edge: { kind: raw ? 'none' : 'seam' }, hem: { kind: raw ? 'none' : 'seam' }, sideA: { kind: 'seam' }, sideB: { kind: 'seam' } };
  [[0, 'top of the back'], [-D, 'flap fold'], [H, 'bottom'], [H + D, 'bottom']].forEach(([y, l]) => pc.marks.push({ type: 'fold', a: G.P(0, y), b: G.P(W, y), label: l }));
  pc.marks.push({ type: 'dot', kind: 'snap-ball', p: G.P(W / 2, -fl + Math.min(0.5, fl * 0.2)), label: 'snap' }, { type: 'dot', kind: 'snap-socket', p: G.P(W / 2, 2 * H + D - H * 0.45), label: 'snap' });
  pc.marks.push({ type: 'place', pts: [G.P(W * 0.3, H * 0.15), G.P(W * 0.7, H * 0.15), G.P(W * 0.7, H * 0.85), G.P(W * 0.3, H * 0.85)], label: 'belt loop (outside)' });
  pc.notes.push('Fold on the fold lines; the side squares join the back edges and the bottom — a little box with a flap.');
  return pc;
}
function harness(m, o, S, out, P) {
  const it = o.item;
  const human = 2.0;
  const { w, mm } = strapW(m, o, human, 'ring');
  const ringN = { 'O-ring': 'O-rings', 'D-ring': 'D-rings', square: 'square rings' }[o.ringType];
  const loop = 2 * (w * 1.2 + 0.3);          // allowance to wrap a strap end around a ring and stitch it
  let rings = 0;
  out.readout.belt = 'straps ' + fmt(w * 10, 0) + ' mm wide · ' + mm + ' mm rings & buckles';
  const buckleStrap = (name, circ, pos) => { beltBasic(m, o, S, out, P, { name, circ, pos, w, mm, closure: o.beltClosure, label: name.toLowerCase() }); };
  if (it === 'waistharness') {
    out.used.push('waistToHip', 'waistToMidThigh');
    buckleStrap('Waist strap', beltCirc(m, o.beltPos), o.beltPos);
    if (o.waistHarness === 'double') {
      const lowPos = o.beltPos === 'waist' ? 'hip' : 'low hip';
      buckleStrap('Lower strap', beltCirc(m, lowPos), lowPos);
      const vd = dropToPos(m, lowPos) - dropToPos(m, o.beltPos);
      addStrap(out, P, 'Connector', w, vd + loop, o, 4, 'each end wraps around a ring threaded on the waist / lower strap');
      rings += 8;
      out.plan.harness = { kind: 'double', vd };
    } else {
      const vd = dropToPos(m, 'mid thigh') - dropToPos(m, o.beltPos) - m.waistToMidThigh * 0.1;
      addStrap(out, P, 'Hanging strap', w, vd + loop, o, 4, 'top end around a ring on the waist strap, bottom end around a garter clip');
      rings += 4; addNotion(out, 'clip', 'garter clips / mini lobster clasps', 4);
      out.plan.harness = { kind: 'suspender', vd };
    }
  } else if (it === 'chestharness') {
    out.used.push('underbustCirc', 'shoulderToBust', 'shoulderToWaist', 'napeToWaist', 'neckCirc', 'acrossBack');
    const dU = dropToPos(m, 'underbust');
    buckleStrap('Underbust strap', m.underbustCirc, 'underbust');
    if (o.harnessStyle === 'cage') { buckleStrap('Second underbust strap', m.underbustCirc + 0.4, 'underbust'); }
    const over = m.neckCirc * 0.3;
    if (o.harnessStyle === 'simple' || o.harnessStyle === 'cage') {
      addStrap(out, P, 'Shoulder strap', w, 2 * dU + over + loop, o, 2, 'front end to the underbust strap, over the shoulder, back end to the underbust strap');
      rings += 4;
    } else if (o.harnessStyle === 'collar') {
      buckleStrap('Collar', m.neckCirc * 1.08, 'neck');
      const sternum = dU - m.neckToChin * 0.2 - m.neckCirc * 0.12;
      addStrap(out, P, 'Front strap', w, sternum + loop, o, 1, 'collar ring to underbust ring (centre front)');
      addStrap(out, P, 'Back strap', w, m.napeToWaist * (dU / m.shoulderToWaist) + loop, o, 1, 'back of the collar to the underbust strap');
      addStrap(out, P, 'Shoulder strap', w, Math.hypot(dU * 0.75, m.chestCirc * 0.1) + over * 0.5 + loop, o, 2, 'from the centre ring, over the shoulder, down to the back underbust');
      rings += 4;
    } else if (o.harnessStyle === 'xback') {
      const back = Math.hypot(m.napeToWaist * (dU / m.shoulderToWaist), m.acrossBack * 0.45);
      addStrap(out, P, 'X strap', w, dU + over + back + loop, o, 2, 'front underbust → over the shoulder → across the back through the centre ring → opposite underbust');
      rings += 3;
    }
    if (o.withWaist) {
      buckleStrap('Waist strap', beltCirc(m, o.beltPos), o.beltPos);
      addStrap(out, P, 'Centre front connector', w, dropToPos(m, o.beltPos) - dU + loop, o, 1, 'underbust ring to waist ring');
      rings += 2;
    }
    out.plan.harness = { kind: o.harnessStyle, dU };
  } else if (it === 'thighharness') {
    out.used.push('thighCirc', 'kneeCirc', 'waistToMidThigh');
    const legs = o.bothLegs ? 2 : 1;
    const Ct = thighCircAt(m, o.thighPos);
    const C = Ct + clothesEase(m, o, Ct) * 0.6;
    const tail = Math.max(w * 3, C * 0.18);
    addStrap(out, P, 'Thigh strap', w, C + tail + w * 2.4, o, legs);
    addNotion(out, 'buckle-' + mm, 'pin buckle ' + mm + ' mm', legs);
    if (o.toBelt) {
      buckleStrap('Belt', beltCirc(m, o.beltPos), o.beltPos);
      const yT = m.shoulderToWaist + { 'upper thigh': m.seatDepth + m.crotchToKnee * 0.12, 'mid thigh': m.waistToMidThigh, 'above knee': m.waistToKnee - m.crotchToKnee * 0.15 }[o.thighPos];
      const vd = yT - dropToPos(m, o.beltPos);
      addStrap(out, P, 'Side connector', w, vd + loop, o, legs, 'belt ring to thigh-strap ring, down the outside of the leg');
      rings += 2 * legs;
      out.plan.harness = { kind: 'thigh', vd };
    } else out.plan.harness = { kind: 'thigh', vd: 0 };
    out.readout.belt = 'thigh ' + cm(C) + ' around · straps ' + fmt(w * 10, 0) + ' mm · ' + mm + ' mm hardware';
  }
  if (rings) addNotion(out, 'ring', ringN + ' ' + mm + ' mm inner width', rings);
  if (it !== 'thighharness') out.readout.belt = 'straps ' + fmt(w * 10, 0) + ' mm wide · ' + mm + ' mm rings & buckles · ' + (out.plan.straps || []).length + ' strap types';
}
function beltSteps(out, P) {
  const { o, plan } = out;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  const make = o.beltMake;
  if (o.item !== 'corsetbelt' && o.item !== 'obi') add('Cut the straps.', make === 'ribbon' ? 'Cut the ribbon / webbing / leather strips to the lengths in the notions list and seal the ends with fray stopper (or a lighter on synthetic ribbon).' : 'The straps are rectangles — measure and cut them with a ruler and rotary cutter (the pattern pages give the sizes). ' + (make === 'folded' ? 'Press each strip in half lengthwise, open it, press both long edges to the centre, fold again and edgestitch both sides.' : make === 'layers' ? 'Fuse interfacing to one layer, place the two layers right sides together, stitch the long sides, turn with a loop turner and press; or stitch them wrong sides together and trim close.' : 'Faux leather / felt: cut exactly on the line; no finishing needed. A tiny line of edge paint or a matching marker makes faux-leather edges look professional.'));
  if (o.item === 'corsetbelt') {
    add('Cut the panels.', 'Cut the outer, lining' + (o.interfacing !== 'none' ? ' and interfacing (a firm woven or fusible: corset belts must not stretch)' : '') + ' panels; the centre front is cut on the fold. Transfer the waist line and notches to every panel — they keep the panels level.');
    add('Sew the corset panels.', 'Sew the panels together in order (centre front – side front – side back – centre back) for the outer and the lining, matching the waist notches. Press the seams open.' + (o.boning ? ' Stitch the boning channels beside each seam (through the seam allowance or with a strip of tape) and slide the boning in, 3 mm shorter than the channel.' : ''));
    add('Assemble.', 'Place outer and lining right sides together, stitch the centre-back edges, turn and press. ' + (o.beltClosure === 'lace-up' ? 'Set the eyelets at the dots through all layers. ' : 'Sew the hooks & eyes or snaps along the back edges. ') + 'Bind the top and bottom edges with bias binding.');
    return;
  }
  if (o.item === 'obi') { add('Cut the pieces.', 'Cut the band twice (outer + facing) and interface the outer.'); add('Make the obi.', 'Interface the outer band. Make the ties (fold, stitch, turn). Place the ties at the ends of the band, put outer and facing right sides together, stitch around leaving a gap, turn, press, topstitch.'); return; }
  if (plan.belt && plan.belt.clos === 'pin buckle') add('Finish the belt ends.', 'Use the tip template to trim the tail end into a point and to mark the holes; the centre hole is the doll\'s size. Set the eyelets (or punch holes). At the other end, punch a slot for the buckle prong, wrap the end around the buckle bar and stitch it down; slip the keeper loop on before stitching.');
  else if (plan.belt && plan.belt.clos === 'slide buckle') add('Attach the slide buckle.', 'Wrap one end around the buckle\'s centre bar and stitch it down; the other end slides through and is held by friction.');
  else if (plan.belt && plan.belt.clos === 'ties') add('Finish the tie ends.', 'Trim the ends at an angle and hem or seal them.');
  else if (plan.belt) add('Add the closure.', 'Sew the snaps / hooks / hook & loop to the overlap.');
  if (o.item === 'utilitybelt') add('Make the pouches.', 'Fold each pouch net into a box: sew the side edges of the front to the side panels, then the back edges of the sides to the back. Turn, push the corners out. Sew a snap under the flap tip and on the front. Stitch a belt loop strip across the back, then thread the pouches onto the belt.');
  if (plan.harness) add('Assemble the harness.', 'Thread the rings onto the straps as you go. Each strap end wraps around its ring (about ' + cm(plan.straps && plan.straps[0] ? plan.straps[0].w * 1.2 : 0.5) + ') and is stitched down with a small box or two rows of stitches. Try the harness on the doll before the last stitches — strap lengths include a little extra; trim it.');
  if (o.item === 'suspenders') add('Assemble the suspenders.', (o.suspStyle === 'Y' ? 'Join the two front straps and the back strap through the back tab (or a ring) where they meet. ' : o.suspStyle === 'X' ? 'Cross the two straps at the back and stitch a small square through both where they cross (or join them with a ring). ' : 'Stitch the short back strap across the two long straps at shoulder-blade height. ') + (o.suspEnds === 'buttons' ? 'Make the button tabs (two layers, buttonhole at the end), stitch them to the strap ends. Sew buttons inside the waistband of the trousers to match.' : o.suspEnds === 'clips' ? 'Thread each strap end through a clip and stitch it back.' : 'Sew the ends inside the waistband.') + ' Add the sliders to the front straps so the length can be adjusted.');
}
// suspenders live here because they are straps too (category "Other styling")
function buildSuspenders(m, o, S, out) {
  const P = [];
  out.plan.family = 'belt';
  out.used = ['shoulderToWaist', 'napeToWaist', 'neckCirc', 'acrossBack', 'chestCirc'];
  const { w, mm } = strapW(m, o, 3.2, 'slider');
  const over = m.neckCirc * 0.3;
  const adj = 1.15;
  const endA = o.suspEnds === 'buttons' ? 0 : o.suspEnds === 'clips' ? w * 3 : 2 * (0.6 + 0.3);
  if (o.suspStyle === 'Y') {
    addStrap(out, P, 'Front strap', w, (m.shoulderToWaist + over + m.napeToWaist * 0.3) * adj + endA, o, 2);
    addStrap(out, P, 'Back strap', w, m.napeToWaist * 0.72 + endA, o, 1);
    const tab = runsPiece([{ pts: [G.P(0, 0), G.P(w * 2.4, 0), G.P(w * 1.2, w * 2.6), G.P(0, 0)].slice(0, 3), tag: 'edge' }, { pts: [G.P(w * 1.2, w * 2.6), G.P(0, 0)], tag: 'edge' }], { name: 'Back tab (Y)', cut: { fabric: 2 } });
    tab.edges = { edge: { kind: o.beltMake === 'single' ? 'none' : 'seam' } };
    P.push(tab);
  } else if (o.suspStyle === 'X') {
    addStrap(out, P, 'Strap', w, (m.shoulderToWaist + over + Math.hypot(m.napeToWaist, m.acrossBack * 0.45)) * adj + endA, o, 2);
  } else {
    addStrap(out, P, 'Strap', w, (m.shoulderToWaist + over + m.napeToWaist) * adj + endA, o, 2);
    addStrap(out, P, 'Back cross strap', w, m.acrossBack * 0.55 + 2 * 0.5, o, 1);
  }
  addNotion(out, 'slider', 'sliders ' + mm + ' mm', 2);
  if (o.suspEnds === 'buttons') {
    const tl = Math.max(1.2, w * 2.8);
    const t = runsPiece(roundedRuns([G.P(0, 0), G.P(w, 0), G.P(w, tl), G.P(0, tl)], [{ tag: 'top' }, { tag: 'edge' }, { tag: 'edge' }, { tag: 'edge' }], [0, 0, w * 0.45, w * 0.45]), { name: 'Button tab', cut: { fabric: o.beltMake === 'single' ? (o.suspStyle === 'Y' ? 3 : 4) : 2 * (o.suspStyle === 'Y' ? 3 : 4) } });
    t.edges = { top: { kind: 'seam' }, edge: { kind: o.beltMake === 'single' ? 'none' : 'seam' } };
    t.marks.push({ type: 'buttonhole', p: G.P(w / 2, tl - w * 0.6), len: Math.max(0.3, w * 0.55), vertical: true });
    P.push(t);
    addNotion(out, 'button', 'buttons ' + (HW.button.filter(v => v / 10 <= w * 0.7).pop() || 3) + ' mm (sewn inside the trousers)', o.suspStyle === 'Y' ? 3 : 4);
  } else if (o.suspEnds === 'clips') addNotion(out, 'clip', 'suspender clips ' + mm + ' mm', o.suspStyle === 'Y' ? 3 : 4);
  out.readout.belt = 'straps ' + fmt(w * 10, 0) + ' mm wide, adjustable with ' + mm + ' mm sliders';
  out.plan.susp = { w, style: o.suspStyle };
  out.pieces.push(...P);
  beltSteps(out, P);
  out.flat = Object.assign({ kind: 'belt', item: 'suspenders' }, out.plan);
}
