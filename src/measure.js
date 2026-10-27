// ===================== MEASUREMENTS =====================
// Field list for the Dolls form. Keys marked knit:true use exactly the same key as
// Doll knit Pattern Studio, so dolls import 1:1 from a knit backup.
const DOLL_FIELDS = [
  { sec: 'Upper body' },
  { k: 'chestCirc', l: 'Chest / bust circumference', knit: 1, req: 1 },
  { k: 'neckCirc', l: 'Neck circumference', knit: 1 },
  { k: 'armholeDepth', l: 'Armhole depth', h: 'vertical, shoulder point straight down to underarm', knit: 1 },
  { k: 'shoulderWidth', l: 'Shoulder seam length', h: 'one shoulder — neck point to arm point', knit: 1 },
  { k: 'upperArmCirc', l: 'Upper arm circumference', knit: 1 },
  { k: 'elbowCirc', l: 'Elbow circumference', knit: 1 },
  { k: 'wristCirc', l: 'Wrist circumference', knit: 1 },
  { k: 'neckToChin', l: 'Neck base to chin', h: 'optional — tall collars', knit: 1 },
  { k: 'headCirc', l: 'Head circumference', h: 'optional — hoods', knit: 1 },
  { k: 'headHeight', l: 'Head height', h: 'optional — hoods', knit: 1 },
  { sec: 'Sewing — bodice', sew: 1 },
  { k: 'acrossBack', l: 'Across back', h: 'armhole crease to armhole crease, mid-shoulder-blade' },
  { k: 'acrossFront', l: 'Across front', h: 'armhole crease to armhole crease, above the bust' },
  { k: 'napeToWaist', l: 'Nape to waist (centre back)', h: 'base of neck at the back, straight down to waist' },
  { k: 'frontNeckToWaist', l: 'Front neck to waist (centre front)', h: 'hollow of the neck down over the bust to waist' },
  { k: 'bustProjection', l: 'Bust projection', h: 'how far the bust stands out from the chest wall — 0 for a flat chest. Drives bust darts.' },
  { k: 'bustSpan', l: 'Bust point to bust point' },
  { k: 'shoulderToBust', l: 'Shoulder to bust point', h: 'neck point down to the bust apex' },
  { k: 'underbustCirc', l: 'Underbust circumference', h: 'optional — empire lines' },
  { k: 'shoulderSlope', l: 'Shoulder slope (degrees)', h: 'optional — 0 is square; most dolls 12–22°' },
  { sec: 'Length landmarks', h: 'measured from the shoulder (neck point)' },
  { k: 'shoulderToWaist', l: 'Shoulder to waist', knit: 1 },
  { k: 'shoulderToHip', l: 'Shoulder to hip', knit: 1 },
  { k: 'shoulderToMidThigh', l: 'Shoulder to mid-thigh', knit: 1 },
  { k: 'shoulderToKnee', l: 'Shoulder to knee', knit: 1 },
  { k: 'shoulderToElbow', l: 'Shoulder to elbow', knit: 1 },
  { k: 'shoulderToWrist', l: 'Arm length (shoulder to wrist)', knit: 1 },
  { sec: 'Lower body' },
  { k: 'waistCirc', l: 'Waist circumference', knit: 1 },
  { k: 'hipCirc', l: 'Hip circumference', knit: 1 },
  { k: 'highHipCirc', l: 'High hip circumference', h: 'optional — halfway between waist and hip' },
  { k: 'lowHipCirc', l: 'Low hip / seat circumference', h: 'widest point around the bum — often bigger than "hip" on dolls' },
  { k: 'thighCirc', l: 'Thigh circumference', knit: 1 },
  { k: 'kneeCirc', l: 'Knee circumference', h: 'optional' },
  { k: 'calfCirc', l: 'Calf circumference', knit: 1 },
  { k: 'ankleCirc', l: 'Ankle circumference', knit: 1 },
  { k: 'hipToCrotch', l: 'Hip line to crotch', h: 'from the HIP line down to the crotch — not the full rise from the waist', knit: 1 },
  { k: 'crotchToKnee', l: 'Crotch to knee', knit: 1 },
  { k: 'crotchToAnkle', l: 'Crotch to ankle (inseam)', knit: 1 },
  { k: 'crotchLength', l: 'Crotch length', h: 'front waist, down between the legs, up to back waist — trousers', sew: 1 },
  { sec: 'Sewing — waist down', h: 'optional — these override the values worked out from the shoulder landmarks' },
  { k: 'waistToHighHip', l: 'Waist to high hip' },
  { k: 'waistToHip', l: 'Waist to hip' },
  { k: 'waistToLowHip', l: 'Waist to low hip' },
  { k: 'waistToMidThigh', l: 'Waist to mid-thigh' },
  { k: 'waistToKnee', l: 'Waist to knee' },
  { k: 'waistToAnkle', l: 'Waist to ankle' },
  { sec: 'Head — hats', h: 'used by Doll accessories. Measure WITH the wig on, where the hat will sit.', acc: 1 },
  { k: 'headCircWig', l: 'Head circumference over the wig', h: 'around the forehead and the back of the head, where a hat band sits', acc: 1 },
  { k: 'headFrontBack', l: 'Front to back over the crown', h: 'forehead hairline, over the top, down to the nape — over the wig', acc: 1 },
  { k: 'headEarToEar', l: 'Ear to ear over the crown', h: 'top of one ear, over the top of the head, to the other ear — over the wig', acc: 1 },
  { k: 'crownToChin', l: 'Top of head to under the chin', h: 'over the wig, down in front of the ear to under the chin — bonnets, hoods, ear flaps', acc: 1 },
  { sec: 'Hands & feet', h: 'foot length / circumference are shared with Doll knit; the rest is used by Doll accessories (bag handles, shoes)' },
  { k: 'handCirc', l: 'Hand circumference', h: 'around the knuckles, thumb tucked in — bag handles must slip over it', acc: 1 },
  { k: 'footLength', l: 'Foot length', knit: 1 },
  { k: 'footCirc', l: 'Foot circumference', h: 'around the ball of the foot (widest part)', knit: 1 },
  { k: 'footWidth', l: 'Foot width', h: 'across the sole at the widest point', acc: 1 },
  { k: 'instepCirc', l: 'Instep circumference', h: 'around the top of the arch and under the sole', acc: 1 },
  { k: 'ankleHeight', l: 'Floor to ankle bone', acc: 1 },
  { k: 'heelLift', l: 'Heel lift of the foot sculpt', h: '0 for flat feet; how high the heel sits on high-heel feet', acc: 1 }
];
const MEAS_LABEL = {};
DOLL_FIELDS.forEach(f => { if (f.k) MEAS_LABEL[f.k] = f.l; });

