// ===================== APRONS =====================
// Half (waist) apron, bib apron, maid / lolita apron, pinafore (cross-back) apron, tabard.
// - The apron skirt is a front panel on the fold at CF. Its finished top width covers the front of
//   the waist (55 %); fullness multiplies the cut width (gathered / pleated); hem shape is square,
//   rounded, curved or scalloped. A waistband runs on into ties that bow at the back.
// - The bib is a half piece on the fold at CF (self-lined), hung from a neck loop or shoulder straps
//   that cross at the back (optionally frilled — the maid look).
// - Pinafore: an A-line front from chest to hem, two back panels and wide straps crossing at the back.
// - Tabard: front and back panels joined at the shoulders, neck opening big enough for the head.

function apronLenCm(m, o) {
  const kA = Math.max(1, m.waistToAnkle - m.waistToKnee);
  return { short: m.waistToMidThigh, knee: m.waistToKnee, midi: m.waistToKnee + kA * 0.45, long: m.waistToAnkle * 0.97 }[o.apronLen] ?? m.waistToKnee;
}
const APRON_FULL = { flat: 1, gathered: 1.6, full: 2, pleated: 1.7 };

// skirt panel, half on the fold at CF: x = 0 at CF, top at y = 0
function apronSkirt(m, o, out, P, Wt, L, name) {
  const f = APRON_FULL[o.apronFull] || 1;
  const hw = Wt / 2 * f;                                     // cut half width
  const shape = o.apronShape;
  const ol = new Outline();
  ol.add([G.P(0, 0), G.P(hw, 0)], 'top');
  if (shape === 'rounded') {
    const rr = Math.min(hw, L) * 0.4;
    ol.add([G.P(hw, 0), G.P(hw, L - rr)], 'side');
    ol.add(G.bez(G.P(hw, L - rr), G.P(hw, L - rr * 0.45), G.P(hw - rr * 0.45, L), G.P(hw - rr, L), 10), 'hem');
    ol.add([G.P(hw - rr, L), G.P(0, L)], 'hem');
  } else if (shape === 'curved') {
    ol.add([G.P(hw, 0), G.P(hw, L * 0.45)], 'side');
    ol.add(G.bez(G.P(hw, L * 0.45), G.P(hw, L * 0.85), G.P(hw * 0.55, L), G.P(0, L), 16), 'hem');
  } else if (shape === 'scalloped') {
    const n = Math.max(3, Math.round(hw / Math.max(0.8, Wt * 0.12))), sw = hw / n, d = Math.min(sw * 0.4, L * 0.06);
    ol.add([G.P(hw, 0), G.P(hw, L - d)], 'side');
    const pts = [];
    for (let i = n; i > 0; i--) { const x1 = i * sw, x0 = (i - 1) * sw; pts.push(...G.qbez(G.P(x1, L - d), G.P((x0 + x1) / 2, L + d), G.P(x0, L - d), 8)); }
    ol.add(pts, 'hem');
  } else {
    ol.add([G.P(hw, 0), G.P(hw, L)], 'side');
    ol.add([G.P(hw, L), G.P(0, L)], 'hem');
  }
  ol.close('fold');
  const ruffled = o.apronHem === 'ruffle' || o.apronHem === 'double ruffle';
  const pc = pieceFromOutline(ol, { name: name || 'Apron skirt', cut: { fabric: 1, fold: true } });
  pc.foldTag = 'fold'; pc.edges.fold = { kind: 'fold' };
  pc.edges.top = { kind: 'seam', label: f > 1 ? (o.apronFull === 'pleated' ? 'pleated to fit' : 'gathered to fit') : 'joins the waistband' };
  pc.edges.side = ruffled ? { kind: 'seam', label: 'ruffle' } : { kind: 'hem', sa: 0.5, label: 'narrow hem' };
  pc.edges.hem = ruffled ? { kind: 'seam', label: 'ruffle' } : o.apronHem === 'lace' ? { kind: 'hem', sa: 0.3, label: 'narrow hem + lace' } : { kind: 'hem', label: shape === 'curved' || shape === 'rounded' ? 'curved hem' : 'hem' };
  pc.grain = { a: G.P(Math.min(1, hw * 0.2), L * 0.15), b: G.P(Math.min(1, hw * 0.2), L * 0.8) };
  if (f > 1 && o.apronFull !== 'pleated') pc.marks.push({ type: 'gather', pts: [G.P(0.1, 0.02), G.P(hw - 0.1, 0.02)], label: '' });
  if (o.apronFull === 'pleated') {
    const nP = Math.max(2, Math.round(Wt / 2 / Math.max(0.8, Wt * 0.12))), take = (hw - Wt / 2) / nP;
    for (let i = 0; i < nP; i++) { const x = (Wt / 2) * (i + 0.5) / nP + take * i; pc.marks.push({ type: 'pleat', a: G.P(x, 0), b: G.P(x, Math.min(L * 0.25, 3)), w: take / 2, dir: 1, label: i ? '' : 'pleat' }); }
    pc.notes.push(nP + ' knife pleats each side, ' + cm(take / 2) + ' deep, folded toward the sides.');
  }
  // pockets: placed where they land once the top is gathered
  if (o.apronPockets && o.apronPockets !== 'none') {
    const pw = Math.max(1.2, Wt * 0.24), ph = pw * (o.apronPockets === 'heart' ? 0.95 : 0.85);
    const n = o.apronPockets === 'one' ? 1 : 2;
    const xs = n === 1 ? [Wt * 0.22 * f] : [Wt * 0.22 * f];
    xs.forEach(x => pc.marks.push({ type: 'place', pts: [G.P(x - pw / 2, L * 0.22), G.P(x + pw / 2, L * 0.22), G.P(x + pw / 2, L * 0.22 + ph), G.P(x - pw / 2, L * 0.22 + ph)], label: 'pocket' }));
    let pk;
    if (o.apronPockets === 'heart') {
      const hol = new Outline(), w = pw / 2;
      hol.add(G.bez(G.P(0, ph), G.P(-w * 1.1, ph * 0.55), G.P(-w * 1.15, -ph * 0.05), G.P(-w * 0.5, 0), 10), 'edge');
      hol.add(G.bez(G.P(-w * 0.5, 0), G.P(-w * 0.15, -ph * 0.02), G.P(0, ph * 0.12), G.P(0, ph * 0.18), 6), 'edge');
      hol.add(G.bez(G.P(0, ph * 0.18), G.P(0, ph * 0.12), G.P(w * 0.15, -ph * 0.02), G.P(w * 0.5, 0), 6), 'edge');
      hol.add(G.bez(G.P(w * 0.5, 0), G.P(w * 1.15, -ph * 0.05), G.P(w * 1.1, ph * 0.55), G.P(0, ph), 10), 'edge');
      hol.close('edge');
      pk = pieceFromOutline(hol, { name: 'Heart pocket', cut: { fabric: 2 * (n === 1 ? 1 : 2), note: 'outer + lining, the top dip is the opening' } });
      pk.grain = { a: G.P(0, ph * 0.3), b: G.P(0, ph * 0.8) };
    } else {
      pk = strip(pw, ph + Math.max(0.6, ph * 0.25), { name: 'Pocket', cut: { fabric: n } }, { top: 'hem', right: 'seam', bottom: 'seam', left: 'seam' });
      pk.edges.hem = { kind: 'hem', sa: 0.5, label: 'pocket top' };
    }
    P.push(pk);
    if (n === 2) pc.notes.push('Two pockets: the one marked + its mirror on the other half.');
  }
  P.push(pc);
  // hem ruffle(s) round the sides and hem
  const edgeL = 2 * (edgeLength(pc, 'side') + edgeLength(pc, 'hem'));
  if (ruffled) {
    const rh = Math.max(0.6, L * 0.14);
    [rh, o.apronHem === 'double ruffle' ? rh * 0.7 : 0].filter(Boolean).forEach((h, i) => {
      const len = edgeL / f * 1.8;
      const r = strip(Math.min(len, 140), h + 0.6, { name: i ? 'Second ruffle' : 'Ruffle', cut: { fabric: Math.max(1, Math.ceil(len / 140)), note: 'narrow-hem one long edge, gather the other to fit the sides and hem' + (len > 140 ? '; join strips' : '') } }, { top: 'seam', right: 'seam', bottom: 'hem', left: 'seam' });
      r.edges.hem = { kind: 'hem', sa: o.apronLace ? 0.3 : 0.5, label: 'narrow hem' };
      r.marks.push({ type: 'gather', pts: [G.P(0.2, 0.05), G.P(Math.min(len, 140) - 0.2, 0.05)], label: '' });
      P.push(r);
    });
  }
  if (o.apronHem === 'lace' || o.apronLace) addNotion(out, 'lace', 'lace edging', 1, cm(Math.ceil((ruffled ? edgeL / f * 1.8 : edgeL) * 1.05)));
  return { pc, hw, L, f, edgeL };
}
function apronBandTies(m, o, out, P, Wt, wbIn) {
  const wb = wbIn || Math.max(0.6, m.waistToHip * 0.2);
  const big = o.bowSize === 'big';
  const tieL = m.waistCirc * 0.55 * (big ? 1.5 : 1) + 1;
  const tw = wb * (big ? 1.9 : 1);
  const band = strip(Wt + 0.4, wb * 2, { name: 'Waistband', cut: { fabric: 1, interfacing: 1, note: 'folded lengthwise over the top of the skirt' } });
  band.marks.push({ type: 'fold', a: G.P(0, wb), b: G.P(Wt + 0.4, wb), label: 'fold' });
  band.marks.push({ type: 'notch', p: G.P((Wt + 0.4) / 2, 0), n: 1 });
  const tie = strip(tieL, tw * 2, { name: big ? 'Bow tie (big)' : 'Waist tie', cut: { fabric: 2, note: 'folded, stitched, turned; one end slanted' } });
  tie.marks.push({ type: 'fold', a: G.P(0, tw), b: G.P(tieL, tw), label: 'fold' });
  P.push(band, tie);
  return { wb, tieL, tw };
}

