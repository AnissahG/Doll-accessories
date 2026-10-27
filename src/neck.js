// ===================== NECKWEAR, HAIR ACCESSORIES, OTHER STYLING =====================
// symmetric strip shape along x: widths[] = [[x, width], ...] (centre line y = 0)
function profilePiece(profile, name, cut, tags, opts) {
  tags = Object.assign({ edge: 'edge', end0: 'end', end1: 'end' }, tags || {});
  const top = profile.map(([x, w]) => G.P(x, -w / 2));
  const bot = profile.map(([x, w]) => G.P(x, w / 2)).reverse();
  const runs = [{ pts: top, tag: tags.edge }, { pts: [top[top.length - 1], bot[0]], tag: tags.end1 }, { pts: bot, tag: tags.edge }, { pts: [bot[bot.length - 1], top[0]], tag: tags.end0 }];
  const pc = runsPiece(runs, Object.assign({ name, cut }, opts || {}));
  const b = G.bbox(pc.pts);
  pc.grain = cut && cut.bias ? { a: G.P(b.x0 + b.w * 0.3 - b.h * 0.2, -b.h * 0.2), b: G.P(b.x0 + b.w * 0.3 + b.h * 0.2, b.h * 0.2) } : { a: G.P(b.x0 + b.w * 0.2, 0), b: G.P(b.x0 + b.w * 0.45, 0) };
  return pc;
}
// pointed end: adds a tip of length tl at x (width w → 0)
function tipped(profile, tl) { const last = profile[profile.length - 1]; return profile.concat([[last[0] + tl, 0.0001]]); }
function neckBand(m, o, P, out, C, w, name) {
  const ov = o.neckClosure === 'ties' ? C * 0.45 * 2 : o.neckClosure === 'hook' ? 0.3 : Math.max(w * 1.3, 0.6);
  const st = strip(w * 2, C + ov, { name: name || 'Neckband', cut: { fabric: 1, interfacing: o.interfacing === 'fusible' ? 1 : 0, note: 'fold lengthwise, stitch, turn — or fold the edges in and edgestitch' } });
  st.marks.push({ type: 'fold', a: G.P(w, 0), b: G.P(w, C + ov) });
  st.marks.push({ type: 'line', cls: 'centre', pts: [G.P(0, (C + ov) / 2), G.P(w * 2, (C + ov) / 2)], label: 'CF' });
  P.push(st);
  if (o.neckClosure === 'snap') addNotion(out, 'snap', 'snap ' + (HW.snap.filter(v => v / 10 <= w * 1.1).pop() || 4) + ' mm', 1);
  if (o.neckClosure === 'hook') addNotion(out, 'hook', 'hook & eye', 1);
  if (o.neckClosure === 'velcro') addNotion(out, 'velcro', 'thin sew-on hook & loop', 1, cm(Math.ceil(ov * 10) / 10));
  return st;
}
function buildNeck(m, o, S, out) {
  const P = [];
  out.plan.family = 'neck';
  out.used = ['neckCirc', 'neckToChin', 'frontNeckToWaist', 'chestCirc'];
  const k = m.k, it = o.item;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  add('Cut the pieces.', 'Cut the pieces' + (['tie', 'cravat'].includes(it) ? ' on the bias where marked (45° to the selvedge) so they drape and knot softly' : '') + '. Interface where noted. Seam allowance ' + (S.useSA ? fmt(S.sa) + ' cm' : 'not included') + ' — trim to 2 mm after stitching narrow pieces.');
  if (it === 'choker') {
    const C = m.neckCirc * 1.04;
    const w = +o.chokerW > 0 ? +o.chokerW : Math.max(0.4, m.neckToChin * 0.38);
    const st = o.chokerStyle;
    if (st === 'ring') {
      const ringMm = hwPick('ring', w * 10 + 0.5);
      const halfL = (C - ringMm / 10) / 2 + w * 1.2;
      const a = strip(w * 2, halfL, { name: 'Choker half (front to back)', cut: { fabric: 2, interfacing: o.interfacing === 'fusible' ? 2 : 0 } });
      a.marks.push({ type: 'fold', a: G.P(w, 0), b: G.P(w, halfL) }); P.push(a);
      addNotion(out, 'ring', 'O-ring ' + ringMm + ' mm', 1);
      add('Make the two halves.', 'Fold each strip lengthwise right sides together, stitch, turn, press. Loop one end of each half around the O-ring and stitch it down; the other ends overlap at the back for the closure.');
      if (o.neckClosure === 'snap') addNotion(out, 'snap', 'snap', 1);
    } else {
      const gapFront = st === 'lace-up' ? w * 0.7 : 0;
      neckBand(m, o, P, out, C - gapFront, w, 'Choker band');
      if (st === 'ruffled') { const rh = w * 0.9; const r = strip(C * 1.8, rh * 2, { name: 'Ruffle', cut: { fabric: 1, note: 'fold lengthwise, gather to the band length' } }); r.marks.push({ type: 'fold', a: G.P(0, rh), b: G.P(C * 1.8, rh) }); P.push(r); }
      if (st === 'lace-up') { addNotion(out, 'eyelet', 'mini eyelets 1.5 mm', 6); addNotion(out, 'lace', 'narrow ribbon for the front lacing', 1, cm(Math.ceil(w * 6 + 6))); }
      add('Make the band.', 'Fold the band lengthwise right sides together, stitch the long edge and one end, turn with a loop turner, press with the seam at the bottom edge. ' + (st === 'ruffled' ? 'Gather the folded ruffle and topstitch it along the lower edge, behind the band. ' : '') + (st === 'lace-up' ? 'The band\'s two ends meet at the front: set 3 eyelets at each end and lace them with ribbon; the back closes with the snap. ' : ''));
    }
    add('Add the closure.', 'Try it on the doll and sew the ' + ({ snap: 'snap', hook: 'hook & eye', ties: 'ties (the band ends)', velcro: 'hook & loop' }[o.neckClosure] || 'closure') + ' so the choker sits snugly but not tight.');
    out.readout.size = 'choker ' + cm(C) + ' around, ' + cm(w) + ' wide';
    out.plan.choker = { C, w };
  } else if (it === 'tie') {
    const wb = { classic: 8.5, skinny: 5, wide: 11 }[o.tieStyle] * k;
    const wn = Math.max(0.35, wb * 0.33), wt = wb * 0.55;
    const C = m.neckCirc * 1.12;
    const drop = m.frontNeckToWaist * ({ waist: 0.95, belt: 1.12, short: 0.6 }[o.tieLen] || 0.95);
    const knot = wn * 4;
    out.readout.size = 'blade ' + cm(wb) + ' wide, tip ' + cm(drop) + ' below the knot';
    out.plan.tie = { wb, wn, drop };
    if (o.tieMake === 'self') {
      // blade piece: blade tip → back of the neck; tail piece: tail tip → back of the neck; self-faced (cut double width)
      const Lb = drop + knot + C / 2, Lt = drop * 0.75 + knot + C / 2;
      const prof = (len, wEnd) => [[0, 2 * wEnd + 0.15], [len * 0.42, 2 * wEnd * 0.92 + 0.15], [len * 0.7, 2 * wn + 0.15], [len, 2 * wn + 0.15]];
      const blade = profilePiece([[-wb * 0.9, 0.0001]].concat(prof(Lb, wb)), 'Tie blade', { fabric: 1, bias: true, interfacing: o.interfacing === 'fusible' ? 1 : 0, note: 'long edges fold to the back and meet at the centre' }, { end1: 'seam' });
      const tail = profilePiece([[-wt * 0.9, 0.0001]].concat(prof(Lt, wt)), 'Tie tail', { fabric: 1, bias: true, interfacing: o.interfacing === 'fusible' ? 1 : 0 }, { end1: 'seam' });
      [blade, tail].forEach(pc => { pc.edges = { edge: { kind: 'none' }, end: { kind: 'none' }, seam: { kind: 'seam' } }; });
      const tipB = profilePiece([[-wb * 0.9, 0.0001], [0, 2 * wb], [wb * 1.2, 2 * wb]], 'Blade tip lining', { fabric: 0, lining: 1 }); tipB.edges = { edge: { kind: 'none' }, end: { kind: 'none' } };
      P.push(blade, tail, tipB);
      add('Join and face the tie.', 'Join blade and tail at the angled neck seam, press open. Place the tip lining on the blade tip right sides together, stitch the point, turn. Fold the long edges to the back so they meet at the centre (catch them with a slip stitch or a dab of fabric glue). Press lightly — a tie should stay soft, not sharp-creased.');
      add('Tie it.', 'Tie a small four-in-hand knot on the doll; it is easier with a tie this thin if you dampen it slightly.');
    } else {
      const Lb = drop + knot * 0.5;
      const blade = profilePiece([[-wb * 0.9, 0.0001], [0, 2 * wb + 0.15], [Lb * 0.55, 2 * wb * 0.92 + 0.15], [Lb, 2 * wb * 0.7 + 0.15]], 'Tie blade', { fabric: 1, bias: true, interfacing: o.interfacing === 'fusible' ? 1 : 0, note: 'long edges fold to the back' }, { end1: 'seam' });
      blade.edges = { edge: { kind: 'none' }, end: { kind: 'none' }, seam: { kind: 'seam' } };
      const kn = strip(wn * 2.6, wb * 1.5, { name: 'Knot', cut: { fabric: 1, bias: true, note: 'wraps around the top of the blade' } });
      P.push(blade, kn);
      neckBand(m, o, P, out, C, wn, 'Neckband');
      add('Make the blade.', 'Fold the long edges of the blade to the back (they meet at the centre), point the tip neatly and slip-stitch. Press.');
      add('Make the knot and assemble.', 'Fold the knot strip into a tube, wrap it around the top of the blade, gathering the blade a little so it looks knotted, and stitch it closed at the back. Make the neckband, sew the knot to its centre front, add the closure at the back. The tie hides under the collar.');
    }
  } else if (it === 'bowtie') {
    const bw = { butterfly: 11.5, batwing: 11, diamond: 11.5 }[o.bowStyle] * k * 0.5, bh = ({ butterfly: 6, batwing: 4, diamond: 6 }[o.bowStyle]) * k;
    const C = m.neckCirc * 1.12, wn = Math.max(0.3, bh * 0.4);
    out.readout.size = 'bow ' + cm(bw * 2) + ' × ' + cm(bh);
    out.plan.bow = { bw, bh };
    if (o.tieMake === 'pretied') {
      const lp = strip(bw * 2 + 0.2, bh * 2, { name: 'Bow', cut: { fabric: 1, interfacing: o.interfacing === 'fusible' ? 1 : 0, note: 'fold into a loop, pinch in the middle' } });
      lp.marks.push({ type: 'fold', a: G.P(0, bh), b: G.P(bw * 2 + 0.2, bh) });
      const kn = strip(wn * 2.2, bh * 2.2, { name: 'Knot', cut: { fabric: 1 } });
      P.push(lp, kn);
      neckBand(m, o, P, out, C, wn * 0.8, 'Neckband');
      add('Make the bow.', 'Fold the bow strip lengthwise right sides together, stitch the long edge, turn and press with the seam in the middle of the back. Bring the two ends to the centre back, overlap 1 mm and tack. Pinch the centre into pleats and wrap the knot strip around it; stitch at the back.');
      add('Attach to the neckband.', 'Make the neckband, sew the bow to its centre front and the closure at the back.');
    } else {
      const half = C / 2 + bw * 2.2;
      const end = o.bowStyle === 'batwing' ? [[C / 2, wn], [C / 2 + bw * 0.6, bh], [half, bh]] : o.bowStyle === 'diamond' ? [[C / 2, wn], [C / 2 + bw * 0.8, bh], [C / 2 + bw * 1.3, bh * 0.55], [C / 2 + bw * 1.9, bh], [half, 0.0001]] : [[C / 2, wn], [C / 2 + bw * 0.8, bh], [C / 2 + bw * 1.3, bh * 0.55], [C / 2 + bw * 1.9, bh], [half, bh * 0.8]];
      const pc = profilePiece([[0, wn]].concat(end), 'Bow tie half', { fabric: 2, lining: 2, interfacing: o.interfacing === 'fusible' ? 2 : 0, note: 'centre back seam at the narrow end' }, { end0: 'seam' });
      pc.edges = { edge: { kind: 'seam' }, end: { kind: 'seam' }, seam: { kind: 'seam' } };
      P.push(pc);
      add('Make the bow tie.', 'Sew the two halves together at the centre back (narrow ends), same for the lining. Place outer and lining right sides together, stitch all around leaving a gap at the neck, trim, turn with a loop turner, press, slip-stitch the gap.');
      add('Tie it.', 'Tie it on the doll like a shoelace bow; tweak the loops so the wide parts sit flat.');
    }
  } else if (it === 'cravat') {
    const C = m.neckCirc * 1.1;
    const w = +o.chokerW > 0 ? +o.chokerW : Math.max(1, 12 * k);
    const wn = Math.max(0.4, m.neckToChin * 0.5);
    out.readout.size = 'cravat ends ' + cm(w) + ' wide';
    if (o.cravatStyle === 'jabot') {
      neckBand(m, o, P, out, C, wn * 0.6, 'Neckband');
      [1, 0.8, 0.6].forEach((f, i) => { const r = strip(w * 2.2 * f, Math.max(0.6, w * 0.55 * f) * 2, { name: 'Jabot ruffle ' + (i + 1), cut: { fabric: 1, note: 'fold lengthwise, gather' } }); r.marks.push({ type: 'fold', a: G.P(0, r.isRect.h / 2), b: G.P(r.isRect.w, r.isRect.h / 2) }); P.push(r); });
      add('Make the jabot.', 'Fold each ruffle in half lengthwise, gather the raw edges to about a third of their length and stack them (largest at the back) on the centre front of the neckband, overlapping like a cascade. Stitch through all layers, cover the raw edges with a small fabric strip or a brooch.');
    } else {
      const drape = m.frontNeckToWaist * 0.42;
      const L = C + 2 * drape;
      const endProf = o.cravatStyle === 'ascot' ? [[0, 0.0001], [w * 0.6, w], [drape, w * 0.9], [drape + w * 0.2, wn], [L / 2, wn]] : [[0, w * 0.6], [w * 0.2, w], [drape, w * 0.9], [drape + w * 0.2, wn], [L / 2, wn]];
      const prof = endProf.concat(endProf.slice(0, -1).reverse().map(([x, ww]) => [L - x, ww]));
      const pc = profilePiece(prof, 'Cravat', { fabric: 2, bias: true, note: 'outer + lining (same fabric)' });
      pc.edges = { edge: { kind: 'seam' }, end: { kind: 'seam' } };
      P.push(pc);
      add('Make the cravat.', 'Place the two layers right sides together, stitch around leaving a gap at the neck, trim, turn, press. Fold the narrow neck section into soft pleats and tack them.');
      add('Tie it.', 'Wrap it around the neck under the collar, cross the ends at the front (ascot: loop one end over the other) and pin with a tiny tie pin' + (o.neckClosure === 'snap' ? ' — or sew a snap where the ends cross so it stays put.' : '.'));
    }
  }
  out.pieces.push(...P);
  out.flat = Object.assign({ kind: 'neck', item: it }, out.plan);
}
function buildHair(m, o, S, out) {
  const P = [];
  out.plan.family = 'hair';
  out.used = ['headCircWig', 'headEarToEar', 'crownToChin'];
  const Cw = m.headCircWig, k = m.k, it = o.item;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  if (it === 'scrunchie') {
    const E = Math.max(2.5, Cw * 0.2);
    const f = { skinny: [0.6, 2.2], regular: [1, 2.6], oversized: [1.6, 3.2] }[o.scrunchieSize] || [1, 2.6];
    const fw = Math.max(0.5, 4 * k * f[0]);
    const L = E * f[1];
    const pc = strip(L, fw * 2, { name: 'Scrunchie tube', cut: { fabric: 1 } });
    P.push(pc);
    addNotion(out, 'elastic', 'thin round elastic or 2–3 mm elastic', 1, cm(Math.ceil(E + 1)));
    out.readout.size = 'tube ' + cm(fw) + ' wide, elastic ' + cm(E);
    add('Sew the tube.', 'Fold the strip lengthwise right sides together and stitch the long edge, turn it right side out (a loop turner or a safety pin pulled through helps).');
    add('Add the elastic and close.', 'Thread the elastic through with a small safety pin, knot its ends securely, then tuck one raw end of the tube into the other (turned under) and slip-stitch around.');
  } else if (it === 'hairbow' || it === 'ribbonbow') {
    const bw = +o.bowW > 0 ? +o.bowW : Cw * (o.bowType === 'lolita' ? 0.48 : 0.22);
    const bh = bw * (o.bowType === 'lolita' ? 0.55 : 0.48);
    out.readout.size = 'bow ' + cm(bw) + ' wide × ' + cm(bh);
    out.plan.bow = { bw, bh };
    if (it === 'ribbonbow') {
      const rw = +o.ribbonMm > 0 ? +o.ribbonMm / 10 : Math.max(0.3, bh * 0.75);
      const loops = (o.bowType === 'double' ? 2 : 1);
      const L = loops * 2 * bw * 1.05 + (o.tails ? bw * 1.5 : 0) + rw * 3;
      addNotion(out, 'ribbon', 'ribbon ' + fmt(rw * 10, 0) + ' mm', 1, cm(Math.ceil(L)));
      const board = rectPiece(bw * 1.1, bw * 0.9, { top: 'none', right: 'none', bottom: 'none', left: 'none' }, { name: 'Bow former', kind: 'stiffener', cut: { fabric: 0, stiffener: 1, note: 'card: cut the slot, wrap the ribbon around it to make identical bows' } });
      board.isRect = null; board.edges = { none: { kind: 'none' } };
      board.marks.push({ type: 'cutout', pts: [G.P(bw * 0.53, 0), G.P(bw * 0.57, 0), G.P(bw * 0.57, bw * 0.6), G.P(bw * 0.53, bw * 0.6)], label: 'slot' });
      P.push(board);
      add('Make the bow on the former.', 'Lay the ribbon across the card with a tail hanging below, wrap it ' + (loops * 2) + ' times around the card, push the centre of the wraps into the slot and tie it tightly through the slot with thread. Slide the bow off and fluff the loops.');
      add('Finish.', (o.tails ? 'Cut the tails at an angle or in a V and seal them. ' : '') + 'Wrap a short piece of ribbon around the centre to cover the thread.');
    } else {
      const fus = o.interfacing === 'fusible' ? 1 : 0;
      if (o.bowType === 'flat') {
        const pc = strip(bw, bh, { name: 'Bow', cut: { fabric: 2, interfacing: fus } });
        P.push(pc);
        add('Make the bow.', 'Place the two bow layers right sides together, stitch around leaving a gap, turn, press, close the gap. Pinch the centre into two or three pleats.');
      } else {
        const lp = strip(bw * 2 + 0.2, bh * 2, { name: 'Bow loop', cut: { fabric: 1, interfacing: fus } });
        lp.marks.push({ type: 'fold', a: G.P(0, bh), b: G.P(bw * 2 + 0.2, bh) });
        P.push(lp);
        if (o.bowType === 'double') { const l2 = strip(bw * 1.6 + 0.2, bh * 1.6, { name: 'Second loop', cut: { fabric: 1, interfacing: fus } }); P.push(l2); }
        add('Make the loop.', 'Fold the loop strip lengthwise right sides together, stitch the long edge, turn and press with the seam in the centre back. Overlap the two ends at the centre back by 1–2 mm and tack them.' + (o.bowType === 'double' ? ' Make the second loop the same way and stack it on the first.' : ''));
      }
      const kn = strip(Math.max(0.4, bh * 0.5) * 2, bh * 2.2, { name: 'Knot', cut: { fabric: 1 } });
      P.push(kn);
      if (o.tails) {
        const tl = bw * (o.bowType === 'lolita' ? 1.4 : 1.1), tw = bh * 0.6;
        const tp = runsPiece([{ pts: [G.P(0, 0), G.P(tw, 0)], tag: 'top' }, { pts: [G.P(tw, 0), G.P(tw, tl)], tag: 'edge' }, { pts: [G.P(tw, tl), G.P(tw / 2, tl - tw * 0.45), G.P(0, tl)], tag: 'edge' }, { pts: [G.P(0, tl), G.P(0, 0)], tag: 'edge' }], { name: 'Tail', cut: { fabric: 4, mirrored: true, note: '2 tails, each two layers' } });
        tp.edges = { top: { kind: 'seam' }, edge: { kind: 'seam' } };
        P.push(tp);
        add('Make the tails.', 'Sew each pair of tail pieces right sides together along the sides and the V end, trim, turn, press.');
      }
      add('Assemble the bow.', 'Pinch the loop at the centre into pleats, ' + (o.tails ? 'lay the tails behind it, ' : '') + 'wrap the knot strip (edges folded in) tightly around the centre and stitch it at the back.');
    }
    const mount = { clip: 'mini alligator / snap clip', elastic: 'small hair elastic', sewn: '', headband: 'thin headband' }[o.bowMount];
    if (mount) { addNotion(out, 'mount', mount, 1, o.bowMount === 'clip' ? cm(Math.ceil(bw * 0.6 * 10) / 10) + ' long' : ''); add('Mount it.', 'Stitch or glue the ' + mount + ' to the back of the knot.'); }
  } else if (it === 'headband') {
    add('Cut the pieces.', 'Cut the band' + (o.headbandBack === 'cover' ? ' cover on the bias so it stretches smoothly around the curve' : '') + '; interface it if the fabric is soft.');
    const L = m.headEarToEar * 1.0;
    const wm = Math.max(0.5, 4 * k * (o.headbandStyle === 'knot' ? 1.4 : 1)), we = wm * 0.6;
    out.readout.size = 'band ' + cm(L) + ' ear to ear, ' + cm(wm) + ' wide';
    if (o.headbandBack === 'cover') {
      const tube = profilePiece([[0, we * 2 + 0.2], [L * 0.5, wm * 2 + 0.2], [L, we * 2 + 0.2]].map(([x, w2]) => [x, w2]), 'Headband cover', { fabric: 1, bias: true, note: 'sewn into a tube around a bought headband' }, {});
      tube.edges = { edge: { kind: 'seam' }, end: { kind: 'hem' } };
      P.push(tube);
      addNotion(out, 'headband', 'plain plastic / metal headband', 1, cm(Math.ceil(L)));
      add('Cover the headband.', 'Sew the cover into a tube, turn, slide it over the headband, turn the ends under and glue them around the headband tips.');
    } else {
      const band = profilePiece([[0, we], [L * 0.3, wm], [L * 0.7, wm], [L, we]], 'Headband', { fabric: 2, interfacing: o.interfacing === 'fusible' ? 1 : 0 }, {});
      band.edges = { edge: { kind: 'seam' }, end: { kind: 'seam' } };
      P.push(band);
      const E = Math.max(1.5, (m.headCircWig - L) * 0.75);
      const cas = strip(0.4 * 2 + 0.2, E * 1.6, { name: 'Elastic casing', cut: { fabric: 1 } });
      P.push(cas);
      addNotion(out, 'elastic', 'narrow elastic 3–4 mm', 1, cm(Math.ceil(E + 1)));
      if (o.headbandStyle === 'padded') addNotion(out, 'batting', 'thin batting / fleece strip', 1, cm(Math.ceil(L)));
      if (o.headbandStyle === 'knot') { const kn = strip(wm * 1.6, wm * 2, { name: 'Knot loop', cut: { fabric: 1 } }); P.push(kn); }
      add('Make the band.', 'Sew the two band layers right sides together along the long edges' + (o.headbandStyle === 'padded' ? ' (with the batting strip on top)' : '') + ', turn, press.' + (o.headbandStyle === 'knot' ? ' Fold the knot loop into a tube, wrap it around the middle of the band and stitch it at the back.' : o.headbandStyle === 'twist' ? ' Twist the centre once and tack it.' : ''));
      add('Add the elastic back.', 'Make the casing tube, thread the elastic through and stitch it at both ends; tuck the ends into the band ends and stitch through all layers.');
    }
  } else if (it === 'bandana' || it === 'headscarf' || it === 'kerchief') {
    add('Cut the scarf.', 'Cut on the straight grain' + (it === 'kerchief' ? ' (the long edge on the cross grain)' : '') + '. Light, soft fabric (cotton lawn, silk, voile) folds and knots best at doll scale.');
    const sz = { small: 0.85, medium: 1, large: 1.25 }[o.scarfSize] || 1;
    const hem = o.hemFinish === 'lined' ? 'seam' : o.hemFinish === 'fray' ? 'none' : 'hem';
    if (it === 'kerchief') {
      const base = Cw * 0.8 * sz, hh = base * 0.45;
      const pc = runsPiece([{ pts: [G.P(0, 0), G.P(base, 0)], tag: 'edge' }, { pts: [G.P(base, 0), G.P(base / 2, hh)], tag: 'edge' }, { pts: [G.P(base / 2, hh), G.P(0, 0)], tag: 'edge' }], { name: 'Kerchief', cut: { fabric: o.hemFinish === 'lined' ? 2 : 1 } });
      pc.edges = { edge: { kind: hem } };
      P.push(pc);
      if (o.ties) { const t = strip(0.8, Cw * 0.35, { name: 'Tie', cut: { fabric: 2 } }); t.marks.push({ type: 'fold', a: G.P(0.4, 0), b: G.P(0.4, Cw * 0.35) }); P.push(t); }
      out.readout.size = 'base ' + cm(base);
    } else {
      const s = it === 'bandana' ? Cw * 1.06 * sz : (2 * m.crownToChin + Cw * 0.5) / Math.SQRT2 * sz;
      const pc = strip(s, s, { name: it === 'bandana' ? 'Bandana' : 'Head scarf', cut: { fabric: o.hemFinish === 'lined' ? 2 : 1 } });
      pc.tags = pc.tags.map(() => 'edge'); pc.edges = { edge: { kind: hem } };
      pc.marks.push({ type: 'fold', a: G.P(0, 0), b: G.P(s, s), label: 'fold diagonally to wear' });
      P.push(pc);
      out.readout.size = cm(s) + ' square';
    }
    add('Finish the edges.', { rolled: 'Roll-hem all edges: fold under twice (2 mm + 2 mm) and stitch close to the fold, or use a rolled-hem foot. Mitre the corners by folding them in first.', narrow: 'Turn all edges under twice and edgestitch; fold the corners in first so they lie flat.', fray: 'Cut with pinking shears or leave raw and seal the edges with fray stopper.', lined: 'Place both layers right sides together, stitch all around leaving a gap, clip the corners, turn, press, close the gap.' }[o.hemFinish]);
  }
  out.pieces.push(...P);
  out.flat = Object.assign({ kind: 'hair', item: it }, out.plan);
}
function buildStyling(m, o, S, out) {
  if (o.item === 'suspenders') return buildSuspenders(m, o, S, out);
  const P = [];
  out.plan.family = 'styling';
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  const k = m.k;
  if (o.item === 'garters') {
    add('Cut the pieces.', 'Cut the pieces; the casing and ruffle are rectangles — measure and cut them with a ruler.');
    out.used = ['thighCirc', 'kneeCirc', 'waistCirc', 'waistToMidThigh'];
    if (o.garterStyle === 'belt') {
      const C = beltCirc(m, o.beltPos) + 0.3;
      const w = +o.beltW > 0 ? +o.beltW : Math.max(0.6, 5 * k);
      const band = strip(C + w * 1.2, w, { name: 'Garter belt band', cut: { fabric: 2, interfacing: 1 } });
      P.push(band);
      const drop = m.waistToMidThigh * 0.92 - (o.beltPos === 'hip' ? m.waistToHip : 0);
      addNotion(out, 'elastic', 'narrow elastic 3 mm for the suspenders', 4, cm(Math.ceil(drop * 0.8)) + ' each');
      addNotion(out, 'clip', 'garter clips / tiny suspender clips', 4);
      addNotion(out, 'hook', 'hooks & eyes', 2);
      out.readout.belt = 'band ' + cm(C) + ' around, straps about ' + cm(drop * 0.8);
      add('Make the band.', 'Interface one layer, sew the two layers right sides together along the top and bottom edges, turn, press. Close the ends and sew the hooks & eyes at the back.');
      add('Add the suspenders.', 'Thread each elastic through a clip and stitch it back; sew the other ends inside the band, two at the front and two at the back sides. Try on the doll with the stockings and adjust.');
    } else {
      const Ct = thighCircAt(m, o.thighPos);
      const E = Ct * 0.9;
      const w = +o.beltW > 0 ? +o.beltW : Math.max(0.4, 2 * k);
      const cas = strip(E * (o.garterStyle === 'ruffled' ? 1.9 : 1.15), w * 2 + 0.3, { name: 'Garter casing', cut: { fabric: 1, note: 'fold lengthwise; the elastic runs inside' } });
      cas.marks.push({ type: 'fold', a: G.P(0, w + 0.15), b: G.P(cas.isRect.w, w + 0.15) });
      P.push(cas);
      if (o.garterStyle === 'ruffled') { const r = strip(E * 2.2, w * 1.4, { name: 'Ruffle', cut: { fabric: 1, note: 'or lace' } }); P.push(r); }
      addNotion(out, 'elastic', 'elastic 2–3 mm', 1, cm(Math.ceil(E + 1)));
      if (o.garterStyle === 'flat') addNotion(out, 'lace', 'narrow lace', 1, cm(Math.ceil(Ct * 1.3)));
      out.readout.belt = 'garter elastic ' + cm(E) + ' (thigh ' + cm(Ct) + ')';
      add('Make the garter.', 'Fold the casing lengthwise ' + (o.garterStyle === 'ruffled' ? 'with the ruffle (or lace) sandwiched along the open edge' : 'with the lace along the edge') + ', stitch the long edge, thread the elastic through, overlap and stitch its ends, then close the casing by tucking one end into the other.');
    }
  } else if (o.item === 'sash') {
    out.used = ['waistCirc', 'shoulderToHip', 'chestCirc', 'waistToHip'];
    const st = o.sashStyle;
    let w = +o.sashW > 0 ? +o.sashW : Math.max(0.8, (st === 'bow' ? 10 : st === 'shoulder' ? 7 : 5) * k);
    let L;
    if (st === 'shoulder') L = 2 * Math.hypot(m.shoulderToHip, m.chestCirc * 0.25) + m.chestCirc * 0.2 + 1;
    else L = m.waistCirc + 2 * m.waistCirc * (st === 'bow' ? 0.75 : 0.6);
    const pc = profilePiece([[0, 0.0001], [w * 0.8, w], [L - w * 0.8, w], [L, 0.0001]], 'Sash', { fabric: 2, note: 'two layers (or fold one double-width strip)' });
    pc.edges = { edge: { kind: 'seam' }, end: { kind: 'seam' } };
    P.push(pc);
    out.readout.belt = 'sash ' + cm(L) + ' long, ' + cm(w) + ' wide';
    add('Make the sash.', 'Place the two layers right sides together, stitch around leaving a gap in the middle of one long edge, trim the points, turn, press, close the gap with edgestitching.');
    add(st === 'shoulder' ? 'Wear it.' : 'Tie it.', st === 'shoulder' ? 'Wear it over one shoulder to the opposite hip and tack (or snap) the ends together at the hip.' : st === 'bow' ? 'Wrap it around the waist and tie a big bow at the back; tack the bow so it stays.' : 'Wrap it around the waist and tie the ends at the side or the back.');
  }
  out.pieces.push(...P);
  out.flat = Object.assign({ kind: 'styling', item: o.item }, out.plan);
}