// Resolve a doll into a complete measurement set. Missing values are estimated from
// proportions (and reported so the pattern can say which numbers were guessed).
function resolveMeasurements(doll) {
  const raw = Object.assign({}, doll && doll.m ? doll.m : {});
  const est = new Set();
  const m = {};
  const has = (k) => raw[k] && raw[k] > 0;
  const set = (k, fallback) => { if (has(k)) m[k] = +raw[k]; else { m[k] = fallback(); est.add(k); } };
  if (!has('chestCirc')) {
    // everything scales from chest — try to infer from height
    const h = doll && doll.heightCm ? doll.heightCm : 60;
    raw.chestCirc = h * 0.47; est.add('chestCirc');
  }
  m.chestCirc = +raw.chestCirc;
  const C = m.chestCirc;
  m.heightCm = doll && doll.heightCm ? +doll.heightCm : C * 2.1;
  set('neckCirc', () => C * 0.36);
  set('shoulderWidth', () => C * 0.12);
  set('armholeDepth', () => C * 0.17);
  set('upperArmCirc', () => C * 0.28);
  set('wristCirc', () => C * 0.19);
  set('elbowCirc', () => (m.upperArmCirc + m.wristCirc) / 2);
  set('acrossBack', () => C * 0.37);
  set('acrossFront', () => C * 0.35);
  set('bustProjection', () => 0);
  set('shoulderSlope', () => 17);
  set('shoulderToWaist', () => has('napeToWaist') ? +raw.napeToWaist : C * 0.48);
  set('napeToWaist', () => m.shoulderToWaist);
  set('bustSpan', () => C * 0.19);
  set('shoulderToBust', () => m.shoulderToWaist * 0.45);
  set('waistCirc', () => C * 0.66);
  set('hipCirc', () => C * 1.03);
  set('underbustCirc', () => C - m.bustProjection * 2.2);
  set('highHipCirc', () => (m.waistCirc + m.hipCirc) / 2);
  set('lowHipCirc', () => m.hipCirc);
  set('thighCirc', () => m.hipCirc * 0.58);
  set('kneeCirc', () => m.thighCirc * 0.62);
  set('calfCirc', () => m.thighCirc * 0.58);
  set('ankleCirc', () => m.thighCirc * 0.4);
  set('neckToChin', () => m.neckCirc * 0.22);
  set('headCirc', () => C * 1.05);
  set('headHeight', () => m.headCirc * 0.3);
  // vertical
  set('waistToHip', () => has('shoulderToHip') ? raw.shoulderToHip - m.shoulderToWaist : m.shoulderToWaist * 0.45);
  set('shoulderToHip', () => m.shoulderToWaist + m.waistToHip);
  set('hipToCrotch', () => m.shoulderToWaist * 0.24);
  set('waistToHighHip', () => m.waistToHip * 0.5);
  set('waistToLowHip', () => m.waistToHip + m.hipToCrotch * 0.55);
  set('crotchToAnkle', () => m.heightCm * 0.41);
  set('crotchToKnee', () => m.crotchToAnkle * 0.48);
  set('waistToMidThigh', () => has('shoulderToMidThigh') ? raw.shoulderToMidThigh - m.shoulderToWaist : m.waistToHip + m.hipToCrotch + m.crotchToKnee * 0.5);
  set('waistToKnee', () => has('shoulderToKnee') ? raw.shoulderToKnee - m.shoulderToWaist : m.waistToHip + m.hipToCrotch + m.crotchToKnee);
  set('waistToAnkle', () => m.waistToHip + m.hipToCrotch + m.crotchToAnkle);
  set('shoulderToMidThigh', () => m.shoulderToWaist + m.waistToMidThigh);
  set('shoulderToKnee', () => m.shoulderToWaist + m.waistToKnee);
  set('crotchLength', () => (m.waistToHip + m.hipToCrotch) * 2.45);
  set('shoulderToWrist', () => C * 0.62);
  set('shoulderToElbow', () => m.shoulderToWrist * 0.47);
  // front length: same waist level as the back, plus whatever the bust takes up
  set('frontNeckToWaist', () => m.napeToWaist - m.neckCirc * 0.14 + m.bustProjection * 0.9);
  m.footLength = raw.footLength || 0; m.footCirc = raw.footCirc || 0;
  // sanity checks: catch typos and contradictions before they bend the draft
  m._checks = checkMeasurements(m, raw, est, has);
  // derived
  m.seatDepth = m.waistToHip + m.hipToCrotch;           // waist to crotch
  m.passCirc = Math.max(m.hipCirc, m.lowHipCirc);       // widest point a bottom must get past
  m.ks = C / 88;                                         // human-cm -> doll-cm (horizontal)
  m.kv = m.napeToWaist / 41;                             // human-cm -> doll-cm (vertical)
  m.k = (m.ks + m.kv) / 2;
  return { m, est };
}

