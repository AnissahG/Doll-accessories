// ===================== BAGS =====================
// Body constructions: flat, boxed corners, gusset band, side gussets + base, round base + tube,
// end panels (barrel). Flaps, closures, pockets, handles and straps are added on top. Every joined
// edge is measured from the drafted pieces, so a gusset always matches the panel it is sewn to.
function bagDims(m, o) {
  const ref = BAG_REF[o.item] || BAG_REF.tote;
  const k = m.k * (BAG_SIZE_K[o.bagSize] || 1);
  let W = +o.bagW > 0 ? +o.bagW : ref[0] * k;
  let H = +o.bagH > 0 ? +o.bagH : ref[1] * k;
  let D = o.bodyCon === 'flat' ? 0 : (+o.bagD > 0 ? +o.bagD : Math.max(ref[2] || ref[0] * 0.3, 4) * k);
  if (o.bodyCon !== 'flat') D = Math.max(D, 0.6);
  if (o.item === 'bucket' && !(+o.bagD > 0) && o.bodyCon === 'round') D = W * 0.85;
  return { W, H, D, k };
}
function bagEdges(o, S, extra) {
  const e = {};
  const raw = o.construction === 'raw';
  const top = raw ? { kind: 'none' } : o.topFinish === 'hem' ? { kind: 'hem' } : o.topFinish === 'binding' ? { kind: 'none' } : { kind: 'seam' };
  e.top = top;
  if (raw) { e.side = { kind: 'seam', sa: Math.min(S.sa || 0.3, 0.3) }; e.box = { kind: 'seam', sa: Math.min(S.sa || 0.3, 0.3) }; }
  return Object.assign(e, extra || {});
}
function bagPiece(runs, name, cut, o, S, extraEdges) {
  const pc = runsPiece(runs, { name, cut: Object.assign({ fabric: 1 }, cut || {}) });
  pc.edges = bagEdges(o, S, extraEdges);
  return pc;
}
// a straight "band" piece below a top edge run (facings): follows the top curve, height hf
function facingFrom(topRun, hf) {
  const top = topRun.slice();
  const bot = top.map(p => G.P(p.x, p.y + hf)).reverse();
  return [{ pts: top, tag: 'top' }, { pts: [top[top.length - 1], bot[0]], tag: 'side' }, { pts: bot, tag: 'seam' }, { pts: [bot[bot.length - 1], top[0]], tag: 'side' }];
}
function buildBag(m, o, S, out) {
  const { W, H, D, k } = bagDims(m, o);
  const plan = out.plan; plan.family = 'bag';
  const raw = o.construction === 'raw';
  const lined = o.lining === 'yes' && !raw;
  const fus = ['fusible', 'fusible + foam', 'stiff'].includes(o.interfacing);
  const foam = ['foam', 'fusible + foam'].includes(o.interfacing);
  const zip = ZIPS[o.zipType] || ZIPS['doll zip (3 mm teeth)'];
  out.used = ['chestCirc', 'napeToWaist'];
  out.readout.size = 'finished ' + fmt(W) + ' × ' + fmt(H) + (D > 0 ? ' × ' + fmt(D) : '') + ' cm (w × h' + (D > 0 ? ' × d' : '') + ')';
  plan.W = W; plan.H = H; plan.D = D;
  if (W < 2.2 || H < 1.8) out.warnings.push('This bag is only ' + fmt(W) + ' × ' + fmt(H) + ' cm — at this size a turned & lined bag is very hard to sew. Try "raw edge" construction in felt or faux leather, or a larger size.');
  // ---------- body panel outline
  const shape = o.bagShape;
  const frame = o.closure === 'frame';
  const casing = o.closure === 'casing';
  const minR = Math.min(W, H);
  const rCorner = +o.cornerCm > 0 ? +o.cornerCm : minR * (shape === 'rounded all' ? 0.3 : 0.22);
  const taper = shape === 'trapezoid' ? (+o.taperCm > 0 ? +o.taperCm : W * 0.12) : 0;
  let fw = 0, fh = 0;
  if (frame) {
    fw = +o.frameW > 0 ? +o.frameW : Math.max(HW.frame.filter(v => v <= W * 0.9).pop() || HW.frame[0], 2);
    fh = +o.frameH > 0 ? +o.frameH : fw * 0.42;
    plan.frame = { fw, fh };
    if (fw > W) out.warnings.push('The frame (' + cm(fw) + ') is wider than the bag (' + cm(W) + ') — make the bag wider or pick a smaller frame.');
  }
  // the zip-around family: panel has no "top" — the whole perimeter is joined to a gusset (zip at the top)
  const zipAround = o.bodyCon === 'band' && (o.closure === 'zip');
  const casingH = casing ? Math.max(0.5, 0.11 * H) : 0;
  function panelShape() {
    if (frame) {
      // arched top that goes into the frame; hinge points at fh below the top; body widens below
      const cx = W / 2, top = [], n = 20;
      for (let i = 0; i <= n; i++) { const u = i / n, x = cx - fw / 2 + fw * u; top.push(G.P(x, fh * (1 - Math.sin(Math.PI * u)) * 0.85)); }
      const hingeR = G.P(cx + fw / 2, fh), hingeL = G.P(cx - fw / 2, fh);
      const wideY = fh + (H - fh) * 0.35;
      const right = G.spline([hingeR, G.P(Math.max(W, cx + fw / 2), wideY), G.P(W, H - Math.min(H * 0.25, W * 0.2))], 8);
      const bot = G.spline([G.P(W, H - Math.min(H * 0.25, W * 0.2)), G.P(W - W * 0.12, H), G.P(W * 0.12, H), G.P(0, H - Math.min(H * 0.25, W * 0.2))], 8);
      const left = G.spline([G.P(0, H - Math.min(H * 0.25, W * 0.2)), G.P(Math.min(0, cx - fw / 2), wideY), hingeL], 8);
      return { runs: [{ pts: top.slice(0, 1).concat([top[0]]).concat(top.slice(1)).filter((p, i) => i > 0), tag: 'top' }, { pts: [top[n], hingeR], tag: 'top' }, { pts: right, tag: 'side' }, { pts: bot, tag: 'side' }, { pts: left, tag: 'side' }, { pts: [hingeL, top[0]], tag: 'top' }], hinge: [hingeL, hingeR] };
    }
    const opt = {};
    if (shape === 'trapezoid') opt.taper = taper;
    if (shape === 'rounded') opt.rb = rCorner;
    if (shape === 'rounded all') { opt.rb = rCorner; opt.rt = rCorner; }
    if (shape === 'crescent') { opt.topCurve = H * 0.16; opt.rb = minR * 0.35; opt.taper = W * 0.04; }
    if (shape === 'dome') opt.topCurve = -H * 0.22;
    if (shape === 'half-moon') opt.bottomCurve = true;
    let hh = H;
    if (shape === 'dome') hh = H * 0.82; // dome adds height above the top line
    if (casingH) hh += casingH;
    let runs = panelRuns(W, hh, opt);
    if (shape === 'dome') runs = runs.map(r => ({ pts: r.pts.map(p => G.P(p.x, p.y + H * 0.18)), tag: r.tag }));
    if (zipAround) runs = runs.map(r => ({ pts: r.pts, tag: 'side' }));
    return { runs };
  }
  // ---------- pieces by construction
  const P = [];
  const bodyCut = (n) => ({ fabric: n, lining: lined && o.topFinish !== 'facing' ? n : 0, interfacing: fus ? n : 0 });
  let front = null, back = null, gusset = null, topRunFront = null;
  if (o.bodyCon === 'boxed') {
    const w = W + D, h = H + D / 2 + casingH, b = D / 2, t = taper;
    const one = o.bodyCut === 'one' && !t;
    let runs;
    if (one) {
      const L = 2 * (H + casingH) + D;
      const yA = H + casingH, yB = H + casingH + D;
      runs = [
        { pts: [G.P(0, 0), G.P(w, 0)], tag: 'top' },
        { pts: [G.P(w, 0), G.P(w, yA)], tag: 'side' },
        { pts: [G.P(w, yA), G.P(w - b, yA), G.P(w - b, yB), G.P(w, yB)], tag: 'box' },
        { pts: [G.P(w, yB), G.P(w, L)], tag: 'side' },
        { pts: [G.P(w, L), G.P(0, L)], tag: 'top' },
        { pts: [G.P(0, L), G.P(0, yB)], tag: 'side' },
        { pts: [G.P(0, yB), G.P(b, yB), G.P(b, yA), G.P(0, yA)], tag: 'box' },
        { pts: [G.P(0, yA), G.P(0, 0)], tag: 'side' }
      ];
      front = bagPiece(runs, 'Bag body', bodyCut(1), o, S);
      front.marks.push({ type: 'fold', a: G.P(b, (yA + yB) / 2), b: G.P(w - b, (yA + yB) / 2), label: 'bottom centre' });
    } else {
      runs = [
        { pts: [G.P(t, 0), G.P(w - t, 0)], tag: 'top' },
        { pts: [G.P(w - t, 0), G.P(w, h - b)], tag: 'side' },
        { pts: [G.P(w, h - b), G.P(w - b, h - b), G.P(w - b, h)], tag: 'box' },
        { pts: [G.P(w - b, h), G.P(b, h)], tag: 'side' },
        { pts: [G.P(b, h), G.P(b, h - b), G.P(0, h - b)], tag: 'box' },
        { pts: [G.P(0, h - b), G.P(t, 0)], tag: 'side' }
      ];
      front = bagPiece(runs, 'Front & back', bodyCut(2), o, S);
    }
    topRunFront = [G.P(t, 0), G.P(w - t, 0)];
    front.notes.push('Box the corners: open each cut-out, match the side seam to the bottom seam and stitch straight across (' + cm(D) + ' wide).');
    P.push(front);
    plan.boxed = true;
  } else if (o.bodyCon === 'round') {
    const baseK = Math.min(1, D / W);
    const base = ellipsePiece(Math.PI * (W + D) / 2 * (1 + 3 * Math.pow((W - D) / (W + D), 2) / (10 + Math.sqrt(4 - 3 * Math.pow((W - D) / (W + D), 2)))), baseK, 'side', { name: 'Base', cut: { fabric: 1, lining: lined ? 1 : 0, interfacing: fus ? 1 : 0 } });
    base.edges = bagEdges(o, S);
    const Pm = edgeLength(base, 'side');
    plan.basePerim = Pm;
    // quarter notches on the base
    const bb = G.bbox(base.pts);
    [G.P(bb.x0 + bb.w / 2, bb.y0), G.P(bb.x1, bb.y0 + bb.h / 2), G.P(bb.x0 + bb.w / 2, bb.y1), G.P(bb.x0, bb.y0 + bb.h / 2)].forEach((p, i) => base.marks.push({ type: 'notch', p, n: i % 2 ? 2 : 1 }));
    const hh = H + casingH;
    front = bagPiece([{ pts: [G.P(0, 0), G.P(Pm / 2, 0)], tag: 'top' }, { pts: [G.P(Pm / 2, 0), G.P(Pm / 2, hh)], tag: 'side' }, { pts: [G.P(Pm / 2, hh), G.P(0, hh)], tag: 'base' }, { pts: [G.P(0, hh), G.P(0, 0)], tag: 'side' }], 'Body (front & back)', bodyCut(2), o, S, raw ? { base: { kind: 'seam', sa: Math.min(S.sa || 0.3, 0.3) } } : {});
    front.isRect = { w: Pm / 2, h: hh };
    front.marks.push({ type: 'notch', p: G.P(Pm / 4, hh) });
    topRunFront = [G.P(0, 0), G.P(Pm / 2, 0)];
    P.push(front, base);
    if (o.baseInsert) P.push(boardPiece(base, 'Base insert', 0.15));
    plan.round = true;
  } else if (o.bodyCon === 'barrel') {
    // ends: H tall, D deep; body wraps around the end perimeter, zip along the top
    const endR = shape === 'rounded all' || shape === 'rectangle' && false ? Math.min(H, D) * 0.3 : Math.min(H, D) * 0.3;
    const endRuns = panelRuns(D, H, { rb: endR, rt: endR }).map(r => ({ pts: r.pts, tag: 'side' }));
    const end = bagPiece(endRuns, 'End panel', { fabric: 2, lining: lined ? 2 : 0, interfacing: fus ? 2 : 0 }, o, S);
    const Pe = edgeLength(end, 'side');
    const bodyH = (Pe - zip.teeth) / 2;
    front = bagPiece([{ pts: [G.P(0, 0), G.P(W, 0)], tag: 'zip' }, { pts: [G.P(W, 0), G.P(W, bodyH)], tag: 'side' }, { pts: [G.P(W, bodyH), G.P(0, bodyH)], tag: 'fold' }, { pts: [G.P(0, bodyH), G.P(0, 0)], tag: 'side' }], 'Body', { fabric: 1, fold: true, lining: lined ? 1 : 0, interfacing: fus ? 1 : 0, note: 'fold = centre bottom' }, o, S, { zip: { kind: 'seam' } });
    front.foldTag = 'fold'; front.isRect = { w: W, h: bodyH };
    const ebb = G.bbox(end.pts);
    end.marks.push({ type: 'notch', p: G.P(ebb.x0 + ebb.w / 2, ebb.y0) }, { type: 'notch', p: G.P(ebb.x0 + ebb.w / 2, ebb.y1), n: 2 });
    end.marks.push({ type: 'text', p: G.P(ebb.x0 + ebb.w * 0.5, ebb.y0 + 0.7), text: 'zip end', small: true });
    P.push(front, end);
    plan.barrel = { Pe, endPerim: Pe };
    plan.zipLen = W;
    if (o.baseInsert) P.push(boardPiece(null, 'Base insert', 0, W - 0.3, D * 0.8));
  } else {
    // flat / band / sides: front & back panels share an outline
    const sh = panelShape();
    let runs = sh.runs;
    if (o.bodyCon === 'sides') {
      // side gussets + base: front/back are simple panels whose sides and bottom are separate seams
      runs = panelShape().runs.map(r => r);
    }
    const oneFlat = o.bodyCon === 'flat' && o.bodyCut === 'one' && shape === 'rectangle' && !frame;
    if (oneFlat) {
      const hh = H + casingH;
      front = bagPiece([{ pts: [G.P(0, 0), G.P(W, 0)], tag: 'top' }, { pts: [G.P(W, 0), G.P(W, 2 * hh)], tag: 'side' }, { pts: [G.P(W, 2 * hh), G.P(0, 2 * hh)], tag: 'top' }, { pts: [G.P(0, 2 * hh), G.P(0, 0)], tag: 'side' }], 'Bag body', bodyCut(1), o, S);
      front.marks.push({ type: 'fold', a: G.P(0, hh), b: G.P(W, hh), label: 'bottom fold' });
      front.isRect = { w: W, h: 2 * hh };
    } else {
      front = bagPiece(runs, 'Front & back', bodyCut(2), o, S);
      if (o.bodyCon === 'sides') front.edges.bottom = front.edges.side;
    }
    const topRun = (runs.find(r => r.tag === 'top') || {}).pts;
    topRunFront = topRun || null;
    if (sh.hinge) sh.hinge.forEach(p => front.marks.push({ type: 'dot', p, label: 'hinge' }));
    P.push(front);
    if (o.bodyCon === 'band') {
      const L = edgeLength(front, 'side');
      if (zipAround) {
        // zip panel across the top: top edge + upper part of the sides
        const topPart = Math.min(L * 0.5, W + 2 * H * 0.3);
        const zw = Math.max(0.4, (D - zip.teeth) / 2);
        const zp = strip(topPart + 0.6, zw, { name: 'Zip panel', cut: { fabric: 2, lining: lined ? 2 : 0, interfacing: fus ? 2 : 0 } }, { top: 'zip', right: 'seam', bottom: 'seam', left: 'seam' });
        zp.edges = Object.assign(bagEdges(o, S), { zip: { kind: 'seam', sa: Math.max(0.3, Math.min(S.sa, zip.tape / 2)) } });
        zp.notes.push('Zip goes along the long edge marked "zip"; the two strips sit either side of the teeth.');
        const bandL = L - topPart + 0.6;
        gusset = strip(D, bandL, { name: 'Gusset band', cut: { fabric: 1, lining: lined ? 1 : 0, interfacing: fus ? 1 : 0 } }, { top: 'seam', right: 'side', bottom: 'seam', left: 'side' });
        gusset.edges = bagEdges(o, S);
        gusset.marks.push({ type: 'notch', p: G.P(0, bandL / 2) }, { type: 'notch', p: G.P(D, bandL / 2) });
        P.push(zp, gusset);
        plan.zipLen = topPart;
        plan.zipPanel = { len: topPart, zw };
        // notches on the panel where the zip panel ends
        const sideRuns = edgeRuns(front.pts, front.tags).side || [];
        const all = [].concat(...sideRuns.map(r => r.pts));
        const ordered = sideRuns.length ? sideRuns.reduce((a, r) => a.concat(r.pts), []) : all;
        if (ordered.length > 2) {
          const Lp = G.plen(ordered);
          // the zip panel is centred on the top of the panel: find the top-centre arc length
          let best = 0, bestY = Infinity; for (let s = 0; s <= Lp; s += Lp / 200) { const q = G.pointAt(ordered, s).p; if (q.y < bestY - 1e-6 || (Math.abs(q.y - bestY) < 1e-6 && Math.abs(q.x - W / 2) < Math.abs(G.pointAt(ordered, best).p.x - W / 2))) { bestY = q.y; best = s; } }
          [best - topPart / 2, best + topPart / 2].forEach(s => { const ss = ((s % Lp) + Lp) % Lp; front.marks.push({ type: 'notch', p: G.pointAt(ordered, ss).p, label: 'zip end' }); });
        }
      } else {
        gusset = strip(D, L, { name: 'Gusset band', cut: bodyCut(1) }, { top: 'top', right: 'side', bottom: 'top', left: 'side' });
        gusset.edges = bagEdges(o, S);
        gusset.marks.push({ type: 'notch', p: G.P(0, L / 2) }, { type: 'notch', p: G.P(D, L / 2) });
        P.push(gusset);
        if (frame) gusset.notes.push('The gusset ends at the hinge dots of the front and back.');
      }
      // centre-bottom notch on the panel
      front.marks.push({ type: 'notch', p: G.P(W / 2, shape === 'dome' ? H : H + casingH) });
      if (o.baseInsert) P.push(boardPiece(null, 'Base insert', 0, W * 0.7, D - 0.2));
    }
    if (o.bodyCon === 'sides') {
      const sideL = Math.hypot(taper, H + casingH);
      const sp = strip(D, sideL, { name: 'Side gusset', cut: bodyCut(2) }, { top: 'top', right: 'side', bottom: 'side', left: 'side' });
      sp.edges = bagEdges(o, S);
      const bp = strip(W, D, { name: 'Base', cut: { fabric: 1, lining: lined ? 1 : 0, interfacing: fus ? 1 : 0 } }, { top: 'side', right: 'side', bottom: 'side', left: 'side' });
      bp.edges = bagEdges(o, S);
      P.push(sp, bp);
      if (o.baseInsert) P.push(boardPiece(bp, 'Base insert', 0.15));
    }
  }
  back = front;
  // ---------- casing fold / channel
  if (casing && topRunFront) {
    const body = P[0];
    const bb = G.bbox(body.pts);
    const y1 = (o.bodyCon === 'boxed' || o.bodyCon === 'round') ? casingH : casingH;
    body.marks.push({ type: 'line', cls: 'topstitch', pts: [G.P(bb.x0 + 0.1, y1 * 0.35), G.P(bb.x1 - 0.1, y1 * 0.35)] });
    body.marks.push({ type: 'line', cls: 'topstitch', pts: [G.P(bb.x0 + 0.1, y1), G.P(bb.x1 - 0.1, y1)], label: 'casing' });
    body.marks.push({ type: 'dot', p: G.P(bb.x0 + 0.01, y1 * 0.35) }, { type: 'dot', p: G.P(bb.x0 + 0.01, y1) });
    if (o.bodyCon === 'band' && gusset) gusset.marks.push({ type: 'line', cls: 'topstitch', pts: [G.P(0.05, casingH), G.P(D - 0.05, casingH)] });
    plan.casingH = casingH;
  }
  // ---------- facing pieces (and the shorter lining that goes with them)
  // never deeper than ~1/3 of the bag, or the lining of a tiny bag collapses to nothing
  const hf = Math.min(Math.max(0.7, H * 0.2), H * 0.35);
  if (o.topFinish === 'facing' && !zipAround && o.bodyCon !== 'barrel') {
    if (topRunFront) {
      const fr = facingFrom(topRunFront, hf);
      const fc = bagPiece(fr, 'Facing (front & back)', { fabric: 2, interfacing: fus ? 2 : 0 }, o, S, { seam: { kind: 'seam' } });
      P.push(fc);
      if (gusset && !zipAround) { const gf = strip(D, hf, { name: 'Gusset facing', cut: { fabric: 2, interfacing: fus ? 2 : 0 } }, { top: 'top', right: 'side', bottom: 'seam', left: 'side' }); gf.edges = bagEdges(o, S); P.push(gf); }
    }
    if (lined) {
      // lining pieces: body minus facing height
      P.filter(pc => /Front & back|Bag body|Body|Gusset band|Side gusset/.test(pc.name) && pc.cut.fabric).forEach(pc => {
        const ln = JSON.parse(JSON.stringify(pc));
        ln.id = 'p' + Math.random().toString(36).slice(2, 8);
        ln.name = pc.name.replace(/^(Front & back|Bag body|Body)/, 'Lining $1').replace(/^Gusset band/, 'Lining gusset band').replace(/^Side gusset/, 'Lining side gusset');
        ln.kind = 'lining';
        // drop the facing height off every 'top' edge
        const isGus = /usset/.test(pc.name);
        ln.pts = ln.pts.map(p => G.P(p.x, p.y));
        const bb2 = G.bbox(ln.pts);
        const twoTops = (edgeRuns(pc.pts, pc.tags).top || []).length > 1 || isGus;
        const yTop = (x) => { if (!topRunFront || isGus) return bb2.y0; const tr = topRunFront; for (let i = 1; i < tr.length; i++) { const a = tr[i - 1], b = tr[i]; if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); } return Math.min(...tr.map(q => q.y)); };
        ln.pts = ln.pts.map(p => { let y = Math.max(p.y, yTop(p.x) + hf); if (twoTops) y = Math.min(y, bb2.y1 - hf); return G.P(p.x, y); });
        if (ln.isRect) ln.isRect = { w: ln.isRect.w, h: ln.isRect.h - hf * (twoTops ? 2 : 1) };
        ln.tags = ln.tags.map(t => t === 'top' ? 'seam' : t);
        ln.cut = { fabric: 0, lining: pc.cut.fabric };
        ln.marks = ln.marks.filter(mk => mk.type === 'notch' || mk.type === 'fold');
        ln.grain = null; autoGrain(ln);
        P.push(ln);
      });
    }
    plan.facing = hf;
  }
  // ---------- flap
  let flapPc = null;
  if (o.flap !== 'none') {
    const frac = { short: 0.36, half: 0.5, long: 0.75, full: 0.95 }[o.flapLen] || 0.5;
    const fwid = (o.bodyCon === 'boxed' ? W : W) + 0.1;
    const fl = (o.bodyCon === 'flat' ? 0 : D) + H * frac;
    let runs;
    const r = Math.min(fwid, fl) * 0.28;
    if (o.flap === 'straight') runs = roundedRuns([G.P(0, 0), G.P(fwid, 0), G.P(fwid, fl), G.P(0, fl)], [{ tag: 'flaptop' }, { tag: 'edge' }, { tag: 'edge' }, { tag: 'edge' }], [0, 0, Math.min(r * 0.25, 0.3), Math.min(r * 0.25, 0.3)]);
    else if (o.flap === 'rounded') runs = roundedRuns([G.P(0, 0), G.P(fwid, 0), G.P(fwid, fl), G.P(0, fl)], [{ tag: 'flaptop' }, { tag: 'edge' }, { tag: 'edge' }, { tag: 'edge' }], [0, 0, r, r]);
    else if (o.flap === 'envelope') { const pd = Math.min(fwid * 0.4, fl * 0.6); runs = roundedRuns([G.P(0, 0), G.P(fwid, 0), G.P(fwid, fl - pd), G.P(fwid / 2, fl), G.P(0, fl - pd)], [{ tag: 'flaptop' }, { tag: 'edge' }, { tag: 'edge' }, { tag: 'edge' }, { tag: 'edge' }], [0, 0, r * 0.3, r * 0.3, r * 0.3]); }
    else { const pts = []; const n = 24, cy = Math.max(0, fl - fwid / 2 * 0.9); for (let i = 1; i < n; i++) { const a = Math.PI * i / n; pts.push(G.P(fwid / 2 + fwid / 2 * Math.cos(a), cy + (fl - cy) * Math.sin(a))); } runs = roundedRuns([G.P(0, 0), G.P(fwid, 0), G.P(fwid, cy)], [{ tag: 'flaptop' }, { tag: 'edge' }, { tag: 'edge', pts: pts.concat([G.P(0, cy)]) }], [0, 0, 0]); runs = runs.filter(r2 => r2.pts.length > 1); }
    const flapLined = !raw;
    flapPc = runsPiece(runs, { name: 'Flap', cut: { fabric: flapLined && !lined ? 2 : 1, lining: flapLined && lined ? 1 : 0, interfacing: fus ? 1 : 0 } });
    flapPc.edges = { flaptop: { kind: 'seam' }, edge: raw ? { kind: 'none' } : { kind: 'seam' } };
    if (o.bodyCon !== 'flat') flapPc.marks.push({ type: 'fold', a: G.P(0, D), b: G.P(fwid, D), label: 'top edge of the bag' });
    P.push(flapPc);
    plan.flap = { w: fwid, l: fl, frac };
    if (fl > H + D) out.warnings.push('The flap is longer than the bag front.');
  }
  // ---------- closures
  const mid = W / 2;
  const closeOnFlap = flapPc && ['magnet', 'snap', 'loop', 'tab', 'turnlock', 'buckles', 'toggle'].includes(o.closure);
  const flapTipY = flapPc ? plan.flap.l : 0;
  // where the flap tip lands on the front, measured from the top edge of the front
  const landY = flapPc ? Math.max(0.4, H * plan.flap.frac - 0.15) : 0;
  const frontTopY = shape === 'dome' ? H * 0.18 : 0;
  const dotOnFront = (y, kind, label) => front.marks.push({ type: 'dot', p: G.P((o.bodyCon === 'boxed' ? (W + D) / 2 : o.bodyCon === 'round' ? (plan.basePerim / 4) : mid), frontTopY + y), kind, label });
  const hwMagnet = HW.magnet.filter(v => v / 10 <= Math.min(W, H) * 0.2).pop() || HW.magnet[0];
  const hwSnap = HW.snap.filter(v => v / 10 <= Math.min(W, H) * 0.15).pop() || HW.snap[0];
  if (o.closure === 'magnet' || o.closure === 'snap') {
    const name = o.closure === 'magnet' ? 'magnetic snap ' + hwMagnet + ' mm' : 'sew-on snap ' + hwSnap + ' mm';
    if (o.closure === 'magnet' && hwMagnet / 10 > Math.min(W, H) * 0.4) out.warnings.push('Even the smallest magnetic snap (' + hwMagnet + ' mm) is big for this bag — use a sew-on snap.');
    if (closeOnFlap) {
      const inset = Math.min(1, plan.flap.l * 0.18);
      flapPc.marks.push({ type: 'dot', p: G.P(plan.flap.w / 2, flapTipY - inset), kind: 'snap-ball', label: o.closure === 'magnet' ? 'magnet (lining side)' : 'snap (lining side)' });
      dotOnFront(landY - inset * 0.3, 'snap-socket', o.closure === 'magnet' ? 'magnet' : 'snap');
    } else {
      const y = Math.min(o.topFinish === 'facing' ? hf * 0.5 : 0.5 + H * 0.05, H * 0.3);
      if (o.topFinish === 'facing') { const fc = P.find(p => /^Facing/.test(p.name)); if (fc) fc.marks.push({ type: 'dot', p: G.P(G.bbox(fc.pts).x0 + G.bbox(fc.pts).w / 2, y), kind: 'snap', label: name }); }
      else dotOnFront(y, 'snap', name + ' — on the lining');
    }
    addNotion(out, o.closure, name, 1);
    plan.closure = o.closure;
  }
  if (o.closure === 'loop' || o.closure === 'toggle') {
    const lw = Math.max(0.15, 0.06 * k * 3);
    addNotion(out, 'cord', 'narrow cord or elastic for the loop', 1, cm(Math.max(2, H * 0.35)));
    addNotion(out, 'button', (o.closure === 'toggle' ? 'toggle' : 'button') + ' ' + (HW.button.filter(v => v / 10 <= W * 0.18).pop() || 3) + ' mm', 1);
    if (flapPc) { flapPc.marks.push({ type: 'dot', p: G.P(plan.flap.w / 2, flapTipY), label: 'loop' }); dotOnFront(landY, 'button', 'button'); }
    else { dotOnFront(0.05, null, 'loop (back)'); dotOnFront(H * 0.18, 'button', 'button'); }
  }
  if (o.closure === 'tab') {
    const tw = Math.max(0.8, W * 0.2), tl = Math.max(1.2, H * 0.38) + (D || 0);
    const tab = runsPiece(roundedRuns([G.P(0, 0), G.P(tw, 0), G.P(tw, tl), G.P(0, tl)], [{ tag: 'top' }, { tag: 'edge' }, { tag: 'edge' }, { tag: 'edge' }], [0, 0, tw * 0.45, tw * 0.45]), { name: 'Closure tab', cut: { fabric: raw ? 1 : 2, interfacing: fus ? 1 : 0 } });
    tab.edges = { top: { kind: 'seam' }, edge: raw ? { kind: 'none' } : { kind: 'seam' } };
    tab.marks.push({ type: 'dot', p: G.P(tw / 2, tl - tw * 0.45), kind: 'snap-ball', label: 'snap' });
    P.push(tab);
    dotOnFront(Math.max(0.5, H * 0.3), 'snap-socket', 'snap / button');
    addNotion(out, 'snap', 'sew-on snap ' + hwSnap + ' mm (or a button)', 1);
  }
  if (o.closure === 'turnlock') { dotOnFront(landY, 'button', 'turn-lock'); if (flapPc) flapPc.marks.push({ type: 'place', pts: [G.P(plan.flap.w / 2 - 0.4, flapTipY - 0.9), G.P(plan.flap.w / 2 + 0.4, flapTipY - 0.9), G.P(plan.flap.w / 2 + 0.4, flapTipY - 0.3), G.P(plan.flap.w / 2 - 0.4, flapTipY - 0.3)], label: 'lock plate' }); addNotion(out, 'turnlock', 'mini turn-lock (decorative, or glued with a hidden snap)', 1); }
  // ---------- zip
  if (o.closure === 'zip' && !zipAround && o.bodyCon !== 'barrel') {
    const zl = o.bodyCon === 'boxed' ? W + D : o.bodyCon === 'round' ? plan.basePerim / 2 : W - 2 * taper;
    plan.zipLen = zl;
    const tab = strip(Math.max(0.8, zip.tape + 0.2), Math.max(1.2, zip.tape * 1.6), { name: 'Zip end tabs', cut: { fabric: 2 } }, { top: 'seam', right: 'seam', bottom: 'seam', left: 'seam' });
    tab.marks.push({ type: 'fold', a: G.P(0, tab.isRect.h / 2), b: G.P(tab.isRect.w, tab.isRect.h / 2) });
    P.push(tab);
    plan.zipTop = true;
  }
  if (o.closure === 'zippanel') {
    const zl = o.bodyCon === 'round' ? plan.basePerim / 2 * 0.9 : W - 2 * taper;
    const zw = Math.max(0.6, (o.bodyCon === 'flat' ? 1.2 * k * 2 : D / 2) - zip.teeth / 2);
    const zp = strip(zl, zw, { name: 'Recessed zip panel', cut: { fabric: 2, lining: lined ? 2 : 0, interfacing: fus ? 2 : 0 } }, { top: 'zip', right: 'seam', bottom: 'seam', left: 'seam' });
    P.push(zp);
    plan.zipLen = zl; plan.zipPanel = { len: zl, zw };
  }
  if (plan.zipLen) addNotion(out, 'zip', 'zipper — ' + zip.label, 1, 'at least ' + cm(Math.ceil(plan.zipLen + 2)) + ' long (shorten to fit)');
  // ---------- drawstring
  if (casing || o.closure === 'eyelets') {
    const open = o.bodyCon === 'round' ? plan.basePerim : o.bodyCon === 'boxed' ? 2 * (W + D) : o.bodyCon === 'band' ? 2 * W + 2 * D : 2 * W;
    const cords = casing ? 2 : 1;
    const len = casing ? open * 1.0 + H * 0.6 : open * 1.45 + H * 0.5;
    addNotion(out, 'cord', 'drawstring cord ' + (k < 0.25 ? '1 mm' : k < 0.4 ? '1.5–2 mm' : '2–3 mm'), cords, cm(Math.ceil(len)) + ' each');
    if (o.closure === 'eyelets') {
      const n = Math.max(6, 2 * Math.round(open / Math.max(1.0, 2.2 * k * 3) / 2));
      const ey = HW.eyelet.filter(v => v / 10 <= Math.max(0.15, H * 0.05)).pop() || HW.eyelet[0];
      addNotion(out, 'eyelet', 'eyelets ' + ey + ' mm', n);
      const perPanel = n / 2;
      const body = P[0], bb = G.bbox(body.pts);
      const yE = Math.max(0.45, H * 0.09);
      const x0 = o.bodyCon === 'boxed' ? 0 : bb.x0, x1 = o.bodyCon === 'boxed' ? bb.x1 : bb.x1;
      for (let i = 0; i < perPanel; i++) body.marks.push({ type: 'dot', kind: 'eyelet', p: G.P(x0 + (x1 - x0) * (i + 0.5) / perPanel, yE) });
      plan.eyelets = { n, size: ey, y: yE };
      if (o.topFinish === 'hem' || o.topFinish === 'binding') out.notes.push('Eyelets need a firm edge — interface the top 2 cm or use the facing / lining finish.');
    }
  }
  // ---------- frame
  if (frame) addNotion(out, 'frame', 'purse frame (sew-in or glue-in) ' + fmt(fw) + ' cm wide, ' + fmt(fh) + ' cm to the hinge', 1, 'glue: fabric glue / E6000; paper twine or cord to fill the channel');
  // ---------- buckle straps on the flap
  const strapW0 = +o.strapW > 0 ? +o.strapW : Math.max(0.3, Math.min(2.5, H * 0.075));
  let hwMm = o.hwSize === 'auto' ? hwPick('ring', strapW0 * 10 + 0.5) : +o.hwSize;
  if (o.closure === 'buckles' && flapPc) {
    const bmm = o.hwSize === 'auto' ? hwPick('buckle', Math.max(3, W * 0.09 * 10)) : +o.hwSize;
    const bw = strapForRing(bmm);
    const xs = [plan.flap.w * 0.27, plan.flap.w * 0.73];
    xs.forEach(x => flapPc.marks.push({ type: 'place', pts: [G.P(x - bw / 2, flapTipY * 0.35), G.P(x + bw / 2, flapTipY * 0.35), G.P(x + bw / 2, flapTipY), G.P(x - bw / 2, flapTipY)], label: '' }));
    const sl = plan.flap.l * 0.65 + bw * 3 + 0.6;
    const bs = strip(bw * (o.strapMake === 'folded' ? 4 : 1), sl, { name: 'Buckle strap', cut: { fabric: 2, note: o.strapMake === 'folded' ? 'fold edges to the centre, fold again, topstitch' : '' } });
    const btab = strip(bw * (o.strapMake === 'folded' ? 4 : 1), bw * 2.5 + 0.8, { name: 'Buckle tab', cut: { fabric: 2 } });
    if (o.strapMake === 'folded') { [bs, btab].forEach(pc => { const w4 = pc.isRect.w; pc.marks.push({ type: 'fold', a: G.P(w4 / 4, 0), b: G.P(w4 / 4, pc.isRect.h) }, { type: 'fold', a: G.P(w4 / 2, 0), b: G.P(w4 / 2, pc.isRect.h) }, { type: 'fold', a: G.P(w4 * 0.75, 0), b: G.P(w4 * 0.75, pc.isRect.h) }); pc.edges = { seam: { kind: 'none' } }; }); }
    else [bs, btab].forEach(pc => pc.edges = { seam: { kind: 'none' } });
    P.push(bs, btab);
    const W0 = o.bodyCon === 'boxed' ? (W + D) : W;
    [0.27, 0.73].forEach(f => front.marks.push({ type: 'place', pts: [G.P((o.bodyCon === 'boxed' ? D / 2 : 0) + W * f - bw / 2, frontTopY + landY - 0.2), G.P((o.bodyCon === 'boxed' ? D / 2 : 0) + W * f + bw / 2, frontTopY + landY - 0.2), G.P((o.bodyCon === 'boxed' ? D / 2 : 0) + W * f + bw / 2, frontTopY + landY + bw * 1.5), G.P((o.bodyCon === 'boxed' ? D / 2 : 0) + W * f - bw / 2, frontTopY + landY + bw * 1.5)] }));
    addNotion(out, 'buckle', 'buckles ' + bmm + ' mm inner width', 2);
    plan.buckles = bmm;
  }
  // ---------- pockets
  const pk = o.bagPockets || [];
  const pW = Math.max(1.2, W * 0.55), pH = Math.max(1, H * 0.42);
  const placeOnFront = (pc2, label) => { const x0 = (o.bodyCon === 'boxed' ? (W + D) / 2 : o.bodyCon === 'round' ? plan.basePerim / 4 : W / 2) - pW / 2, y0 = frontTopY + (flapPc ? Math.max(landY + 0.3, H * 0.4) : H * 0.35); pc2.marks.push({ type: 'place', pts: [G.P(x0, y0), G.P(x0 + pW, y0), G.P(x0 + pW, Math.min(y0 + pH, frontTopY + H - 0.3)), G.P(x0, Math.min(y0 + pH, frontTopY + H - 0.3))], label }); };
  if (pk.includes('front patch pocket') || pk.includes('back slip pocket')) {
    const n = (pk.includes('front patch pocket') ? 1 : 0) + (pk.includes('back slip pocket') ? 1 : 0);
    const pp = strip(pW, pH + (raw ? 0 : pH * 0.0), { name: 'Outer pocket', cut: { fabric: n, lining: raw ? 0 : n } }, { top: 'top', right: 'seam', bottom: 'seam', left: 'seam' });
    pp.edges = { top: raw ? { kind: 'none' } : { kind: 'seam' }, seam: raw ? { kind: 'none' } : { kind: 'seam' } };
    pp.notes.push(raw ? 'Raw edge: topstitch straight onto the panel.' : 'Sew pocket + pocket lining right sides together, leave a turning gap at the bottom, turn, press, topstitch the top edge, then topstitch onto the panel.');
    P.push(pp);
    placeOnFront(front, pk.includes('front patch pocket') ? 'pocket' : 'back pocket');
  }
  if (pk.includes('front zip pocket')) {
    const zl2 = Math.max(1.5, W * 0.55);
    const yz = frontTopY + (flapPc ? Math.max(landY + 0.4, H * 0.4) : H * 0.3);
    const x0 = (o.bodyCon === 'boxed' ? (W + D) / 2 : W / 2) - zl2 / 2;
    front.marks.push({ type: 'cutout', pts: [G.P(x0, yz), G.P(x0 + zl2, yz), G.P(x0 + zl2, yz + zip.teeth + 0.1), G.P(x0, yz + zip.teeth + 0.1)], label: 'zip window' });
    const bagP = strip(zl2 + 1, Math.max(1.2, H * 0.5) * 2, { name: 'Zip pocket bag', cut: { fabric: 0, lining: 1 } });
    bagP.marks.push({ type: 'fold', a: G.P(0, bagP.isRect.h / 2), b: G.P(bagP.isRect.w, bagP.isRect.h / 2) });
    P.push(bagP);
    addNotion(out, 'zip2', 'zipper for the pocket — ' + zip.label, 1, cm(Math.ceil(zl2 + 2)));
  }
  if (pk.includes('inside slip pocket') && (lined || o.topFinish === 'facing')) {
    const ip = strip(pW, pH * 2, { name: 'Inside pocket', cut: { fabric: 0, lining: 1 } });
    ip.marks.push({ type: 'fold', a: G.P(0, pH), b: G.P(pW, pH), label: 'fold (top of pocket)' });
    P.push(ip);
  } else if (pk.includes('inside slip pocket')) out.notes.push('Inside pocket skipped — it needs a lining or a facing to sit on.');
  // ---------- handles & straps
  buildBagStraps(m, o, S, out, P, { W, H, D, k, frontTopY, strapW0, hwMm });
  // ---------- structure notes
  if (foam) { out.notes.push('Foam / fleece: cut the body, gusset and flap pieces again from fusible fleece or thin foam WITHOUT seam allowance, and fuse/baste them to the outer pieces inside the stitching line.'); addNotion(out, 'foam', 'fusible fleece or 2 mm foam', 1, 'same pieces, no seam allowance'); }
  if (o.interfacing === 'stiff') out.notes.push('Stiff: use heavy fusible or buckram on the outer pieces, kept 1 mm inside the stitching line so the seams stay thin.');
  if (o.bagFeet && o.baseInsert) { addNotion(out, 'feet', 'mini bag feet / brad studs', 4); const bi = P.find(p => p.name === 'Base insert'); if (bi) { const b = G.bbox(bi.pts); [[0.15, 0.2], [0.85, 0.2], [0.15, 0.8], [0.85, 0.8]].forEach(f => bi.marks.push({ type: 'dot', p: G.P(b.x0 + b.w * f[0], b.y0 + b.h * f[1]), label: '' })); } }
  if (raw) out.notes.push('Raw-edge construction: the cut edge IS the finished edge. Sew pieces wrong sides together ' + fmt(Math.min(S.sa || 0.3, 0.3) * 10, 0) + ' mm from the edge; use clips instead of pins (pins leave holes in faux leather), a teflon or walking foot and a longer stitch (2.5 mm).');
  out.pieces.push(...P);
  bagSteps(out, P);
  out.flat = { kind: 'bag', W, H, D, shape, taper, rCorner, frame: plan.frame, flap: plan.flap, casingH, k };
}
// board (no seam allowance) — base inserts, from a piece outline or a w × h rectangle
function boardPiece(src, name, inset, w, h) {
  let pc;
  if (src) {
    const b = G.bbox(src.pts), cx = b.x0 + b.w / 2, cy = b.y0 + b.h / 2;
    const kx = (b.w - 2 * inset) / b.w, ky = (b.h - 2 * inset) / b.h;
    pc = makePiece({ name, cut: { fabric: 0, stiffener: 1, note: 'card / template plastic — no seam allowance' }, kind: 'stiffener' });
    pc.pts = src.pts.map(p => G.P(cx + (p.x - cx) * kx, cy + (p.y - cy) * ky)); pc.tags = src.pts.map(() => 'none');
  } else {
    pc = rectPiece(w, h, { top: 'none', right: 'none', bottom: 'none', left: 'none' }, { name, cut: { fabric: 0, stiffener: 1, note: 'card / template plastic — no seam allowance' }, kind: 'stiffener' });
  }
  pc.edges = { none: { kind: 'none' } };
  pc.isRect = null;
  autoGrain(pc);
  pc.grain = null;
  return pc;
}
// ---------- straps
function strapPiece(name, sw, L, o, S, n, note) {
  if (o.strapMake === 'ribbon' || o.strapMake === 'cord') return null;
  const folded = o.strapMake === 'folded';
  const cw = folded ? sw * 4 : sw * 2;
  const pc = strip(cw, L, { name, cut: { fabric: n, note: note || (folded ? 'press the long edges to the centre, fold in half, topstitch both edges' : 'sew into a tube, turn, press flat, topstitch') } });
  if (folded) { pc.edges = { top: { kind: 'none' }, right: { kind: 'none' }, bottom: { kind: 'none' }, left: { kind: 'none' }, seam: { kind: 'none' } }; pc.tags = pc.tags.map(() => 'none'); pc.marks.push({ type: 'fold', a: G.P(sw, 0), b: G.P(sw, L) }, { type: 'fold', a: G.P(sw * 2, 0), b: G.P(sw * 2, L) }, { type: 'fold', a: G.P(sw * 3, 0), b: G.P(sw * 3, L) }); }
  else { pc.tags = pc.tags.map((t, i) => i % 2 === 0 ? 'none' : 'seam'); pc.edges = { none: { kind: 'none' } }; pc.marks.push({ type: 'fold', a: G.P(sw, 0), b: G.P(sw, L) }); }
  return pc;
}
function buildBagStraps(m, o, S, out, P, d) {
  const { W, H, D, k } = d;
  const h = o.handles;
  const plan = out.plan;
  if (h === 'none') return;
  out.used.push('handCirc', 'armholeDepth', 'upperArmCirc', 'shoulderToWaist', 'chestCirc', 'headCircWig');
  const ringed = o.attach === 'rings' || ['adjustable', 'backpack', 'chain', 'beltstrap'].includes(h);
  let sw = d.strapW0, ringMm = d.hwMm;
  if (ringed || o.hwSize !== 'auto') { if (o.hwSize === 'auto') ringMm = hwPick('ring', sw * 10 + 0.5); sw = +o.strapW > 0 ? Math.min(+o.strapW, strapForRing(ringMm)) : strapForRing(ringMm); }
  if (o.strapMake === 'folded' && sw < 0.3) out.warnings.push('A ' + cm(sw) + ' folded strap is 4 layers of fabric only ' + fmt(sw * 10, 0) + ' mm wide — use ribbon, a faux-leather strip or cord instead (Handles drawer).');
  const s = h === 'two' ? Math.max(W * 0.38, sw * 3) : W * 0.5;
  const T = m.chestCirc / Math.PI * 0.6;                  // body thickness at the shoulder
  const drop = dropToPos(m, o.carry);                     // neck point down to the bag top
  let L = 0, desc = '';
  const custom = +o.strapLen > 0 ? +o.strapLen : 0;
  if (h === 'two') {
    if (o.handleDrop === 'hand') L = Math.max(m.handCirc * 1.3 - s, H * 0.8);
    else if (o.handleDrop === 'arm') L = Math.max(m.handCirc * 1.3, m.elbowCirc * 1.6) - s * 0.6;
    else L = 2 * m.armholeDepth * 1.15 + m.upperArmCirc * 0.5 - s * 0.5;
    desc = 'handles';
  } else if (h === 'top') { L = Math.max(m.handCirc * 1.3 - s, s * 1.15); desc = 'top handle'; }
  else if (h === 'shoulder') { L = 2 * drop + T - (W + D) * 0.6; desc = 'shoulder strap'; }
  else if (h === 'crossbody' || h === 'adjustable') { L = 2 * Math.hypot(drop, m.chestCirc * 0.2) + T - (W + D) * 0.6; desc = 'crossbody strap'; }
  else if (h === 'backpack') { L = m.armholeDepth * 1.3 + m.upperArmCirc * 0.55 + H * 0.65; desc = 'backpack straps'; }
  else if (h === 'wrist') { L = m.handCirc * 1.35; desc = 'wrist loop'; }
  else if (h === 'chain') { L = 2 * drop + T - (W + D) * 0.6; desc = 'chain'; }
  else if (h === 'beltstrap') { L = beltCirc(m, 'waist') * 1.08 + 1.2 * k * 4 - W; desc = 'belt strap'; }
  if (custom) L = custom;
  L = Math.max(L, sw * 4);
  // loop must clear the head for anything worn across or over the body
  if (['crossbody', 'adjustable', 'chain'].includes(h) && L + W < m.headCircWig * 1.1) { L = m.headCircWig * 1.1 - W; out.notes.push('Strap lengthened so the bag goes over the doll\'s head (and wig).'); }
  plan.strap = { L, sw, ringMm: ringed ? ringMm : 0, type: h };
  out.readout.strap = desc + ' ' + cm(L) + ' finished, ' + fmt(sw * 10, 0) + ' mm wide' + (ringed ? ' · ' + ringMm + ' mm hardware' : '');
  // allowances for the ends
  const endAllow = o.attach === 'seam' ? 2 * (Math.max(S.sa, 0.3) + 0.4) : o.attach === 'outside' ? 2 * Math.max(1, sw * 2) : 2 * (sw * 1.5 + 0.6);
  const add = (pc) => { if (pc) P.push(pc); };
  const ringName = { 'O-ring': 'O-rings', 'D-ring': 'D-rings', square: 'square rings' }[o.ringType] || 'D-rings';
  if (h === 'two') {
    add(strapPiece('Handle', sw, L + endAllow, o, S, 2));
    if (o.strapMake === 'ribbon' || o.strapMake === 'cord') addNotion(out, 'handle', (o.strapMake === 'cord' ? 'cord ' : 'ribbon / leather strip ') + fmt(sw * 10, 0) + ' mm', 2, cm(Math.ceil(L + endAllow)) + ' each');
  } else if (h === 'top' || h === 'wrist' || h === 'shoulder' || h === 'crossbody') {
    add(strapPiece(h === 'top' ? 'Top handle' : h === 'wrist' ? 'Wrist strap' : 'Strap', sw, L + endAllow, o, S, 1));
    if (o.strapMake === 'ribbon' || o.strapMake === 'cord') addNotion(out, 'handle', (o.strapMake === 'cord' ? 'cord ' : 'ribbon / leather strip ') + fmt(sw * 10, 0) + ' mm', 1, cm(Math.ceil(L + endAllow)));
  } else if (h === 'adjustable') {
    const Lmax = L * 1.15, cutL = Lmax + 2 * (sw * 1.5 + 0.6) + sw * 3 + 1.0;
    add(strapPiece('Adjustable strap', sw, cutL, o, S, 1, 'one end through the slider, around the clasp, back through the slider'));
    if (o.strapMake === 'ribbon' || o.strapMake === 'cord') addNotion(out, 'handle', 'ribbon / leather strip ' + fmt(sw * 10, 0) + ' mm', 1, cm(Math.ceil(cutL)));
    addNotion(out, 'slider', 'slider ' + ringMm + ' mm', 1);
    addNotion(out, 'clasp', 'swivel clasps / lobster hooks ' + hwPick('clasp', ringMm) + ' mm', 2);
    out.readout.strap += ' · adjusts about ' + cm(Lmax * 0.55) + '–' + cm(Lmax);
  } else if (h === 'backpack') {
    const cutL = L * 1.25 + sw * 3 + 1;
    add(strapPiece('Backpack strap', sw, cutL, o, S, 2, 'top end sewn into the back top seam; bottom end through the slider and the ring tab'));
    add(strapPiece('Grab handle', sw, Math.max(m.handCirc * 1.2, W * 0.45) + 2 * (S.sa + 0.4), o, S, 1));
    addNotion(out, 'slider', 'sliders ' + ringMm + ' mm', 2);
    if (o.strapMake === 'ribbon' || o.strapMake === 'cord') addNotion(out, 'handle', 'ribbon / leather strip ' + fmt(sw * 10, 0) + ' mm', 2, cm(Math.ceil(cutL)) + ' each');
  } else if (h === 'chain') {
    addNotion(out, 'chain', 'chain / bought strap with clasps', 1, cm(Math.ceil(L)));
  } else if (h === 'beltstrap') {
    add(strapPiece('Belt strap (long)', sw, L * 0.65 + sw * 3 + 1, o, S, 1));
    add(strapPiece('Belt strap (short)', sw, L * 0.35 + sw * 3 + 1, o, S, 1));
    addNotion(out, 'buckle', 'side-release or slide buckle ' + ringMm + ' mm', 1);
    addNotion(out, 'slider', 'slider ' + ringMm + ' mm', 1);
  }
  if (ringed && h !== 'none') {
    const nTabs = h === 'backpack' ? 2 : 2;
    const tabL = 2 * (sw * 1.5 + 0.5) + Math.max(0.6, H * 0.08);
    const tab = strapPiece('Ring tab', sw, tabL, o.strapMake === 'cord' ? Object.assign({}, o, { strapMake: 'folded' }) : o, S, nTabs, 'loop through the ring, both ends into the seam');
    if (tab) add(tab); else addNotion(out, 'tabribbon', 'ribbon / leather strip for the ring tabs ' + fmt(sw * 10, 0) + ' mm', nTabs, cm(Math.ceil(tabL)) + ' each');
    addNotion(out, 'ring', ringName.replace(/s$/, 's') + ' ' + ringMm + ' mm inner width', nTabs);
  }
  // placement marks on the front panel for handles stitched outside
  const front = P[0];
  if (o.attach === 'outside' && (h === 'two' || h === 'top')) {
    const off = o.bodyCon === 'boxed' ? D / 2 : 0;
    const cx = off + W / 2;
    [cx - s / 2, cx + s / 2].forEach(x => front.marks.push({ type: 'place', pts: [G.P(x - sw / 2, d.frontTopY + 0.15), G.P(x + sw / 2, d.frontTopY + 0.15), G.P(x + sw / 2, d.frontTopY + Math.max(1, sw * 2.2)), G.P(x - sw / 2, d.frontTopY + Math.max(1, sw * 2.2))] }));
  } else if ((h === 'two' || h === 'top') && o.attach === 'seam') {
    const off = o.bodyCon === 'boxed' ? D / 2 : 0;
    const cx = off + W / 2;
    [cx - s / 2, cx + s / 2].forEach(x => front.marks.push({ type: 'notch', p: G.P(x, d.frontTopY), label: '' }));
  }
}
// ---------- construction steps
function bagSteps(out, P) {
  const { o, plan, S } = out;
  const steps = out.steps;
  const add = (quick, detail) => steps.push({ quick, detail });
  const raw = o.construction === 'raw';
  const lined = o.lining === 'yes' && !raw;
  const sa = S.useSA ? fmt(S.sa) + ' cm' : 'the marked';
  add('Cut all pieces and transfer the marks.', 'Cut the outer pieces with the grain arrow parallel to the selvedge' + (lined ? ', then the lining pieces' : '') + '. ' + (o.interfacing !== 'none' ? 'Fuse the interfacing to the wrong side of the outer pieces (trim it 1 mm inside the stitching line so seams stay thin). ' : '') + 'Mark notches (2 mm snips), closure dots and placement boxes with a water-soluble pen. Seam allowance is ' + sa + ' unless the piece says otherwise. Use a 2.0 mm stitch for woven fabric, 2.5 mm for faux leather.');
  const straps = P.filter(p => /Handle|strap|Strap|tab|Tab/.test(p.name) && !/Closure tab|Zip end/.test(p.name));
  if (straps.length) add('Make the handles, straps and tabs.', o.strapMake === 'folded' ? 'Press each strip in half lengthwise, open, press both long edges to the centre crease, fold again so the edges are enclosed (4 layers) and edgestitch both long sides 1 mm from the edge. At doll scale a strip of paper slid inside while pressing keeps the folds straight.' : o.strapMake === 'tube' ? 'Fold each strip right sides together, stitch the long edge, turn with a loop turner or a tapestry needle and thread, press with the seam centred on the back and topstitch.' : 'Cut the ribbon / leather strips to length and seal the ends (fray stopper, or a lighter on synthetic ribbon).');
  if (plan.strap && plan.strap.ringMm) add('Thread the ring tabs.', 'Loop each tab through a ' + plan.strap.ringMm + ' mm ring, bring the ends together and baste them across the ring end so the ring sits snugly. They are sewn into the side / gusset seams with the ring pointing down into the bag until it is turned.');
  if ((o.bagPockets || []).includes('front zip pocket')) add('Make the front zip pocket.', 'Lay the pocket bag on the right side of the front over the zip window, stitch around the window rectangle, cut through the centre with small Y-cuts into the corners, push the pocket bag through, press. Place the zip behind the window and edgestitch around it. Fold the pocket bag up, stitch its sides — through the bag only, not the front.');
  if ((o.bagPockets || []).some(p => /patch|slip pocket/.test(p) && !/inside/.test(p))) add('Make and attach the outer pocket(s).', raw ? 'Topstitch the pocket straight onto the placement box, 1.5 mm from the edges, backtacking at the top corners.' : 'Place pocket and pocket lining right sides together, stitch around leaving a gap at the bottom, clip the corners, turn, press. Edgestitch the top. Topstitch the pocket to the placement box along the sides and bottom (this also closes the gap), reinforcing the top corners with a tiny triangle.');
  if ((o.bagPockets || []).includes('inside slip pocket') && lined) add('Make the inside pocket.', 'Fold the pocket right sides together, stitch the sides and the bottom leaving a gap, turn, press and topstitch it onto the lining back, 1/3 of the way down.');
  if (plan.closure === 'magnet') add('Set the magnetic snap.', 'Back the closure spots with a scrap of interfacing. Mark the prongs\' slots with the washer, cut them with a seam ripper, push the prongs through, add the washer and fold the prongs outward. With a flap: one half on the flap lining, the other on the front, at the dots. Without a flap: one half on each lining / facing piece at the top centre.');
  if (plan.closure === 'snap') add('Sew on the snap.', 'Sew the ball half on the underside (flap lining or front lining) and the socket half on the opposite piece at the dots. At this size sew it after the bag is turned if the snap is thicker than the layers.');
  if (plan.flap) add('Make the flap.', raw ? 'Edgestitch around the flap 1.5 mm from the edge (decorative) — the edge stays raw.' : 'Place flap and flap lining right sides together and stitch the curved / side edges, leaving the straight top open. Trim the allowance to 2 mm on curves, notch outer curves, clip into points, turn, ease the edge out with a point turner, press and edgestitch. Baste the top edge.');
  if (plan.buckles) add('Prepare the buckle straps.', 'Topstitch a strap to each placement box on the flap (the loose end passes below the flap tip). Loop each buckle tab around a buckle and stitch it to the placement box on the front.');
  if (plan.zipTop && !plan.barrel) add('Insert the zip along the top.', 'Shorten the zip to ' + cm(plan.zipLen) + ' between the stops; fold a zip end tab over each end. Sandwich the zip between the outer front and the lining front (right sides of the fabric facing the zip), stitch with a zipper foot, repeat for the back. Press the fabric away from the teeth and edgestitch.');
  if (plan.zipPanel) add(plan.zipLen && plan.zipPanel.len === plan.zipLen && o.closure === 'zip' ? 'Make the zip panel.' : 'Make the recessed zip panel.', 'Sandwich the zip between one outer and one lining zip strip along the edge marked "zip", stitch, press back and edgestitch; repeat on the other side so the zip sits between the two strips. ' + (o.closure === 'zip' ? 'Sew the ends of the zip panel to the ends of the gusset band to form a loop (right sides together), press the seams toward the band.' : 'Baste the panel ends together; it is sewn into the top seam between bag and lining.'));
  if (plan.boxed) add('Sew the body and box the corners.', 'Sew the side seams and the bottom (right sides together), leaving the box cut-outs open. Press the seams open. Pull each cut-out open, match the side seam to the bottom seam and stitch straight across, so the bag gets its ' + cm(plan.D) + ' depth.' + (plan.strap && plan.strap.ringMm ? ' Catch the ring tabs in the side seams near the top.' : ''));
  else if (plan.round) add('Sew the tube and the base.', 'Sew the two body pieces together at the sides to make a tube. Staystitch the bottom edge, clip it every 3 mm up to the stitching, then pin it to the base matching the side seams and the centre notches to the base notches. Stitch with the base on top, easing gently.');
  else if (plan.barrel) add('Sew the barrel.', 'Insert the zip between the two long top edges of the body (stitch, press, edgestitch). Open the zip halfway! Pin each end panel to the body, matching the zip to the top notch and the centre bottom to the lower notch; clip the body allowance on the curves and stitch with the body on top.');
  else if (o.bodyCon === 'band') add('Sew the gusset to the front and back.', 'Staystitch the panel corners and clip the gusset allowance where it goes round the curves. Pin the gusset to the front matching the bottom notches (and the zip-end notches), stitch with the gusset on top, clipping as you go. Repeat for the back.' + (plan.zipPanel && o.closure === 'zip' ? ' Open the zip halfway before sewing the second side so you can turn the bag.' : '') + (plan.strap && plan.strap.ringMm ? ' Baste the ring tabs to the top of the gusset first.' : ''));
  else if (o.bodyCon === 'sides') add('Assemble front, sides and base.', 'Sew the side gussets to the front and back (right sides together, stopping ' + sa + ' from the bottom). Sew the base into the bottom opening, pivoting at the corners — clip into the corners of the panels so they turn crisply.');
  else add('Sew the body.', 'Place front and back right sides together and stitch the sides and bottom' + (o.bodyCut === 'one' ? ' (the bottom is a fold — just stitch the sides)' : '') + '. Clip the corners / curves.' + (plan.frame ? ' Start and stop exactly at the hinge dots and backtack.' : ''));
  if (o.gather && o.gather !== 'none') add(o.gather === 'gathered' ? 'Gather the top edge.' : 'Fold the pleats.', o.gather === 'gathered' ? 'Run two gathering rows inside the allowance along the top edge and pull them up so the top is about 70% of its cut width; spread evenly and baste.' : 'Fold ' + o.gather.split(' ')[0] + ' small pleats (' + cm(Math.max(0.3, plan.W * 0.05)) + ' deep) evenly across the top of each panel, facing toward the centre, and baste them.');
  if (lined) add('Make the lining.', 'Sew the lining the same way as the outer bag but leave a turning gap of ' + cm(Math.max(1.5, plan.W * 0.35)) + ' in one side or the bottom seam.' + (o.topFinish === 'facing' ? ' First sew the facings to the top of the lining pieces and press the seam toward the lining.' : ''));
  if ((o.handles === 'two' || o.handles === 'top') && o.attach === 'seam') add('Baste the handles.', 'Baste the handle ends to the top of the outer bag at the notches, handle hanging down over the right side, ends extending ' + cm(Math.max(S.sa, 0.3) + 0.3) + ' past the top edge. Make sure they are not twisted.');
  if (['shoulder', 'crossbody', 'wrist'].includes(o.handles) && o.attach === 'seam') add('Baste the strap ends.', o.bodyCon === 'band' || o.bodyCon === 'sides' ? 'Baste one strap end to the top of each gusset (right sides together, strap hanging down over the bag), so they are caught when the lining is sewn on.' : 'Baste the strap ends to the top of the side seams on the right side of the bag, strap hanging down inside, ends extending past the top edge.');
  if (o.handles === 'backpack') add('Attach the backpack straps.', 'Baste the top ends of both straps and the grab handle to the top centre of the back panel (or into the zip panel seam). Baste a ring tab to each bottom corner. After turning, thread each strap through its slider, around the ring and back through the slider.');
  if (plan.flap) add('Baste the flap.', 'Baste the flap right side to the right side of the back at the top edge, centred (flap hanging down over the back).');
  if (o.topFinish === 'lining' && lined) add('Join bag and lining.', 'Put the outer bag (right side out) inside the lining (wrong side out) and stitch around the top edge. Pull the bag out through the gap in the lining, close the gap with edgestitching, push the lining in, press the top so the lining rolls 1 mm inside, and topstitch around the top.');
  else if (o.topFinish === 'facing' && !lined) add('Finish the top with the facing.', 'Sew the facing pieces into a ring, finish their lower edge, sew them to the top of the bag right sides together, understitch, turn to the inside, press and topstitch.');
  else if (o.topFinish === 'binding') add('Bind the top edge.', 'Bind the top edge with a ' + cm(Math.max(0.3, plan.H * 0.06)) + ' finished bias binding (cut 4× that wide), stitching in the ditch from the outside.');
  else if (o.topFinish === 'hem' && !raw) add('Hem the top.', 'Turn the top edge under twice (' + cm(S.hemSa / 2) + ' + ' + cm(S.hemSa / 2) + ') and edgestitch.');
  if (o.closure === 'casing') add('Stitch the casing and thread the cord.', 'Topstitch the two casing lines all around the top (between the dots), leaving the side seams open between the lines as the cord exits. Thread one cord from the left all the way round and out at the left, the other from the right; knot the ends.');
  if (o.closure === 'eyelets') add('Set the eyelets and thread the cord.', 'Punch the eyelet holes at the dots (through bag, interfacing and lining together), set the eyelets with the setter, then thread the cord in and out and knot the ends.');
  if (plan.frame) add('Glue the bag into the frame.', 'Test the fit first. Run a thin line of glue into one side of the frame channel, push the bag top in starting from the centre and working to the hinges with a blunt tool, push a length of paper twine on top to hold it, let it set; repeat on the other side. Gently squeeze the frame ends at the hinge with padded pliers.');
  if (o.handles === 'adjustable') add('Assemble the adjustable strap.', 'Thread one end of the strap through the slider\'s centre bar and stitch it back on itself. Take the other end through a clasp, back through the slider, then through the second clasp and stitch it back. Clip the clasps to the rings.');
  if (o.handles === 'chain') add('Clip on the chain.', 'Clip the chain (or bought strap) to the rings.');
  if (o.bagFeet && o.baseInsert) add('Add the base insert and feet.', 'Push the brads through the base and the card insert at the dots, open the legs on the inside, and cover the insert with a scrap of lining glued on top.');
  else if (o.baseInsert) add('Slip in the base insert.', 'Cover the card / plastic insert with lining fabric (glue the edges on the back) and drop it into the bottom of the bag.');
  add('Final press.', 'Stuff the bag with tissue to shape it, press from the outside with a pressing cloth (no direct heat on faux leather) and let it cool in shape.');
}
