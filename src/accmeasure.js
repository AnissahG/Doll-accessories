// ===================== ACCESSORY MEASUREMENTS =====================
// Builds on the shared resolveMeasurements() (core/measure.js) and adds the head, hand and foot
// values hats, bags and shoes need. Anything missing is estimated from proportions and reported.
const ACC_KEYS = ['headCircWig', 'headFrontBack', 'headEarToEar', 'crownToChin', 'handCirc', 'footLength', 'footCirc', 'footWidth', 'instepCirc', 'ankleHeight', 'heelLift'];
function resolveAcc(doll) {
  const { m, est } = resolveMeasurements(doll);
  const raw = (doll && doll.m) || {};
  const has = (k) => raw[k] && +raw[k] > 0;
  const set = (k, fb) => { if (has(k)) m[k] = +raw[k]; else { m[k] = fb(); est.add(k); } };
  const C = m.chestCirc;
  // The shared estimate for headCirc (chest × 1.05) is a hood allowance. BJD heads are relatively big but
  // much smaller than the chest-based guess, so the hat estimate uses its own proportion.
  const bare = has('headCirc') ? +raw.headCirc : 7.5 + 0.45 * C;
  if (!has('headCirc')) { m.headCirc = bare; m.headHeight = bare * 0.3; }
  set('headCircWig', () => bare + Math.max(0.6, bare * 0.06));
  const Cw = m.headCircWig;
  set('headFrontBack', () => Cw * 0.62);
  set('headEarToEar', () => Cw * 0.58);
  set('crownToChin', () => Cw * 0.6);
  set('handCirc', () => C * 0.24);
  set('footLength', () => doll && doll.heightCm ? doll.heightCm * 0.125 : C * 0.27);
  set('footWidth', () => m.footLength * 0.38);
  set('footCirc', () => m.footLength * 0.95);
  set('instepCirc', () => Math.max(m.footCirc * 1.04, m.footLength));
  set('ankleHeight', () => m.footLength * 0.27);
  set('heelLift', () => 0);
  // sanity checks for the new values
  const chk = m._checks || [];
  if (has('headCircWig') && has('headCirc') && +raw.headCircWig < +raw.headCirc) chk.push({ k: 'headCircWig', msg: 'Head over the wig (' + fmt(+raw.headCircWig) + ') is smaller than the bare head (' + fmt(+raw.headCirc) + ') — check them.' });
  if (has('headFrontBack') && +raw.headFrontBack < Cw * 0.4) chk.push({ k: 'headFrontBack', msg: 'Front to back over the crown (' + fmt(+raw.headFrontBack) + ' cm) looks short for a ' + fmt(Cw) + ' cm head — measure from the forehead hairline over the top to the nape.' });
  if (has('headEarToEar') && +raw.headEarToEar < Cw * 0.35) chk.push({ k: 'headEarToEar', msg: 'Ear to ear (' + fmt(+raw.headEarToEar) + ' cm) looks short for a ' + fmt(Cw) + ' cm head.' });
  if (has('footWidth') && m.footWidth > m.footLength * 0.7) chk.push({ k: 'footWidth', msg: 'Foot width (' + fmt(m.footWidth) + ') is more than 70% of the foot length — check them.' });
  if (has('footCirc') && m.footCirc < m.footWidth * 2) chk.push({ k: 'footCirc', msg: 'Foot circumference (' + fmt(m.footCirc) + ') must be more than twice the foot width (' + fmt(m.footWidth) + ').' });
  m._checks = chk;
  return { m, est };
}
// human-size reference → this doll
function dollScale(m) { return m.k; }
// body circumference at a named belt / strap position
function beltCirc(m, pos) {
  switch (pos) {
    case 'underbust': return m.underbustCirc;
    case 'high waist': return bodyCircAt(m, 0) * 0.98;
    case 'waist': return m.waistCirc;
    case 'high hip': return m.highHipCirc;
    case 'hip': return m.hipCirc;
    case 'low hip': return m.lowHipCirc;
    default: return m.waistCirc;
  }
}
function thighCircAt(m, where) {
  // thigh tapers from the top of the thigh to the knee
  const t = { 'upper thigh': 0.15, 'mid thigh': 0.5, 'above knee': 0.85 }[where] ?? 0.5;
  return m.thighCirc + (m.kneeCirc - m.thighCirc) * t;
}
// how far below the neck point a belt position is
function dropToPos(m, pos) {
  const W = m.shoulderToWaist;
  switch (pos) {
    case 'chest': return m.shoulderToBust;
    case 'underbust': return m.shoulderToBust + (W - m.shoulderToBust) * 0.35;
    case 'waist': return W;
    case 'high hip': return W + m.waistToHighHip;
    case 'hip': return W + m.waistToHip;
    case 'low hip': return W + m.waistToLowHip;
    case 'mid thigh': return W + m.waistToMidThigh;
    case 'knee': return W + m.waistToKnee;
    default: return W + m.waistToHip;
  }
}