// ---------- ease ----------
// Ease is a percentage of the body measurement (so it stays proportional across doll sizes)
// plus a small fixed allowance for fabric thickness, which does NOT shrink with the doll.
const FIT_EASE = {
  // chest, waist, hip, arm, armholeDepthAdd
  'skin-tight': [0.00, 0.00, 0.00, 0.04, 0.00],
  'fitted': [0.06, 0.06, 0.05, 0.12, 0.05],
  'semi-fitted': [0.09, 0.10, 0.07, 0.16, 0.08],
  'regular': [0.13, 0.16, 0.10, 0.22, 0.12],
  'relaxed': [0.19, 0.24, 0.14, 0.30, 0.18],
  'loose': [0.26, 0.34, 0.20, 0.40, 0.24],
  'oversized': [0.40, 0.50, 0.32, 0.55, 0.32],
  'extreme oversized': [0.62, 0.75, 0.50, 0.80, 0.45],
  'boxy': [0.26, 0.60, 0.20, 0.34, 0.20]
};
const STRETCH_REDUCE = { woven: 0, low: 0.03, medium: 0.07, high: 0.12 };
function computeEase(m, o) {
  const fe = FIT_EASE[o.fit] || FIT_EASE.regular;
  const red = STRETCH_REDUCE[o.fabric || 'woven'] || 0;
  const thick = o.fabric && o.fabric !== 'woven' ? 0.2 : 0.45; // cm, fabric turn-of-cloth
  const pick = (key, idx, meas) => {
    const v = o['ease_' + key];
    if (v !== undefined && v !== '' && v !== null && !isNaN(+v)) return +v;
    let pct = fe[idx] - red;
    if (o.fit === 'skin-tight') pct = -red; // negative ease only with stretch
    return meas * pct + (pct >= 0 ? thick : 0);
  };
  // outerwear is worn over other clothes: add a layering allowance on top of the fit ease
  const LAYER = { hoodie: [0.05, 0.08, 0.05], cardigan: [0.04, 0.06, 0.04], jacket: [0.08, 0.12, 0.08], blazer: [0.06, 0.1, 0.06], coat: [0.11, 0.15, 0.1] }[o.garment];
  const lay = (key, frac, meas) => { const v = o['ease_' + key]; return LAYER && !(v !== undefined && v !== '' && v !== null && !isNaN(+v)) ? meas * frac : 0; };
  return {
    chest: pick('chest', 0, m.chestCirc) + lay('chest', LAYER ? LAYER[0] : 0, m.chestCirc),
    waist: pick('waist', 1, m.waistCirc) + lay('waist', LAYER ? LAYER[0] : 0, m.waistCirc),
    hip: pick('hip', 2, m.hipCirc) + lay('hip', LAYER ? LAYER[0] : 0, m.hipCirc),
    arm: pick('arm', 3, m.upperArmCirc) + lay('arm', LAYER ? LAYER[1] : 0, m.upperArmCirc),
    armholeAdd: m.armholeDepth * (fe[4] + (LAYER ? LAYER[2] : 0)),
    layer: !!LAYER,
    thick
  };
}

