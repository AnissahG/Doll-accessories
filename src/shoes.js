// ===================== FLAT SHOES (beta) =====================
// Drafted from the doll's foot: length, width, ball and instep girth, ankle height. The sole is a
// foot-shaped outline; the upper is a heel counter (quarter) plus a toe piece (vamp) whose edges
// are measured against the sole so they match. Doll feet vary a lot — make a felt toile first.
function soleOutline(Ls, Ws, toe) {
  // half-widths along the foot from the heel (0) to the toe (1)
  const st = [[0, 0], [0.03, 0.24], [0.1, 0.34], [0.2, 0.36], [0.38, 0.35], [0.55, 0.44], [0.68, 0.5], [0.8, 0.48]];
  const tip = toe === 'square' ? [[0.92, 0.45], [0.985, 0.4], [1, 0.32]] : toe === 'almond' ? [[0.9, 0.38], [0.96, 0.24], [1, 0]] : [[0.9, 0.42], [0.96, 0.3], [1, 0]];
  const all = st.concat(tip);
  const inward = (u) => 0.07 * Ws * Math.pow(u, 2.2);   // toes drift toward the big toe side
  const right = all.map(([u, h]) => G.P(h * Ws + inward(u), u * Ls));
  const left = all.map(([u, h]) => G.P(-h * Ws * (u > 0.3 && u < 0.62 ? 0.92 : 1) + inward(u), u * Ls));   // arch side slimmer
  let R = G.spline(right, 6), Lf = G.spline(left, 6);
  if (toe === 'square') { R.push(G.P(inward(1), Ls)); }
  const ring = R.concat(Lf.slice().reverse().slice(toe === 'square' ? 0 : 1));
  return G.clean(ring);
}
function splitAtY(ring, y) {
  // two indices where the outline crosses y (right side, left side), returns arc runs [toe, heel]
  const n = ring.length;
  const cross = [];
  for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) { const t = (y - a.y) / (b.y - a.y); cross.push({ i, p: G.lerp(a, b, t) }); } }
  if (cross.length < 2) return null;
  const [c0, c1] = [cross[0], cross[cross.length - 1]];
  const runA = [c0.p].concat(ring.slice(c0.i + 1, c1.i + 1)).concat([c1.p]);
  const runB = [c1.p].concat(ring.slice(c1.i + 1)).concat(ring.slice(0, c0.i + 1)).concat([c0.p]);
  // runA goes through the toe if it contains the max-y point
  const maxY = (r) => Math.max(...r.map(p => p.y));
  return maxY(runA) > maxY(runB) ? { toe: runA, heel: runB } : { toe: runB, heel: runA };
}
// strip whose bottom edge has length Lb and whose top follows h(u); tLen = top length (shorter: curves the strip)
function curvedStrip(Lb, Lt, hFn, n = 40) {
  const hm = hFn(0.5);
  if (Lb - Lt < 0.01) {
    const bot = [], top = [];
    for (let i = 0; i <= n; i++) { const u = i / n; bot.push(G.P(Lb * u, 0)); top.push(G.P(Lb * u, -hFn(u))); }
    return { bot, top };
  }
  const R1 = hm * Lb / (Lb - Lt);
  const th = Lb / R1;
  const bot = [], top = [];
  for (let i = 0; i <= n; i++) { const u = i / n, a = -Math.PI / 2 - th / 2 + th * u; bot.push(G.P(R1 * Math.cos(a), R1 * Math.sin(a) + R1)); const r = R1 - hFn(u); top.push(G.P(r * Math.cos(a), r * Math.sin(a) + R1)); }
  return { bot, top };
}
function buildShoe(m, o, S, out) {
  out.used = ['footLength', 'footWidth', 'footCirc', 'instepCirc', 'ankleHeight', 'ankleCirc', 'heelLift'];
  out.plan.family = 'shoe';
  const it = o.item;
  const L = m.footLength, Wf = m.footWidth;
  const ease = +o.shoeEase > 0 ? +o.shoeEase : Math.max(0.15, L * 0.04);
  const Ls = L + ease * 0.6, Ws = Wf + ease * 0.35;
  const P = [];
  const card = o.soleMake === 'card' || o.soleMake === 'cord';
  const la = Math.max(0.3, L * 0.06);                     // lasting allowance (glued under the insole)
  out.readout.foot = 'sole ' + cm(Ls) + ' × ' + cm(Ws) + ' (foot ' + cm(L) + ' × ' + cm(Wf) + ' + ease)';
  if (m.heelLift > 0.3) out.warnings.push('This doll has high-heel feet (heel lift ' + cm(m.heelLift) + '). These flat-shoe patterns assume a flat foot — the sole would need a wedge. For heeled feet, use the tape method: wrap the foot in cling film and tape, draw the seams, cut off and flatten the pieces.');
  out.notes.push('Beta: doll feet vary a lot between sculpts. Make a quick toile in felt (no lining) and adjust the ease before cutting good fabric.');
  // ---- sole
  const ring = soleOutline(Ls, Ws, o.toeShape);
  const soleRuns = [{ pts: ring.concat([ring[0]]), tag: 'sole' }];
  const mk = (name, cut, kind, edge) => { const pc = runsPiece(soleRuns, { name, cut, kind }); pc.edges = { sole: edge }; pc.grain = { a: G.P(0, Ls * 0.3), b: G.P(0, Ls * 0.7) }; pc.marks.push({ type: 'text', p: G.P(-Ws * 0.15, Ls * 0.12), text: 'heel', small: true }); return pc; };
  const Psole = G.plen(ring.concat([ring[0]]));
  if (card) {
    const ins = mk('Insole', { fabric: 0, stiffener: 2, mirrored: true, note: 'card / thin plastic — exact size, no allowance. Left & right: flip for the second shoe' }, 'stiffener', { kind: 'none' });
    ins.grain = null;
    const cov = mk('Insole cover', { fabric: 2, mirrored: true, note: 'glued over the insole' }, 'fabric', { kind: 'seam', sa: 0.25 });
    const outs = mk('Outsole', { fabric: 2, mirrored: true, note: 'felt / faux leather / thin cork — glued under' }, 'fabric', { kind: 'seam', sa: 0.08 });
    P.push(ins, cov, outs);
    if (o.soleMake === 'cord') addNotion(out, 'cord', 'jute / cotton cord 1.5–2 mm for the espadrille sole', 1, cm(Math.ceil(0.78 * Ls * Ws / 0.18 * 2)) + ' (both shoes)');
  } else {
    const sole = mk('Sole', { fabric: 2, mirrored: true, lining: o.shoeLining ? 2 : 0, note: 'felt / faux leather; lining = sock lining' }, 'fabric', { kind: 'seam' });
    P.push(sole);
  }
  out.plan.sole = { Ls, Ws, Psole };
  // ---- girths at a station
  const Gb = m.footCirc + ease, Gi = m.instepCirc + ease;
  const girthAt = (u) => u >= 0.68 ? Gb : u <= 0.5 ? Gi : Gi + (Gb - Gi) * (u - 0.5) / 0.18;
  const widthAt = (u) => { const sp = splitAtY(ring, u * Ls); if (!sp) return Ws; const xs = [sp.toe[0].x, sp.toe[sp.toe.length - 1].x]; return Math.abs(xs[0] - xs[1]); };
  const lastE = card ? { kind: 'none' } : { kind: 'seam' };
  const lined = o.shoeLining && it !== 'sandals';
  const upperCut = (n) => ({ fabric: n, lining: lined ? n : 0, interfacing: o.construction === 'turned' ? n : 0 });
  if (it === 'sandals') {
    sandalStraps(m, o, S, out, P, { Ls, Ws, ring, girthAt, widthAt, la, card });
  } else {
    const yT = { slippers: 0.5, flats: 0.62, maryjanes: 0.64, espadrilles: 0.56 }[it] * Ls;
    const sp = splitAtY(ring, yT);
    const Ptoe = G.plen(sp.toe), Pheel = G.plen(sp.heel);
    const ankleH = m.ankleHeight;
    const hB = ankleH * ({ slippers: 0.95, flats: 0.72, maryjanes: 0.78, espadrilles: 0.85 }[it]);
    const hT = hB * (it === 'slippers' ? 0.85 : 0.55);
    // quarter (heel counter): bottom = heel perimeter (+ lasting), top a little shorter (foot narrows above the heel)
    const hq = (u) => hT + (hB - hT) * Math.sin(Math.PI * u);
    const q = curvedStrip(Pheel, Pheel * 0.9, hq);
    const extend = (pts, d) => card ? pts.map((p, i) => { const nx = i === 0 ? G.sub(pts[1], pts[0]) : G.sub(pts[i], pts[i - 1]); const nn = G.norm(G.P(-nx.y, nx.x)); return G.add(p, G.mul(nn, -d)); }) : pts;
    const qb = extend(q.bot, la);
    const quarter = runsPiece([{ pts: qb, tag: 'last' }, { pts: [qb[qb.length - 1], q.top[q.top.length - 1]], tag: 'side' }, { pts: q.top.slice().reverse(), tag: 'top' }, { pts: [q.top[0], qb[0]], tag: 'side' }], { name: 'Heel piece (quarter)', cut: upperCut(2) });
    quarter.edges = { last: lastE, side: { kind: 'seam' }, top: { kind: lined ? 'seam' : 'hem' } };
    quarter.marks.push({ type: 'notch', p: q.bot[Math.round(q.bot.length / 2)], n: 2 });
    if (card) quarter.marks.push({ type: 'line', cls: 'foldline', pts: q.bot, label: 'sole edge' });
    P.push(quarter);
    // vamp (toe): crescent, outer edge = toe perimeter + 6 % ease (gathered), inner edge = throat line
    const Gt = girthAt(yT / Ls), Wt = widthAt(yT / Ls);
    const closed = it === 'slippers' || it === 'espadrilles';
    const Tl = Math.max(0.6, closed ? Gt - Wt - 2 * hT + ease * 0.5 : (Gt - Wt - 2 * hT) * 1.15 + ease);
    const Lv = (Ls - yT) * 1.02 + Wf * (closed ? 0.32 : 0.2);
    const Po = Ptoe * 1.06;
    const n = 40;
    const crescent = (Ri) => {
      const phi = Math.min(Tl / Ri, Math.PI * 1.7);
      const inner = [], outer = [];
      for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 - phi / 2 + phi * i / n; inner.push(G.P(Ri * Math.cos(a), Ri * Math.sin(a) + Ri)); }
      for (let i = n; i >= 0; i--) { const u = i / n, a = -Math.PI / 2 - phi / 2 + phi * u; const t = Math.sin(Math.PI * u); const rr = Ri + hT + (Lv - hT) * Math.pow(t, 0.8); outer.push(G.P(rr * Math.cos(a), rr * Math.sin(a) + Ri)); }
      return { inner, outer, len: G.plen(outer) };
    };
    // outer length falls as the inner radius grows: bisect for the toe perimeter
    let lo = Tl / (Math.PI * 1.7), hi = 80;
    for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (crescent(mid).len > Po) lo = mid; else hi = mid; }
    const Ri = (lo + hi) / 2;
    const cr = crescent(Ri);
    if (Math.abs(cr.len - Po) > 0.2) out.warnings.push('The toe piece could not be matched exactly to the sole (' + cm(cr.len) + ' vs ' + cm(Po) + ') — check the foot measurements.');
    const inner = cr.inner, outer = cr.outer;
    const ob = card ? outer.map(p => { const c = G.P(0, Ri); const d = G.norm(G.sub(p, c)); return G.add(p, G.mul(d, la)); }) : outer;
    const vamp = runsPiece([{ pts: inner, tag: 'throat' }, { pts: [inner[n], ob[0]], tag: 'side' }, { pts: ob, tag: 'last' }, { pts: [ob[n], inner[0]], tag: 'side' }], { name: 'Toe piece (vamp)', cut: upperCut(2) });
    vamp.edges = { throat: { kind: lined ? 'seam' : 'hem' }, side: { kind: 'seam' }, last: lastE };
    vamp.marks.push({ type: 'notch', p: ob[Math.round(n / 2)] });
    vamp.marks.push({ type: 'gather', pts: G.slice(ob, G.plen(ob) * 0.3, G.plen(ob) * 0.7), label: 'ease the toe', light: true });
    if (card) vamp.marks.push({ type: 'line', cls: 'foldline', pts: outer, label: '' });
    vamp.grain = { a: G.P(0, -Lv * 0.2 + Ri * 0.0 - Ri * 0.3), b: G.P(0, -Lv * 0.75 - Ri * 0.3 + Ri * 0.3) };
    autoGrain(vamp);
    P.push(vamp);
    out.plan.upper = { yT, hB, hT, Tl, Lv, Ptoe, Pheel };
    if (it === 'maryjanes') {
      const yS = 0.56 * Ls;
      const Gs = girthAt(0.56), Wss = widthAt(0.56);
      const sw = Math.max(0.3, L * 0.075);
      const sl = Gs - Wss - 2 * hT * 0.9 + sw * 1.6;
      const stp = strip(sw * (o.construction === 'raw' ? 1 : 2), sl, { name: 'Strap', cut: { fabric: o.construction === 'raw' ? 2 : 2, note: 'one per shoe' + (o.construction === 'raw' ? ' — raw edges' : ' — fold lengthwise, stitch, turn') } });
      if (o.construction === 'raw') { stp.tags = stp.tags.map(() => 'none'); stp.edges = { none: { kind: 'none' } }; } else stp.marks.push({ type: 'fold', a: G.P(sw, 0), b: G.P(sw, sl) });
      P.push(stp);
      if (o.sandalStyle === 'tbar') { const tb = strip(sw * 2, (yS - yT) + Lv * 0.6, { name: 'T-bar', cut: { fabric: 2 } }); P.push(tb); }
      addNotion(out, o.shoeClosure, { snap: 'tiny snaps 4 mm', button: 'buttons 3–4 mm (with a snap behind)', buckle: 'mini buckles 3–4 mm', elastic: 'narrow elastic' }[o.shoeClosure], 2);
      out.plan.strap = { sl, sw };
    }
    if (it === 'espadrilles') addNotion(out, 'thread', 'strong thread / embroidery floss for the blanket stitch around the sole', 1);
  }
  out.pieces.push(...P);
  shoeSteps(out, P);
  out.flat = Object.assign({ kind: 'shoe', item: it, Ls, Ws, ring }, out.plan);
}
function sandalStraps(m, o, S, out, P, d) {
  const { Ls, Ws, girthAt, widthAt, la, card } = d;
  const L = m.footLength;
  const sw = Math.max(0.3, L * 0.07);
  const raw = o.construction === 'raw';
  const mkStrap = (name, len, n, note) => { const pc = strip(raw ? sw : sw * 2, len, { name, cut: { fabric: n, note: note || (raw ? 'raw edges' : 'fold lengthwise, stitch, turn') } }); if (raw) { pc.tags = pc.tags.map(() => 'none'); pc.edges = { none: { kind: 'none' } }; } else pc.marks.push({ type: 'fold', a: G.P(sw, 0), b: G.P(sw, len) }); P.push(pc); return pc; };
  const toeStrap = (u) => girthAt(u) - widthAt(u) * 0.95 + 2 * la;
  const st = o.sandalStyle;
  if (st === 'slide') {
    const w2 = Math.max(0.8, L * 0.3);
    const len = toeStrap(0.65);
    const pc = strip(w2, len, { name: 'Slide strap', cut: { fabric: 2, lining: raw ? 0 : 2, note: 'ends glued under the insole' } });
    P.push(pc);
  } else {
    mkStrap('Toe strap', toeStrap(0.78), 2, 'across the toes, ends under the insole');
    if (st === 'cross') { mkStrap('Cross strap', toeStrap(0.6) * 1.15, 4, 'two per shoe, crossing over the instep'); }
    const ank = m.ankleCirc * 1.05 + sw * 2;
    mkStrap('Ankle strap', ank, 2, 'around the ankle, closes at the outside');
    const heel = G.plen(splitAtY(d.ring, 0.22 * Ls).heel) + 2 * m.ankleHeight * 0.85 + 2 * la;
    mkStrap('Heel strap', heel, 2, 'from under the insole at both sides, round the back of the heel, up through the ankle-strap loop');
    if (st === 'tbar') mkStrap('T-bar', (0.78 - 0.45) * Ls + m.ankleHeight * 1.3, 2, 'from the toe strap up the instep to the ankle strap');
    addNotion(out, o.shoeClosure, { snap: 'tiny snaps 4 mm', button: 'buttons 3–4 mm (with a snap behind)', buckle: 'mini buckles ' + hwPick('buckle', sw * 10 + 0.5) + ' mm', elastic: 'narrow elastic' }[o.shoeClosure], 2);
  }
  out.plan.sandal = { sw, style: st };
}
function shoeSteps(out, P) {
  const { o, plan } = out;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  const card = o.soleMake === 'card' || o.soleMake === 'cord';
  const it = o.item;
  add('Make a toile first.', 'Cut the upper pieces in felt without lining, pin them around the doll\'s foot and check the heel height, the toe room and the throat. Adjust the "ease around the foot" if needed — every sculpt is different.');
  add('Cut the pieces.', 'Cut the uppers' + (o.shoeLining && it !== 'sandals' ? ', their lining' : '') + ' and the sole pieces. Flip the pattern for the second shoe (left / right). ' + (card ? 'Cut the insoles from card or thin plastic exactly on the line.' : 'Felt or faux leather soles need no finishing.'));
  if (it === 'sandals') {
    add('Make the straps.', o.construction === 'raw' ? 'Faux-leather straps: cut to width, no finishing needed.' : 'Fold each strap lengthwise right sides together, stitch, turn with a loop turner, press with the seam underneath.');
    add('Glue the straps to the insole.', 'Cover the insole: glue the insole cover on top and fold its edges under. Try the doll\'s foot on it and pin the straps in place, then glue the strap ends under the insole. The heel strap passes through a loop at the back of the ankle strap.');
    add('Glue on the outsole.', 'Glue the outsole under everything, clamp with clips and let it dry. Add the ' + o.shoeClosure + ' to the ankle strap.');
    return;
  }
  add('Sew the upper.', 'Sew the vamp to the heel piece at the side seams (right sides together) to make a ring. Do the same with the lining. ' + (o.shoeLining ? 'Place outer and lining right sides together, stitch the top line (opening), clip the curves, turn, press and edgestitch the top.' : 'Turn the top edge under and edgestitch, or bind it with a narrow bias.'));
  if (it === 'maryjanes') add('Add the strap.', 'Make the strap (or cut it from faux leather), stitch one end to the inside of the heel piece at the outside of the foot, and the ' + o.shoeClosure + ' at the other side.' + (o.sandalStyle === 'tbar' ? ' Sew the T-bar from the centre of the vamp to the strap.' : ''));
  if (card) add('Last the upper onto the insole.', 'Cover the insole with its fabric (glue). Run a gathering thread along the lower edge of the vamp. Put the upper on the doll\'s foot (cover the foot with cling film first), place the insole under the sole, then glue the lasting allowance under the insole a little at a time — heel first, then the toe, pulling up the gathers so the toe is smooth. Let it dry on the foot.');
  else add('Sew the upper to the sole.', 'Pin the upper to the sole edge, matching the back notch to the heel and the toe notch to the tip; ease the toe. Stitch by hand (backstitch) or with a whipstitch from the outside. Turn right side out.');
  if (card) add('Glue the outsole.', it === 'espadrilles' ? 'Coil the cord flat onto the outsole with glue, starting at the centre, until it covers the sole; trim, then glue the corded sole under the shoe. Blanket-stitch the upper\'s edge to the cord with floss for the classic espadrille look.' : 'Glue the outsole under the insole, covering the lasting allowance, clamp and let it dry on the foot.');
  add('Finish.', 'Let the shoes dry fully before removing them from the feet; trim any glue from the edges.');
}
