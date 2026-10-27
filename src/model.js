// ===================== PIECE MODEL =====================
// An Outline is a closed polygon whose segments carry an edge tag.
// Edge tags are resolved to seam allowances at render time, so one draft can be
// printed with any SA setting.
class Outline {
  constructor() { this.pts = []; this.tags = []; }
  // append a run of points; segments created get `tag`
  add(pts, tag) {
    for (const p of pts) {
      if (!this.pts.length) { this.pts.push(p); continue; }
      if (G.dist(this.pts[this.pts.length - 1], p) < 1e-6) continue;
      this.tags.push(tag); this.pts.push(p);
    }
    return this;
  }
  line(p, tag) { return this.add([p], tag); }
  last() { return this.pts[this.pts.length - 1]; }
  close(tag) {
    if (this.pts.length > 1 && G.dist(this.pts[0], this.pts[this.pts.length - 1]) < 1e-6) {
      this.pts.pop(); // segment into the removed duplicate now closes the loop
    } else this.tags.push(tag);
    return this;
  }
}

// Build an edge-run map: tag -> list of polylines (each a contiguous run)
function edgeRuns(pts, tags) {
  const n = pts.length, runs = {};
  // start at a tag change so runs don't wrap mid-way
  let s0 = 0;
  for (let i = 0; i < n; i++) if (tags[i] !== tags[(i - 1 + n) % n]) { s0 = i; break; }
  let cur = null;
  for (let k = 0; k < n; k++) {
    const i = (s0 + k) % n;
    const t = tags[i];
    if (!cur || cur.tag !== t) {
      cur = { tag: t, pts: [pts[i]] };
      (runs[t] = runs[t] || []).push(cur);
    }
    cur.pts.push(pts[(i + 1) % n]);
  }
  return runs;
}
function edgeLength(piece, tag) {
  const r = edgeRuns(piece.pts, piece.tags)[tag];
  if (!r) return 0;
  return r.reduce((s, run) => s + G.plen(run.pts), 0);
}
function edgePoly(piece, tag) {
  const r = edgeRuns(piece.pts, piece.tags)[tag];
  return r ? r[0].pts : null;
}

// Piece factory
function makePiece(o) {
  return Object.assign({
    id: 'p' + Math.random().toString(36).slice(2, 8),
    name: 'Piece', code: '',
    pts: [], tags: [],
    edges: {},            // tag -> {kind:'seam'|'hem'|'fold'|'finish'|'none', sa?:number, label?}
    cut: { fabric: 1, lining: 0, interfacing: 0, fold: false, mirrored: false, bias: false },
    grain: null,          // {a:P, b:P}
    stretch: null,        // {a,b} direction of greatest stretch
    marks: [],            // see render.js
    notes: [],
    kind: 'fabric'        // fabric | lining | interfacing | contrast | notion
  }, o);
}
function pieceFromOutline(outline, o) {
  const p = makePiece(o);
  p.pts = outline.pts; p.tags = outline.tags;
  return p;
}
// Rectangle helper: tags for top/right/bottom/left
function rectPiece(w, h, tags, o) {
  const ol = new Outline();
  ol.add([G.P(0, 0), G.P(w, 0)], tags.top || 'seam');
  ol.add([G.P(w, 0), G.P(w, h)], tags.right || 'seam');
  ol.add([G.P(w, h), G.P(0, h)], tags.bottom || 'seam');
  ol.add([G.P(0, h), G.P(0, 0)], tags.left || 'seam');
  ol.close(tags.left || 'seam');
  const pc = pieceFromOutline(ol, o);
  pc.isRect = { w, h };
  return pc;
}
function transformPiece(piece, fn) {
  piece.pts = piece.pts.map(fn);
  if (piece.grain) piece.grain = { a: fn(piece.grain.a), b: fn(piece.grain.b) };
  if (piece.stretch) piece.stretch = { a: fn(piece.stretch.a), b: fn(piece.stretch.b) };
  piece.marks = piece.marks.map(m => {
    const c = Object.assign({}, m);
    if (m.p) c.p = fn(m.p);
    if (m.pts) c.pts = m.pts.map(fn);
    if (m.a) c.a = fn(m.a);
    if (m.b) c.b = fn(m.b);
    return c;
  });
  return piece;
}
// Mirror a piece around a vertical line (used to turn half pieces into full ones)
function mirrorPieceX(piece, x0 = 0) {
  transformPiece(piece, p => G.P(2 * x0 - p.x, p.y));
  piece.pts = piece.pts.slice().reverse();
  // tags follow segments: segment i (pts[i]->pts[i+1]) becomes reversed
  const n = piece.tags.length;
  const t = piece.tags.slice();
  // after reversing points, new segment k goes from old pts[n-1-k] to old pts[n-2-k] = old segment (n-2-k)
  piece.tags = t.map((_, k) => t[(n - 2 - k + n) % n]);
  return piece;
}