// ---------- length landmarks ----------
// Tops: measured down centre back from the nape.
function topLengthCB(m, key, custom) {
  const NW = m.napeToWaist;
  switch (key) {
    case 'micro crop': return NW - (NW - m.armholeDepth) * 0.55;
    case 'crop': return NW - (NW - m.armholeDepth) * 0.25;
    case 'waist': return NW;
    case 'high hip': return NW + m.waistToHighHip;
    case 'hip': return NW + m.waistToHip;
    case 'longline': return NW + m.waistToLowHip + m.hipToCrotch * 0.2;
    case 'tunic': return NW + (m.waistToHip + m.waistToMidThigh) / 2;
    case 'custom': return custom > 0 ? custom : NW + m.waistToHip;
    default: return NW + m.waistToHip;
  }
}
// Below-waist landmarks: distance from the natural waist
function belowWaist(m, key, custom) {
  const kneeToAnkle = m.waistToAnkle - m.waistToKnee;
  switch (key) {
    case 'waist': return 0;
    case 'high hip': return m.waistToHighHip;
    case 'hip': return m.waistToHip;
    case 'low hip': return m.waistToLowHip;
    case 'micro': return m.seatDepth + m.crotchToKnee * 0.08;
    case 'mini': case 'upper thigh': return m.seatDepth + m.crotchToKnee * 0.2;
    case 'mid thigh': return m.waistToMidThigh;
    case 'above knee': return m.waistToKnee - m.crotchToKnee * 0.18;
    case 'knee': return m.waistToKnee;
    case 'midi': return m.waistToKnee + kneeToAnkle * 0.45;
    case 'calf': return m.waistToKnee + kneeToAnkle * 0.6;
    case 'ankle': return m.waistToAnkle;
    case 'maxi': case 'floor': return m.waistToAnkle + m.crotchToAnkle * 0.07;
    // trouser lengths
    case 'hot pants': return m.seatDepth + m.crotchToKnee * 0.06;
    case 'short': return m.seatDepth + m.crotchToKnee * 0.22;
    case 'bermuda': return m.waistToKnee - m.crotchToKnee * 0.12;
    case 'cropped': return m.waistToKnee + kneeToAnkle * 0.55;
    case 'capri': return m.waistToKnee + kneeToAnkle * 0.4;
    case 'full': return m.waistToAnkle + m.crotchToAnkle * 0.03;
    case 'puddle': return m.waistToAnkle + m.crotchToAnkle * 0.1;
    case 'custom': return custom > 0 ? custom : m.waistToKnee;
    default: return m.waistToKnee;
  }
}
// waist position offset (positive = lower than natural waist)
function waistPosOffset(m, key) {
  switch (key) {
    case 'empire': return -(m.napeToWaist - m.shoulderToBust) * 0.55;
    case 'high': case 'high waist': return -m.waistToHip * 0.12;
    case 'natural': case 'natural waist': return 0;
    case 'mid': return m.waistToHip * 0.3;
    case 'low': case 'low waist': case 'low rise': return m.waistToHip * 0.55;
    case 'ultra-low': return m.waistToHip * 0.85;
    case 'dropped': case 'dropped waist': case 'hip': return m.waistToHip;
    default: return 0;
  }
}
// circumference of the body at a given distance below the natural waist
function bodyCircAt(m, d) {
  if (d <= 0) return m.waistCirc;
  const pts = [[0, m.waistCirc], [m.waistToHighHip, m.highHipCirc], [m.waistToHip, m.hipCirc], [m.waistToLowHip, m.lowHipCirc]];
  for (let i = 1; i < pts.length; i++) {
    if (d <= pts[i][0]) { const [a, ca] = pts[i - 1], [b, cb] = pts[i]; return ca + (cb - ca) * (d - a) / Math.max(1e-6, b - a); }
  }
  return m.lowHipCirc;
}
const fmt = (v, d = 1) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toString();
const cm = (v) => fmt(v) + ' cm';