function buildApron(m, o, S, out) {
  const P = [];
  out.plan.family = 'apron';
  out.used = ['waistCirc', 'hipCirc', 'chestCirc', 'acrossFront', 'acrossBack', 'frontNeckToWaist', 'napeToWaist', 'waistToKnee', 'waistToAnkle', 'waistToMidThigh', 'neckCirc', 'shoulderWidth', 'armholeDepth', 'headCirc'];
  const it = o.item, k = m.k;
  const add = (q, d) => out.steps.push({ quick: q, detail: d });
  const L = apronLenCm(m, o);
  const Wt = m.waistCirc * 0.55 + 0.4;
  const plan = out.plan;
  add('Cut the pieces.', 'Cut the pieces; transfer the gather / pleat marks and pocket placements. Crisp cotton, linen or broadcloth makes the neatest aprons at doll scale' + (it === 'maidapron' ? '; for a maid / lolita apron, a fine white cotton with lace is classic.' : '.'));
  if (it === 'halfapron' || it === 'bibapron' || it === 'maidapron') {
    const sk = apronSkirt(m, o, out, P, Wt, L);
    const bt = apronBandTies(m, o, out, P, Wt);
    plan.apron = { type: 'waist', Wt, L, f: sk.f, wb: bt.wb, tieL: bt.tieL, tw: bt.tw };
    if (sk.f > 1) add(o.apronFull === 'pleated' ? 'Pleat the top.' : 'Gather the top.', o.apronFull === 'pleated' ? 'Fold the pleats along the marks toward the sides and baste them across the top — the top should now measure ' + cm(Wt) + '.' : 'Run two gathering rows across the top and pull them up to ' + cm(Wt) + '.');
    if (o.apronPockets && o.apronPockets !== 'none') add('Make and attach the pocket' + (o.apronPockets === 'one' ? '' : 's') + '.', o.apronPockets === 'heart' ? 'Sew each heart to its lining round the edge, leaving a small gap; clip the curves and the dip, turn, press. Edgestitch it on the placement, leaving the top dip open.' : 'Hem the pocket top, press the other edges under and edgestitch it on the placement — do this before gathering.');
    if (o.apronHem === 'ruffle' || o.apronHem === 'double ruffle') add('Add the ruffle' + (o.apronHem === 'double ruffle' ? 's' : '') + '.', 'Narrow-hem the long edge' + (o.apronLace ? ' (with the lace under it)' : '') + ', gather the other edge and sew it round the sides and hem, right sides together. Finish the seam and press it toward the apron; topstitch.' + (o.apronHem === 'double ruffle' ? ' Baste the shorter ruffle on top of the longer one first.' : ''));
    else add('Hem the sides and hem.', 'Turn a narrow hem round the sides and the hem' + (o.apronHem === 'lace' ? ', sewing the lace under it as you go' : '') + '. On curves, keep the hem very narrow.');
    if (it !== 'halfapron') {
      // bib
      const bh = m.frontNeckToWaist * (it === 'maidapron' ? 0.72 : 0.68), bt2 = m.acrossFront * 0.38, bb = m.acrossFront * 0.44;
      const shp = o.bibShape;
      const ol = new Outline();
      ol.add([G.P(0, bh), G.P(bb, bh)], 'bottom');
      if (shp === 'heart') {
        ol.add(G.bez(G.P(bb, bh), G.P(bb * 1.05, bh * 0.45), G.P(bb * 1.15, -bh * 0.05), G.P(bb * 0.55, 0), 12), 'edge');
        ol.add(G.bez(G.P(bb * 0.55, 0), G.P(bb * 0.2, 0), G.P(0, bh * 0.1), G.P(0, bh * 0.2), 8), 'edge');
      } else if (shp === 'rounded') {
        ol.add([G.P(bb, bh), G.P(bt2, bh * 0.25)], 'edge');
        ol.add(G.bez(G.P(bt2, bh * 0.25), G.P(bt2, bh * 0.05), G.P(bt2 * 0.7, 0), G.P(bt2 * 0.45, 0), 8), 'edge');
        ol.add([G.P(bt2 * 0.45, 0), G.P(0, 0)], 'edge');
      } else if (shp === 'scalloped') {
        ol.add([G.P(bb, bh), G.P(bt2, 0)], 'edge');
        const n = 3, sw = bt2 / n, d = Math.min(sw * 0.5, bh * 0.08), pts = [];
        for (let i = n; i > 0; i--) pts.push(...G.qbez(G.P(i * sw, 0), G.P((i - 0.5) * sw, -d * 2), G.P((i - 1) * sw, 0), 6));
        ol.add(pts, 'edge');
      } else { ol.add([G.P(bb, bh), G.P(bt2, 0)], 'edge'); ol.add([G.P(bt2, 0), G.P(0, 0)], 'edge'); }
      ol.close('fold');
      const bib = pieceFromOutline(ol, { name: 'Bib', cut: { fabric: 2, fold: true, interfacing: o.interfacing === 'fusible' ? 1 : 0, note: 'bib + bib lining' } });
      bib.foldTag = 'fold'; bib.edges.fold = { kind: 'fold' }; bib.edges.edge = { kind: 'seam' }; bib.edges.bottom = { kind: 'seam', label: 'joins the waistband' };
      bib.grain = { a: G.P(Math.min(0.6, bb * 0.3), bh * 0.25), b: G.P(Math.min(0.6, bb * 0.3), bh * 0.85) };
      P.push(bib);
      const g = Math.max(0.3, m.frontNeckToWaist - bh);                    // bib top → base of the neck
      const sw = Math.max(0.5, k * 0.9);
      let sL, nStr, sNote;
      if (o.apronStraps === 'neck loop') { sL = 2 * (g * 1.05 + m.neckCirc * 0.32) + 1; nStr = 1; sNote = 'neck loop: one end on each bib corner'; }
      else { sL = g + Math.hypot(m.napeToWaist * 1.02, m.acrossBack * 0.55) + 1.5; nStr = 2; sNote = o.apronStraps === 'button-on' ? 'buttoned to the waistband at the back' : 'cross at the back and are sewn to the waistband ends'; }
      const strap = strip(sL, sw * 2, { name: o.apronStraps === 'neck loop' ? 'Neck strap' : 'Shoulder strap', cut: { fabric: nStr, note: 'folded, stitched, turned — ' + sNote } });
      strap.marks.push({ type: 'fold', a: G.P(0, sw), b: G.P(sL, sw), label: 'fold' });
      P.push(strap);
      if (o.frillStraps && o.apronStraps !== 'neck loop') {
        const fl2 = sL * 0.55 * 1.8, fh = sw * 1.8;
        const fr = strip(fl2, fh + 0.5, { name: 'Strap frill', cut: { fabric: 2, note: 'narrow-hemmed, gathered into the outer edge of each strap over the shoulder' } }, { top: 'seam', right: 'seam', bottom: 'hem', left: 'seam' });
        fr.edges.hem = { kind: 'hem', sa: 0.3, label: 'narrow hem' };
        fr.marks.push({ type: 'gather', pts: [G.P(0.2, 0.05), G.P(fl2 - 0.2, 0.05)], label: '' });
        P.push(fr);
        add('Make the frilled straps.', 'Narrow-hem one long edge of each frill, gather the other to cover the shoulder part of the strap (about ' + cm(sL * 0.55) + ') and sew it into the outer edge of the strap as you stitch it.');
      }
      if (o.apronStraps === 'button-on') addNotion(out, 'button', 'buttons for the strap ends', 2);
      add('Make the bib.', 'Place bib and bib lining right sides together with the strap ends sandwiched at the top corners. Stitch round the sides and top, leaving the bottom open. Clip, turn, press, edgestitch.');
      add('Assemble.', 'Sew the bib to the centre of the waistband and the skirt below it. Fold the waistband over, slip the tie ends into its open ends, turn the edge under and topstitch all round.' + (o.apronStraps === 'neck loop' ? '' : ' Cross the straps at the back and ' + (o.apronStraps === 'button-on' ? 'button them to the waistband.' : 'sew them to the waistband ends on the doll.')));
      plan.apron.bib = { bh, bt: bt2, bb, shp, straps: o.apronStraps, frill: !!o.frillStraps, sL };
    } else add('Add the waistband and ties.', 'Make the ties (fold, stitch, turn). Sew the waistband to the gathered top right sides together, fold it over, slip the ties into the open ends, turn the edge under and topstitch all round.');
  } else if (it === 'pinafore') {
    const topF = m.frontNeckToWaist * 0.42;                          // top edge below the neck
    const hTop = m.frontNeckToWaist - topF;                          // top edge → waist
    const H = hTop + L;
    const tw = m.acrossFront * 0.46, uw = m.chestCirc * 0.25 * 1.12, hemW = Math.max(m.hipCirc * 0.3 * 1.25, uw * 1.25);
    const yU = Math.min(hTop * 0.55, m.armholeDepth * 0.5);
    const front = new Outline();
    front.add([G.P(0, 0), G.P(tw, 0)], 'top');
    front.add(G.bez(G.P(tw, 0), G.P(tw, yU * 0.6), G.P(uw * 0.9, yU), G.P(uw, yU), 8), 'armhole');
    front.add([G.P(uw, yU), G.P(hemW, H)], 'side');
    front.add(G.qbez(G.P(hemW, H), G.P(hemW * 0.5, H + H * 0.02), G.P(0, H + H * 0.02), 8), 'hem');
    front.close('fold');
    const F = pieceFromOutline(front, { name: 'Pinafore front', cut: { fabric: 1, fold: true } });
    F.foldTag = 'fold'; F.edges.fold = { kind: 'fold' }; F.edges.top = { kind: 'seam', label: 'faced' }; F.edges.armhole = { kind: 'seam', label: 'bound' }; F.edges.side = { kind: 'seam' }; F.edges.hem = { kind: 'hem' };
    F.grain = { a: G.P(Math.min(1, tw * 0.3), H * 0.2), b: G.P(Math.min(1, tw * 0.3), H * 0.8) };
    const sideJoin = m.waistToHip + hTop - yU;
    F.marks.push({ type: 'dot', kind: 'dot', p: G.lerp(G.P(uw, yU), G.P(hemW, H), Math.min(0.9, sideJoin / Math.max(1, H - yU))), label: 'side seam ends' });
    if (o.apronPockets && o.apronPockets !== 'none') F.marks.push({ type: 'place', pts: [G.P(hemW * 0.25, H * 0.5), G.P(hemW * 0.7, H * 0.5), G.P(hemW * 0.7, H * 0.66), G.P(hemW * 0.25, H * 0.66)], label: 'pocket' });
    // back: two panels that overlap at CB
    const bw = m.acrossBack * 0.5 + m.chestCirc * 0.04, bHem = hemW * 0.95, Hb = H - topF * 0.1;
    const back = new Outline();
    back.add([G.P(-bw * 0.35, 0), G.P(bw * 0.5, 0)], 'top');
    back.add(G.bez(G.P(bw * 0.5, 0), G.P(bw * 0.55, yU * 0.6), G.P(uw * 0.9, yU), G.P(uw, yU), 8), 'armhole');
    back.add([G.P(uw, yU), G.P(bHem, Hb)], 'side');
    back.add([G.P(bHem, Hb), G.P(-bw * 0.35, Hb)], 'hem');
    back.add([G.P(-bw * 0.35, Hb), G.P(-bw * 0.35, 0)], 'cb');
    back.close('cb');
    const B = pieceFromOutline(back, { name: 'Pinafore back', cut: { fabric: 2, mirrored: true, note: 'the two backs overlap at the centre' } });
    B.edges.cb = { kind: 'hem', sa: 0.6, label: 'hem' }; B.edges.top = { kind: 'seam', label: 'faced' }; B.edges.armhole = { kind: 'seam', label: 'bound' }; B.edges.side = { kind: 'seam' }; B.edges.hem = { kind: 'hem' };
    B.grain = { a: G.P(0, Hb * 0.2), b: G.P(0, Hb * 0.8) };
    const swd = Math.max(0.7, m.acrossFront * 0.12);
    const sL = topF + Math.hypot(m.napeToWaist * 0.45, m.acrossBack * 0.55) + 1.2;
    const strap = strip(sL, swd * 2, { name: 'Cross strap', cut: { fabric: 2, note: 'folded, stitched, turned' } });
    strap.marks.push({ type: 'fold', a: G.P(0, swd), b: G.P(sL, swd), label: 'fold' });
    P.push(F, B, strap);
    if (o.apronPockets && o.apronPockets !== 'none') { const pk = strip(hemW * 0.45, H * 0.2, { name: 'Pocket', cut: { fabric: 1 } }, { top: 'hem', right: 'seam', bottom: 'seam', left: 'seam' }); pk.edges.hem = { kind: 'hem', sa: 0.5 }; P.push(pk); }
    const bind = strip((G.plen(edgeRuns(F.pts, F.tags).armhole[0].pts) + G.plen(edgeRuns(B.pts, B.tags).armhole[0].pts)) * 2 + 1, Math.max(0.5, k * 0.8) * 4, { name: 'Armhole & top binding', cut: { fabric: 1, bias: true, note: 'bias strip; binds the armholes (and the top edges if you prefer binding to facing)' } });
    P.push(bind);
    add('Sew the side seams.', 'Front to backs at the sides, from the armhole down to the dot; hem the slits below.');
    add('Bind the armholes, face the top.', 'Bind the armhole curves with the bias strip. Make the straps; sandwich one end at each front top corner and finish the top edges (fold under twice or bind).');
    add('Attach the straps.', 'On the doll, cross the straps at the back and sew each to the top of the opposite back panel. Hem the centre-back edges and the hem.');
    plan.apron = { type: 'pinafore', topF, H, tw, uw, hemW, yU, L };
  } else if (it === 'tabard') {
    const Hs = m.frontNeckToWaist + L, Hb = m.napeToWaist + L;
    const pw = m.acrossFront * 0.5 + m.chestCirc * 0.05;         // half panel width
    const nw = Math.max(m.neckCirc / Math.PI * 0.62, 0.8);        // half neck width
    const dB = Math.max(0.2, m.neckCirc * 0.04);
    const per = (dF) => 2 * Math.PI * nw * 0.5 + 2 * (dF + dB) * 0.9;     // rough neck opening perimeter
    let dF = Math.max(m.neckCirc * 0.14, 0.6);
    for (let i = 0; i < 40 && per(dF) < m.headCirc * 1.04; i++) dF += 0.15;
    // keep the front neckline modest: past a quarter of the way to the waist, open a back slit instead
    const maxDF = m.frontNeckToWaist * 0.25;
    let slit = 0;
    if (dF > maxDF) { dF = maxDF; slit = Math.max(0, (m.headCirc * 1.04 - per(dF)) / 2); }
    const mk = (front) => {
      const d = front ? dF : dB, H = front ? Hs : Hb, ol = new Outline();
      const neck = o.tabardNeck === 'V' && front ? [G.P(nw, 0), G.P(0, d * 1.25)] : o.tabardNeck === 'square' && front ? [G.P(nw, 0), G.P(nw, d), G.P(0, d)] : G.bez(G.P(nw, 0), G.P(nw, d * 0.6), G.P(nw * 0.55, d), G.P(0, d), 10);
      ol.add(neck.slice().reverse(), 'neck');
      ol.add([G.P(nw, 0), G.P(pw, Math.max(0.15, m.shoulderWidth * 0.12))], 'shoulder');
      ol.add([G.P(pw, Math.max(0.15, m.shoulderWidth * 0.12)), G.P(pw, H)], 'side');
      if (o.tabardHem === 'pointed') ol.add([G.P(pw, H), G.P(0, H + pw * 0.6)], 'hem');
      else if (o.tabardHem === 'rounded') ol.add(G.bez(G.P(pw, H), G.P(pw, H + pw * 0.4), G.P(pw * 0.5, H + pw * 0.45), G.P(0, H + pw * 0.45), 10), 'hem');
      else ol.add([G.P(pw, H), G.P(0, H)], 'hem');
      ol.close('fold');
      const pc = pieceFromOutline(ol, { name: front ? 'Tabard front' : 'Tabard back', cut: { fabric: 2, fold: true, note: 'outer + lining (or one layer with hemmed edges)' } });
      pc.foldTag = 'fold'; pc.edges.fold = { kind: 'fold' }; pc.edges.neck = { kind: 'seam' }; pc.edges.shoulder = { kind: 'seam' }; pc.edges.side = { kind: 'seam' }; pc.edges.hem = { kind: 'seam' };
      pc.grain = { a: G.P(Math.min(1, pw * 0.3), H * 0.25), b: G.P(Math.min(1, pw * 0.3), H * 0.8) };
      if (o.tabardTie === 'side ties') pc.marks.push({ type: 'dot', kind: 'dot', p: G.P(pw - 0.05, (front ? m.frontNeckToWaist : m.napeToWaist)), label: 'tie' });
      if (!front && slit > 0.05) { pc.marks.push({ type: 'cut', a: G.P(0, d), b: G.P(0, d + slit), label: 'back slit' }); pc.marks.push({ type: 'dot', kind: 'button', p: G.P(0.35, d + 0.2), label: '' }); }
      return pc;
    };
    P.push(mk(true), mk(false));
    if (o.tabardTie === 'side ties') { const tl = (m.waistCirc - pw * 4) / 2 + 3, twd = Math.max(0.35, k * 0.5); const t = strip(Math.max(3, tl), twd * 2, { name: 'Side tie', cut: { fabric: 4, note: 'one at each side of the front and the back' } }); t.marks.push({ type: 'fold', a: G.P(0, twd), b: G.P(Math.max(3, tl), twd), label: 'fold' }); P.push(t); }
    if (o.tabardTie === 'belt') { const bl = m.waistCirc * 1.25 + 4, bw2 = Math.max(0.6, m.waistToHip * 0.2); const b = strip(bl, bw2 * 2, { name: 'Belt', cut: { fabric: 1, interfacing: 1 } }); b.marks.push({ type: 'fold', a: G.P(0, bw2), b: G.P(bl, bw2), label: 'fold' }); P.push(b); }
    if (slit > 0.05) { out.notes.push('Neck opening: ' + cm(per(dF)) + ' round plus a ' + cm(slit) + ' slit at the back of the neck, closed with a tiny button and loop — so the head (' + cm(m.headCirc) + ') goes through while the front neckline stays high.'); addNotion(out, 'button', 'tiny button + thread loop for the back slit', 1); add('Make the back slit.', 'Before lining, cut the slit down the back fold; when you sew the lining on round the neck, stitch round the slit too, then cut, turn and press. Add the button and a thread loop at the top.'); }
    else out.notes.push('Neck opening: about ' + cm(per(dF)) + ' round — enough for the head (' + cm(m.headCirc) + ') to go through without a fastening.');
    add('Join the shoulders.', 'Sew front to back at the shoulders, outer and lining separately.');
    add('Line the tabard.', 'Lay the lining over it right sides together' + (o.tabardTie === 'side ties' ? ', with the ties sandwiched at the side dots' : '') + '. Stitch round the neck and all the outer edges, leaving a gap; clip, turn through the gap, press, close it, edgestitch.');
    plan.apron = { type: 'tabard', Hs, Hb, pw, nw, dF, dB, L, slit };
  }
  out.pieces.push(...P);
  out.readout.size = 'length ' + cm(L) + ' below the waist';
  out.flat = Object.assign({ kind: 'apron', item: it }, plan.apron || {});
}

