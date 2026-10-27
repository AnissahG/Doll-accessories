// ===================== GEOMETRY =====================
// All drafting is done in centimetres. y grows downward (like paper / SVG).
const G = (() => {
  const P = (x, y) => ({ x, y });
  const add = (a, b) => P(a.x + b.x, a.y + b.y);
  const sub = (a, b) => P(a.x - b.x, a.y - b.y);
  const mul = (a, s) => P(a.x * s, a.y * s);
  const len = (a) => Math.hypot(a.x, a.y);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const norm = (a) => { const l = len(a) || 1; return P(a.x / l, a.y / l); };
  const lerp = (a, b, t) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  const perp = (a) => P(-a.y, a.x);
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const cross = (a, b) => a.x * b.y - a.y * b.x;
  const rot = (p, ang, c = P(0, 0)) => {
    const s = Math.sin(ang), co = Math.cos(ang);
    const d = sub(p, c);
    return P(c.x + d.x * co - d.y * s, c.y + d.x * s + d.y * co);
  };
  const deg = (d) => d * Math.PI / 180;
  const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const polar = (o, ang, r) => P(o.x + Math.cos(ang) * r, o.y + Math.sin(ang) * r);

  // cubic bezier sampled into n segments (returns n+1 points)
  function bez(p0, p1, p2, p3, n = 16) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push(P(
        u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y));
    }
    return out;
  }
  // quadratic bezier
  function qbez(p0, p1, p2, n = 12) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push(P(u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y));
    }
    return out;
  }
  // circular arc from angle a0 to a1 (radians) around c, radius r
  function arc(c, r, a0, a1, n = 24) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(polar(c, a0 + (a1 - a0) * i / n, r));
    return out;
  }
  function plen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; }
  // point at arc length s along polyline, plus tangent
  function pointAt(pts, s) {
    if (s <= 0) return { p: pts[0], t: norm(sub(pts[1], pts[0])), i: 0 };
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i - 1], pts[i]);
      if (acc + d >= s) {
        const t = d ? (s - acc) / d : 0;
        return { p: lerp(pts[i - 1], pts[i], t), t: norm(sub(pts[i], pts[i - 1])), i };
      }
      acc += d;
    }
    const n = pts.length;
    return { p: pts[n - 1], t: norm(sub(pts[n - 1], pts[n - 2])), i: n - 1 };
  }
  // sub-polyline between arc lengths s0..s1
  function slice(pts, s0, s1) {
    const out = [];
    const a = pointAt(pts, s0), b = pointAt(pts, s1);
    out.push(a.p);
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      acc += dist(pts[i - 1], pts[i]);
      if (acc > s0 && acc < s1) out.push(pts[i]);
    }
    out.push(b.p);
    return out;
  }
  // resample polyline to evenly spaced points
  function resample(pts, n) {
    const L = plen(pts), out = [];
    for (let i = 0; i <= n; i++) out.push(pointAt(pts, L * i / n).p);
    return out;
  }
  function reverse(pts) { return pts.slice().reverse(); }
  function mirrorX(pts, x0 = 0) { return pts.map(p => P(2 * x0 - p.x, p.y)); }
  function mirrorY(pts, y0 = 0) { return pts.map(p => P(p.x, 2 * y0 - p.y)); }
  function translate(pts, dx, dy) { return pts.map(p => P(p.x + dx, p.y + dy)); }
  function rotatePts(pts, ang, c) { return pts.map(p => rot(p, ang, c)); }
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }
  function area(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; } return a / 2; }
  function centroid(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const f = p.x * q.y - q.x * p.y; a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
    }
    if (Math.abs(a) < 1e-9) { const b = bbox(pts); return P((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2); }
    return P(cx / (3 * a), cy / (3 * a));
  }
  function lineIntersect(p1, d1, p2, d2) {
    const c = cross(d1, d2);
    if (Math.abs(c) < 1e-9) return null;
    const t = cross(sub(p2, p1), d2) / c;
    return add(p1, mul(d1, t));
  }
  function segIntersect(a, b, c, d) {
    const r = sub(b, a), s = sub(d, c), rxs = cross(r, s);
    if (Math.abs(rxs) < 1e-12) return null;
    const t = cross(sub(c, a), s) / rxs, u = cross(sub(c, a), r) / rxs;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { p: add(a, mul(r, t)), t, u };
    return null;
  }
  function pointInPoly(p, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if (((a.y > p.y) !== (b.y > p.y)) && (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) c = !c;
    }
    return c;
  }
  // remove consecutive near-duplicate points
  function clean(pts, eps = 1e-4) {
    const out = [];
    for (const p of pts) if (!out.length || dist(out[out.length - 1], p) > eps) out.push(p);
    return out;
  }
  // find x on polyline at given y (first crossing)
  function xAtY(pts, y) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) return a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y);
    }
    return null;
  }
  // Smooth curve through points (Catmull-Rom -> polyline)
  function spline(pts, n = 8) {
    if (pts.length < 3) return pts.slice();
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 1; k <= n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push(P(
          0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)));
      }
    }
    return out;
  }
  // Offset a CLOSED polygon where every segment i (pts[i]->pts[i+1]) is pushed outward by d[i].
  // Uses miter joins with a limit (falls back to a bevel).
  function offsetPoly(pts, d) {
    const n = pts.length;
    const ccw = area(pts) > 0; // in y-down space, positive area = clockwise visually
    const lines = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const dir = norm(sub(b, a));
      // outward normal
      let nrm = ccw ? P(dir.y, -dir.x) : P(-dir.y, dir.x);
      const o = mul(nrm, d[i]);
      lines.push({ p: add(a, o), q: add(b, o), dir, nrm, d: d[i] });
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const L0 = lines[(i - 1 + n) % n], L1 = lines[i];
      const v = pts[i];
      const dd = Math.max(L0.d, L1.d);
      if (Math.abs(cross(L0.dir, L1.dir)) < 1e-6) {
        // colinear: if the offsets differ, add a step
        if (Math.abs(L0.d - L1.d) > 1e-6) { out.push(L0.q); out.push(L1.p); }
        else out.push(L1.p);
        continue;
      }
      const ip = lineIntersect(L0.p, L0.dir, L1.p, L1.dir);
      const lim = Math.max(dd * 3, 0.05);
      if (ip && dist(ip, v) <= lim + 1e-9) out.push(ip);
      else {
        // bevel
        out.push(L0.q); out.push(L1.p);
      }
    }
    return out;
  }
  // Remove small self-intersection loops that appear when offsetting tight concave curves.
  function unloop(pts, win = 40) {
    let out = pts.slice();
    let changed = true, guard = 0;
    while (changed && guard++ < 50) {
      changed = false;
      const n = out.length;
      outer: for (let i = 0; i < n; i++) {
        const a = out[i], b = out[(i + 1) % n];
        for (let k = 2; k < Math.min(win, n - 1); k++) {
          const j = (i + k) % n;
          const c = out[j], d = out[(j + 1) % n];
          const hit = segIntersect(a, b, c, d);
          if (hit) {
            // drop points i+1..j, insert intersection
            const keep = [];
            for (let m = 0; m < n; m++) {
              const rel = (m - i - 1 + n) % n;
              if (rel < k) continue; // between i+1 and j inclusive
              keep.push(out[m]);
              if (m === i) keep.push(hit.p);
            }
            out = keep; changed = true; break outer;
          }
        }
      }
    }
    return out;
  }
  return { unloop, P, add, sub, mul, len, dist, norm, lerp, perp, dot, cross, rot, deg, angle, polar, bez, qbez, arc, plen, pointAt, slice, resample, reverse, mirrorX, mirrorY, translate, rotatePts, bbox, area, centroid, lineIntersect, segIntersect, pointInPoly, clean, xAtY, spline, offsetPoly };
})();