// ---------- measurement sanity checks ----------
// Returns [{k, msg, fixed}]. Impossible values (a thigh smaller than the calf…) are replaced by a
// safe estimate so the pattern still drafts; contradictions are reported.
function checkMeasurements(m, raw, est, has) {
  const out = [];
  const L = (k) => (DOLL_FIELDS.find(f => f.k === k) || { l: k }).l;
  const C = m.chestCirc;
  // 1. circumferences that are far too small for this doll — almost always a missing digit
  const circ = ['neckCirc', 'upperArmCirc', 'elbowCirc', 'wristCirc', 'waistCirc', 'hipCirc', 'highHipCirc', 'lowHipCirc', 'thighCirc', 'kneeCirc', 'calfCirc', 'ankleCirc'];
  circ.forEach(k => { if (has(k) && +raw[k] < C * 0.12) out.push({ k, msg: L(k) + ' = ' + fmt(+raw[k]) + ' cm looks like a typo for this doll (chest ' + fmt(C) + ' cm).' }); });
  // 2. leg circumferences must get smaller from thigh to ankle
  if (has('thighCirc')) {
    const lo = Math.max(m.hipCirc * 0.38, has('calfCirc') ? +raw.calfCirc * 1.02 : 0, has('kneeCirc') ? +raw.kneeCirc * 1.02 : 0);
    if (m.thighCirc < lo) {
      const fix = Math.max(m.hipCirc * 0.58, has('calfCirc') ? +raw.calfCirc * 1.3 : 0, has('kneeCirc') ? +raw.kneeCirc * 1.15 : 0);
      out.push({ k: 'thighCirc', fixed: true, msg: 'Thigh = ' + fmt(+raw.thighCirc) + ' cm is smaller than ' + (has('calfCirc') ? 'the calf (' + fmt(+raw.calfCirc) + ' cm)' : 'possible for ' + fmt(m.hipCirc) + ' cm hips') + ' — probably a typo. The pattern uses ' + fmt(fix) + ' cm until you correct it.' });
      m.thighCirc = fix; est.add('thighCirc');
      if (!has('kneeCirc')) m.kneeCirc = Math.max(fix * 0.62, has('calfCirc') ? +raw.calfCirc * 1.02 : 0);
      if (!has('calfCirc')) m.calfCirc = fix * 0.58;
      if (!has('ankleCirc')) m.ankleCirc = fix * 0.4;
    }
  }
  if (has('kneeCirc') && has('calfCirc') && +raw.calfCirc > +raw.kneeCirc * 1.25) out.push({ k: 'calfCirc', msg: 'Calf (' + fmt(+raw.calfCirc) + ') is much bigger than the knee (' + fmt(+raw.kneeCirc) + ') — check them.' });
  if (has('ankleCirc') && +raw.ankleCirc > m.calfCirc) out.push({ k: 'ankleCirc', msg: 'Ankle (' + fmt(+raw.ankleCirc) + ') is bigger than the calf (' + fmt(m.calfCirc) + ') — check them.' });
  if (has('wristCirc') && +raw.wristCirc > m.upperArmCirc) out.push({ k: 'wristCirc', msg: 'Wrist (' + fmt(+raw.wristCirc) + ') is bigger than the upper arm (' + fmt(m.upperArmCirc) + ') — check them.' });
  // 3. waist-to-crotch depth from three directions
  const refs = [];
  if (has('crotchToKnee') && (has('waistToKnee') || has('shoulderToKnee'))) refs.push(m.waistToKnee - +raw.crotchToKnee);
  if (has('crotchToAnkle') && has('waistToAnkle')) refs.push(+raw.waistToAnkle - +raw.crotchToAnkle);
  const ref = refs.filter(v => v > 0).reduce((s, v, i, a) => s + v / a.length, 0);
  if (ref > 0 && has('hipToCrotch')) {
    const d0 = m.waistToHip + m.hipToCrotch;
    if (d0 > ref * 1.25 && Math.abs(+raw.hipToCrotch - ref) <= ref * 0.3 && +raw.hipToCrotch > m.waistToHip) {
      const fix = Math.max(0.3, +raw.hipToCrotch - m.waistToHip);
      out.push({ k: 'hipToCrotch', fixed: true, msg: '"Hip line to crotch" = ' + fmt(+raw.hipToCrotch) + ' cm looks like the full rise (waist to crotch): your leg lengths put the crotch about ' + fmt(ref) + ' cm below the waist. The pattern uses ' + fmt(fix) + ' cm from the hip line (' + fmt(+raw.hipToCrotch) + ' − ' + fmt(m.waistToHip) + ' waist to hip). Correct the field to keep it that way.' });
      m.hipToCrotch = fix;
      if (est.has('waistToLowHip')) m.waistToLowHip = m.waistToHip + fix * 0.55;
      if (est.has('waistToMidThigh')) m.waistToMidThigh = m.waistToHip + fix + m.crotchToKnee * 0.5;
      if (est.has('waistToKnee')) m.waistToKnee = m.waistToHip + fix + m.crotchToKnee;
      if (est.has('waistToAnkle')) m.waistToAnkle = m.waistToHip + fix + m.crotchToAnkle;
      if (est.has('crotchLength')) m.crotchLength = (m.waistToHip + fix) * 2.45;
    } else if (Math.abs(d0 - ref) > Math.max(1, ref * 0.25)) {
      out.push({ k: 'hipToCrotch', msg: 'The crotch depth doesn\'t add up: waist→hip + hip→crotch = ' + fmt(d0) + ' cm, but your leg lengths say about ' + fmt(ref) + ' cm (waist→knee − crotch→knee / waist→ankle − inseam). Check those measurements.' });
    }
  }
  // 4. crotch length must wrap under the body: more than twice the waist-to-crotch depth
  const seat = m.waistToHip + m.hipToCrotch;
  if (has('crotchLength') && m.crotchLength < seat * 2.15) {
    const fix = seat * 2.3;
    out.push({ k: 'crotchLength', fixed: true, msg: 'Crotch length = ' + fmt(+raw.crotchLength) + ' cm is too short for a ' + fmt(seat) + ' cm waist-to-crotch depth (front + back alone are ' + fmt(seat * 2) + ' cm, plus the part between the legs). The pattern uses ' + fmt(fix) + ' cm — measure it again with a tape from front waist, between the legs, to back waist.' });
    m.crotchLength = fix;
  }
  // 5. waist-to-hip entered twice in different ways
  if (has('waistToHip') && has('shoulderToHip') && has('shoulderToWaist')) {
    const alt = +raw.shoulderToHip - +raw.shoulderToWaist;
    if (Math.abs(alt - +raw.waistToHip) > Math.max(0.8, alt * 0.3)) out.push({ k: 'waistToHip', msg: 'Waist to hip (' + fmt(+raw.waistToHip) + ') doesn\'t match shoulder→hip − shoulder→waist (' + fmt(alt) + '). The pattern uses ' + fmt(+raw.waistToHip) + ' — check which one is right.' });
  }
  // one message per field: a fixed value replaces the plain typo warning
  return out.filter(c => c.fixed || !out.some(d => d.fixed && d.k === c.k));
}