function apronFlat(out, F) {
  const m = out.m, o = out.o;
  const T = torso(m, true);
  const yW = m.shoulderToWaist, nw0 = m.neckCirc / Math.PI / 2;
  const hipW = m.hipCirc / Math.PI / 2 * 1.3;
  const views = [];
  ['FRONT', 'BACK'].forEach(label => {
    const front = label === 'FRONT', items = [ln(T, 'flatd')];
    const wavy = (x0, x1, y, amp) => { const p = []; for (let i = 0; i <= 14; i++) p.push(G.P(x0 + (x1 - x0) * i / 14, y + (i % 2 ? amp : 0))); return p; };
    if (F.type === 'waist') {
      const hw = Math.min(hipW * 0.95, F.Wt / 2 * 1.15), L = F.L;
      const bottom = hw * (F.f > 1 ? 1.25 : 1.05);
      if (front) {
        const sh = o.apronShape === 'curved' ? G.spline([G.P(-hw, yW), G.P(-bottom, yW + L * 0.5), G.P(-bottom * 0.6, yW + L * 0.95), G.P(0, yW + L), G.P(bottom * 0.6, yW + L * 0.95), G.P(bottom, yW + L * 0.5), G.P(hw, yW)], 8)
          : o.apronShape === 'rounded' ? [G.P(-hw, yW), G.P(-bottom, yW + L * 0.75), G.P(-bottom * 0.8, yW + L), G.P(bottom * 0.8, yW + L), G.P(bottom, yW + L * 0.75), G.P(hw, yW)]
            : [G.P(-hw, yW), G.P(-bottom, yW + L), G.P(bottom, yW + L), G.P(hw, yW)];
        items.push(fl(sh));
        if (o.apronShape === 'scalloped') items.push(ln(wavy(-bottom, bottom, yW + L, L * 0.04), 'flat'));
        if (F.f > 1) for (let i = 1; i < 10; i++) { const x = -hw + hw * 2 * i / 10; items.push(dashed([G.P(x, yW + F.wb), G.P(x * 1.15, yW + F.wb + L * 0.25)])); }
        if (o.apronHem === 'ruffle' || o.apronHem === 'double ruffle') { items.push(ln(wavy(-bottom * 1.08, bottom * 1.08, yW + L + L * 0.13, -L * 0.03), 'flat')); items.push(ln([G.P(-bottom, yW + L), G.P(-bottom * 1.08, yW + L + L * 0.13)], 'flat'), ln([G.P(bottom, yW + L), G.P(bottom * 1.08, yW + L + L * 0.13)], 'flat')); }
        if (o.apronHem === 'lace' || o.apronLace) items.push(dashed(wavy(-bottom, bottom, yW + L + (o.apronHem.includes('ruffle') ? L * 0.15 : 0.25), 0.2)));
        if (o.apronPockets && o.apronPockets !== 'none') [-1, 1].slice(o.apronPockets === 'one' ? 1 : 0).forEach(sg => { const cx = sg * hw * 0.5, py = yW + L * 0.3, pw = F.Wt * 0.12; items.push(o.apronPockets === 'heart' ? fl(G.spline([G.P(cx, py + pw * 1.6), G.P(cx - pw, py + pw * 0.6), G.P(cx - pw * 0.6, py), G.P(cx, py + pw * 0.3), G.P(cx + pw * 0.6, py), G.P(cx + pw, py + pw * 0.6), G.P(cx, py + pw * 1.6)], 6)) : fl([G.P(cx - pw, py), G.P(cx + pw, py), G.P(cx + pw, py + pw * 1.6), G.P(cx - pw, py + pw * 1.6)])); });
        if (F.bib) {
          const b = F.bib, top = yW - b.bh, tw = b.bt * 1.05, bw = b.bb * 1.05;
          const bibPts = b.shp === 'heart' ? G.spline([G.P(0, top + b.bh * 0.2), G.P(-bw * 0.6, top), G.P(-bw * 1.1, top + b.bh * 0.3), G.P(-bw, yW), G.P(bw, yW), G.P(bw * 1.1, top + b.bh * 0.3), G.P(bw * 0.6, top), G.P(0, top + b.bh * 0.2)], 6) : b.shp === 'rounded' ? G.spline([G.P(-bw, yW), G.P(-tw, top + b.bh * 0.2), G.P(-tw * 0.6, top), G.P(tw * 0.6, top), G.P(tw, top + b.bh * 0.2), G.P(bw, yW)], 6) : [G.P(-bw, yW), G.P(-tw, top), G.P(tw, top), G.P(bw, yW)];
          items.push(fl(bibPts));
          if (b.shp === 'scalloped') items.push(ln(wavy(-tw, tw, top, -0.25), 'flat'));
          [-1, 1].forEach(sg => { const x = sg * tw * 0.85; items.push(ln(b.straps === 'neck loop' ? [G.P(x, top), G.P(sg * nw0 * 1.1, 0)] : [G.P(x, top), G.P(sg * (nw0 + m.shoulderWidth * 0.6), m.shoulderWidth * 0.2)], 'flat')); if (b.frill && b.straps !== 'neck loop') items.push(ln(wavy(x + sg * 0.3, sg * (nw0 + m.shoulderWidth * 1.1), top * 0.5, 0.25), 'flat')); });
        }
        items.push(fl([G.P(-hw, yW), G.P(hw, yW), G.P(hw, yW + F.wb), G.P(-hw, yW + F.wb)]));
      } else {
        items.push(fl([G.P(-hw * 0.55, yW), G.P(hw * 0.55, yW), G.P(hw * 0.55, yW + F.wb), G.P(-hw * 0.55, yW + F.wb)]));
        const bs = F.tw * 3;
        items.push(fl([G.P(0, yW + F.wb / 2), G.P(-bs * 1.4, yW - bs * 0.5), G.P(-bs * 1.4, yW + bs)]), fl([G.P(0, yW + F.wb / 2), G.P(bs * 1.4, yW - bs * 0.5), G.P(bs * 1.4, yW + bs)]));
        items.push(ln([G.P(-bs * 0.2, yW + F.wb), G.P(-bs * 0.8, yW + F.wb + F.tieL * 0.35)], 'flat'), ln([G.P(bs * 0.2, yW + F.wb), G.P(bs * 0.7, yW + F.wb + F.tieL * 0.38)], 'flat'));
        if (F.bib && F.bib.straps !== 'neck loop') [-1, 1].forEach(sg => items.push(ln([G.P(sg * (nw0 + m.shoulderWidth * 0.6), m.shoulderWidth * 0.2), G.P(-sg * hw * 0.5, yW)], 'flat')));
        if (F.bib && F.bib.straps === 'neck loop') items.push(ln(G.qbez(G.P(-nw0, 0.1), G.P(0, 0.6), G.P(nw0, 0.1), 6), 'flat'));
      }
    } else if (F.type === 'pinafore') {
      const top = yW - (m.frontNeckToWaist - F.topF) * (yW / m.frontNeckToWaist), bot = top + F.H * (yW / m.frontNeckToWaist) * 0.98;
      const tw = F.tw * 1.05, hw = F.hemW;
      items.push(fl(front ? [G.P(-tw, top), G.P(tw, top), G.P(F.uw * 1.05, top + F.yU), G.P(hw, bot), G.P(-hw, bot), G.P(-F.uw * 1.05, top + F.yU)] : [G.P(-F.uw, top + F.yU * 0.6), G.P(F.uw, top + F.yU * 0.6), G.P(hw * 0.95, bot), G.P(-hw * 0.95, bot)]));
      if (!front) { items.push(ln([G.P(hw * 0.2, top + F.yU * 0.6), G.P(hw * 0.2, bot)], 'flat')); [-1, 1].forEach(sg => items.push(ln([G.P(sg * (nw0 + m.shoulderWidth * 0.5), m.shoulderWidth * 0.2), G.P(-sg * F.uw * 0.7, top + F.yU * 0.6)], 'flat'))); }
      else { [-1, 1].forEach(sg => items.push(ln([G.P(sg * tw * 0.8, top), G.P(sg * (nw0 + m.shoulderWidth * 0.5), m.shoulderWidth * 0.2)], 'flat'))); if (o.apronPockets && o.apronPockets !== 'none') items.push(fl([G.P(-hw * 0.4, (top + bot) * 0.55), G.P(hw * 0.4, (top + bot) * 0.55), G.P(hw * 0.4, (top + bot) * 0.68), G.P(-hw * 0.4, (top + bot) * 0.68)])); }
    } else if (F.type === 'tabard') {
      const H = (front ? F.Hs : F.Hb) * (yW / (front ? m.frontNeckToWaist : m.napeToWaist)), pw = F.pw * 1.05;
      const hem = o.tabardHem === 'pointed' ? [G.P(pw, H), G.P(0, H + pw * 0.6), G.P(-pw, H)] : o.tabardHem === 'rounded' ? G.spline([G.P(pw, H), G.P(pw * 0.6, H + pw * 0.4), G.P(0, H + pw * 0.45), G.P(-pw * 0.6, H + pw * 0.4), G.P(-pw, H)], 6) : [G.P(pw, H), G.P(-pw, H)];
      items.push(fl([G.P(-F.nw, 0), G.P(-pw, m.shoulderWidth * 0.15)].concat(hem.slice().reverse().map(p => p), [G.P(pw, m.shoulderWidth * 0.15), G.P(F.nw, 0)])));
      const d = front ? F.dF : F.dB;
      items.push(ln(o.tabardNeck === 'V' && front ? [G.P(-F.nw, 0), G.P(0, d * 1.25), G.P(F.nw, 0)] : o.tabardNeck === 'square' && front ? [G.P(-F.nw, 0), G.P(-F.nw, d), G.P(F.nw, d), G.P(F.nw, 0)] : G.qbez(G.P(-F.nw, 0), G.P(0, d * 1.9), G.P(F.nw, 0), 8), 'flat'));
      if (o.tabardTie === 'belt') items.push(fl([G.P(-pw * 1.05, yW), G.P(pw * 1.05, yW), G.P(pw * 1.05, yW + 0.7), G.P(-pw * 1.05, yW + 0.7)]));
      if (o.tabardTie === 'side ties' && front) [-1, 1].forEach(sg => items.push(ln([G.P(sg * pw, yW), G.P(sg * (pw + 0.9), yW + 0.6)], 'flat')));
    }
    views.push({ label, items });
  });
  return views;
}

