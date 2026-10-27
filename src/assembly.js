// ===================== ACCESSORY ASSEMBLY =====================
function settingsFrom(o) {
  const sa = o.sa === 'custom' ? (+o.saCm || 0) : +o.sa;
  const hemSa = o.hemSa === 'custom' ? (+o.hemSaCm || 0) : +o.hemSa;
  return { useSA: sa > 0, sa, hemSa: sa > 0 ? hemSa : 0, paper: o.paper || 'A4', packPages: o.packPages !== false, brand: 'DOLLHEIMR' };
}
const BUILDERS = { bag: () => buildBag, hat: () => buildHat, belt: () => buildBeltFamily, neck: () => buildNeck, hair: () => buildHair, styling: () => buildStyling, shoe: () => buildShoe, collar: () => buildCollar, apron: () => buildApron, leg: () => buildLeg };
function buildAccessory(doll, raw) {
  const o = normalizeOptions(raw);
  const { m, est } = resolveAcc(doll);
  const S = settingsFrom(o);
  const out = { o, m, est, S, pieces: [], notes: [], warnings: [], notions: [], steps: [], checks: [], plan: {}, flat: {}, info: {}, readout: {}, used: [] };
  (m._checks || []).forEach(c => out.warnings.push('Doll measurements: ' + c.msg));
  try {
    const fn = BUILDERS[o.cat] && BUILDERS[o.cat]();
    if (fn) fn(m, o, S, out);
  } catch (err) {
    out.warnings.push('Drafting error: ' + err.message);
    if (typeof console !== 'undefined') console.error(err);
  }
  // tiny pieces: keep strips sewable
  const MIN_W = 0.4;
  out.pieces.forEach(pc => {
    const b = G.bbox(pc.pts);
    const mn = Math.min(b.w, b.h);
    if (mn >= MIN_W || mn <= 0 || pc.kind === 'stiffener') return;
    if (pc.isRect) {
      const kx = MIN_W / mn, horiz = b.w >= b.h;
      transformPiece(pc, p => horiz ? G.P(p.x, b.y0 + (p.y - b.y0) * kx) : G.P(b.x0 + (p.x - b.x0) * kx, p.y));
      pc.isRect = { w: horiz ? pc.isRect.w : pc.isRect.w * kx, h: horiz ? pc.isRect.h * kx : pc.isRect.h };
      pc.notes.push('Widened to ' + cm(MIN_W) + ' — narrower is not sewable.');
    } else out.warnings.push(pc.name + ' is only ' + cm(mn) + ' across at this doll size — consider felt / faux leather with raw edges, or a larger size.');
  });
  if (m.chestCirc < 20 && S.useSA && S.sa >= 0.5) out.notes.push('Small doll: a 0.3 cm seam allowance (Seam allowance drawer) with fray stopper on the edges is much easier to handle than ' + cm(S.sa) + '.');
  out.pieces.forEach((pc, i) => { pc.code = String(i + 1); });
  const used = Array.from(new Set(out.used)).filter(k => est.has(k) && (MEAS_LABEL[k]));
  if (used.length) out.info.estimated = used.map(k => MEAS_LABEL[k]);
  return out;
}
// the app shell calls buildGarment — same signature
const buildGarment = buildAccessory;
