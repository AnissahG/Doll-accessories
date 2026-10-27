// ===================== APP / UI =====================
const PREFIX = 'doll-acc-studio:';
function sget(k, fb) { try { const r = localStorage.getItem(PREFIX + k); return r === null ? fb : JSON.parse(r); } catch (e) { return fb; } }
function sset(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; } catch (e) { toast('Could not save — browser storage is full or blocked.'); return false; } }
const DB = { dolls: [], saved: [], collections: [], settings: {} };
function loadDB() { DB.dolls = sget('dolls', []); DB.saved = sget('saved', []); DB.collections = sget('collections', []); DB.settings = sget('settings', {}); }
function saveDB(k) { syncTrack(k); const ok = sset(k, DB[k]); if (ok) { sset('lastChange', Date.now()); backupStatus(); } return ok; }
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const h = esc;
let toastTimer = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
const safeName = (s) => String(s || 'pattern').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 60);
function dollById(id) { return DB.dolls.find(d => d.id === id); }
function gLabel(g) { return itemLabel(g); }

// ---------- tabs ----------
function showTab(name) {
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  if (name === 'remix') renderRemix();
  if (name === 'grade') renderGrade();
  if (name === 'saved') renderSaved();
  window.scrollTo(0, 0);
}

// ===================== DOLLS =====================
let editingDollId = null;
function dollFormHTML() {
  let html = `<div class="card"><h3 id="dollFormTitle">${editingDollId ? 'Edit doll profile' : 'Add a doll profile'}</h3>
  <div class="field"><label>Doll name / label</label><input id="d_name" placeholder="e.g. Iris — MSD girl"></div>
  <div class="row2"><div class="field"><label>Size category</label><select id="d_size">${['YOSD', 'MSD', 'SD', 'Model doll (~68cm)', '70cm+', 'Tiny', 'Other'].map(s => `<option>${s}</option>`).join('')}</select></div>
  <div class="field"><label>Doll height (cm)</label><input id="d_height" type="number" step="0.1" inputmode="decimal"></div></div>
  <p class="help">All measurements in cm, taken on the doll. Only the chest is essential — anything left empty is estimated from proportions (shown in grey) and flagged on the pattern. For hats, fill in the <b>Head — hats</b> section (measured over the wig); for shoes, <b>Hands &amp; feet</b>.</p>`;
  let open = false;
  DOLL_FIELDS.forEach((fd, i) => {
    if (fd.sec) {
      if (open) html += `</div></div></details>`;
      const first = i === 0 || fd.acc;
      html += `<details class="drawer" ${first ? 'open' : ''}><summary><span>${h(fd.sec)}</span><span class="chev">▸</span></summary><div class="dbody">${fd.h ? `<p class="help" style="margin:6px 0 8px;">${h(fd.h)}</p>` : ''}<div class="row2">`;
      open = true;
      return;
    }
    html += `<div class="field"><label>${h(fd.l)}${fd.req ? ' *' : ''}${fd.h ? ` <span class="hint">(${h(fd.h)})</span>` : ''}</label><input id="dm_${fd.k}" data-k="${fd.k}" class="dm" type="number" step="0.1" inputmode="decimal"></div>`;
  });
  if (open) html += `</div></div></details>`;
  html += `<div id="dollChecks"></div>`;
  html += `<div class="btn-row"><button class="btn" id="btnSaveDoll">Save doll</button><button class="btn secondary" id="btnCancelDoll" style="display:${editingDollId ? 'inline-block' : 'none'}">Cancel edit</button></div></div>
  <h3 style="margin:16px 0 8px;">Your dolls</h3><ul class="entry-list" id="dollList"></ul>`;
  return html;
}
function renderDollsPanel() {
  $('#panel-dolls').innerHTML = dollFormHTML();
  $('#btnSaveDoll').onclick = saveDoll;
  $('#btnCancelDoll').onclick = () => { editingDollId = null; renderDollsPanel(); };
  $$('.dm').forEach(inp => inp.addEventListener('input', updateDollEstimates));
  $('#d_height').addEventListener('input', updateDollEstimates);
  if (editingDollId) fillDollForm(dollById(editingDollId));
  updateDollEstimates();
  renderDollList();
}
function readDollForm() {
  const m = {};
  $$('.dm').forEach(inp => { const v = parseFloat(inp.value); m[inp.dataset.k] = isNaN(v) ? 0 : v; });
  return { name: $('#d_name').value.trim(), size: $('#d_size').value, heightCm: parseFloat($('#d_height').value) || 0, m };
}
function updateDollEstimates() {
  const d = readDollForm();
  const { m, est } = resolveAcc(d);
  $$('.dm').forEach(inp => {
    const k = inp.dataset.k;
    if (est.has(k) && m[k] > 0 && k !== 'heelLift') { inp.placeholder = 'est. ' + fmt(m[k]); inp.classList.add('est'); }
    else { inp.placeholder = ''; inp.classList.remove('est'); }
    inp.classList.toggle('bad', (m._checks || []).some(c => c.k === k));
  });
  const box = $('#dollChecks');
  if (box) box.innerHTML = (m._checks || []).map(c => `<div class="warn">${h(c.msg)}</div>`).join('');
}
function fillDollForm(d) {
  if (!d) return;
  $('#d_name').value = d.name || ''; $('#d_size').value = d.size || 'SD'; $('#d_height').value = d.heightCm || '';
  $$('.dm').forEach(inp => { const v = d.m && d.m[inp.dataset.k]; inp.value = v ? v : ''; });
}
function saveDoll() {
  const f = readDollForm();
  if (!f.name) { toast('Give this doll a name or label.'); $('#d_name').focus(); return; }
  if (!f.m.chestCirc) { if (!confirm('No chest measurement — everything will be estimated from the height. Save anyway?')) return; }
  const doll = { id: editingDollId || uid('doll'), name: f.name, size: f.size, heightCm: f.heightCm, m: f.m };
  if (editingDollId) DB.dolls = DB.dolls.map(d => d.id === editingDollId ? doll : d); else DB.dolls.push(doll);
  saveDB('dolls');
  editingDollId = null;
  renderDollsPanel(); refreshDollSelects();
  toast('Doll saved.');
}
function renderDollList() {
  const el = $('#dollList');
  if (!DB.dolls.length) { el.innerHTML = '<li class="empty">No dolls yet — add one above, or import them from a Doll sew / Doll knit backup (buttons at the top).</li>'; return; }
  el.innerHTML = DB.dolls.map(d => {
    const filled = DOLL_FIELDS.filter(f => f.k && d.m && d.m[f.k] > 0).length;
    const total = DOLL_FIELDS.filter(f => f.k).length;
    return `<li class="entry"><div><div class="entry-name">${h(d.name)}</div>
      <div class="entry-meta">${h(d.size || '')}${d.heightCm ? ' · ' + d.heightCm + ' cm' : ''} · chest ${d.m.chestCirc || '?'} · waist ${d.m.waistCirc || '?'} · head over wig ${d.m.headCircWig || '<span style="color:var(--danger)">?</span>'} · foot ${d.m.footLength || '?'}<br>${filled}/${total} measurements filled${d.importedFrom ? ' · <span class="tag">from Doll ' + h(d.importedFrom) + '</span>' : ''}</div></div>
      <div class="btn-row" style="margin-top:0;justify-content:flex-end;">
        <button class="btn small" data-act="use" data-id="${d.id}">Use</button>
        <button class="btn small secondary" data-act="edit" data-id="${d.id}">Edit</button>
        <button class="btn small secondary" data-act="dup" data-id="${d.id}">Duplicate</button>
        <button class="btn small danger" data-act="del" data-id="${d.id}">Delete</button></div></li>`;
  }).join('');
  $$('#dollList button').forEach(b => b.onclick = () => {
    const id = b.dataset.id, d = dollById(id);
    if (b.dataset.act === 'edit') { editingDollId = id; renderDollsPanel(); window.scrollTo(0, 0); }
    if (b.dataset.act === 'dup') { const c = JSON.parse(JSON.stringify(d)); c.id = uid('doll'); c.name = d.name + ' (copy)'; delete c.importedFrom; DB.dolls.push(c); saveDB('dolls'); renderDollList(); refreshDollSelects(); }
    if (b.dataset.act === 'del') { if (!confirm('Delete "' + d.name + '"? Saved patterns keep their own copy of the measurements.')) return; DB.dolls = DB.dolls.filter(x => x.id !== id); saveDB('dolls'); renderDollList(); refreshDollSelects(); }
    if (b.dataset.act === 'use') { BUILD.opts.doll = id; renderBuilder(); showTab('builder'); }
  });
}
function refreshDollSelects() { if ($('#panel-builder').innerHTML) renderBuilder(); }

// ===================== BUILD =====================
const BUILD = { opts: null, open: new Set(['item']), result: null, editingSavedId: null, fromSaved: null };
function initBuild() {
  const last = sget('lastOptions', null);
  BUILD.opts = normalizeOptions(last || { item: 'tote' });
  if (!BUILD.opts.doll && DB.dolls[0]) BUILD.opts.doll = DB.dolls[0].id;
}
function drawerSummary(dr, o) {
  const vis = dr.fields.filter(fd => fieldVisible(fd, dr, o) && fd.type !== 'doll');
  const parts = [];
  for (const fd of vis) {
    const v = o[fd.id];
    if (fd.type === 'multi') { if (v && v.length) parts.push(v.slice(0, 3).join(', ') + (v.length > 3 ? '…' : '')); continue; }
    if (fd.type === 'check') { if (v) parts.push(fieldLabel(fd, o).toLowerCase()); continue; }
    if (v === '' || v === undefined || v === null || v === 'none') continue;
    if (fd.type === 'select') { const c = fieldChoices(fd, o).find(x => (Array.isArray(x) ? x[0] : x) === v); parts.push(Array.isArray(c) ? c[1] : v); }
    else if (fd.type === 'number') parts.push(fieldLabel(fd, o).replace(/\(.*\)/, '').trim().toLowerCase() + ' ' + v);
    else if (fd.type === 'text' && v) parts.push(v);
    if (parts.length > 3) break;
  }
  return parts.join(' · ');
}
function fieldHTML(fd, o, prefix) {
  const id = prefix + fd.id;
  const v = o[fd.id];
  const lab = fd.label ? `<label for="${id}">${h(fieldLabel(fd, o))}</label>` : '';
  const hint = fd.hint ? `<div class="hint">${h(fd.hint)}</div>` : '';
  const ro = fd.readout ? `<div class="readout" data-readout="${fd.readout}"></div>` : '';
  switch (fd.type) {
    case 'doll': {
      if (!DB.dolls.length) return `<div class="field">${lab}<div class="warn">No dolls yet — add one in the Dolls tab first (or import them from Doll sew / Doll knit).</div></div>`;
      return `<div class="field">${lab}<select id="${id}" data-f="${fd.id}">${DB.dolls.map(d => `<option value="${d.id}" ${d.id === v ? 'selected' : ''}>${h(d.name)}${d.size ? ' — ' + h(d.size) : ''}</option>`).join('')}</select></div>`;
    }
    case 'select': {
      const ch = fieldChoices(fd, o);
      return `<div class="field">${lab}<select id="${id}" data-f="${fd.id}">${ch.map(c => { const val = Array.isArray(c) ? c[0] : c, txt = Array.isArray(c) ? c[1] : c, dis = Array.isArray(c) && c[2]; return `<option value="${h(val)}" ${val === v ? 'selected' : ''} ${dis ? 'disabled' : ''}>${h(txt)}</option>`; }).join('')}</select>${hint}${ro}</div>`;
    }
    case 'number': return `<div class="field">${lab}<input id="${id}" data-f="${fd.id}" type="number" step="0.1" inputmode="decimal" placeholder="${h(fd.placeholder || '')}" value="${v === '' || v === undefined || v === null ? '' : h(v)}">${hint}</div>`;
    case 'text': return `<div class="field">${lab}<input id="${id}" data-f="${fd.id}" type="text" placeholder="${h(fd.placeholder || '')}" value="${h(v || '')}">${hint}</div>`;
    case 'check': return `<div class="field"><label style="display:flex;gap:8px;align-items:center;font-size:0.8rem;color:var(--ink);"><input id="${id}" data-f="${fd.id}" type="checkbox" style="width:auto;" ${v ? 'checked' : ''}>${h(fieldLabel(fd, o))}</label>${hint}</div>`;
    case 'multi': {
      const ch = fieldChoices(fd, o);
      return `<div class="field">${lab}<div class="chips" data-multi="${fd.id}">${ch.map(c => `<span class="chip ${(v || []).includes(c) ? 'on' : ''}" data-v="${h(c)}">${h(c)}</span>`).join('')}</div></div>`;
    }
  }
  return '';
}
// Render drawers into a container for a given options object. onChange(newOpts, fieldId)
function renderDrawers(container, o, openSet, onChange, onlyIds, prefix = 'b_') {
  let html = '';
  for (const dr of DRAWERS) {
    if (onlyIds && !onlyIds.includes(dr.id)) continue;
    if (dr.show && !dr.show(o)) continue;
    const fields = dr.fields.filter(fd => fieldVisible(fd, dr, o));
    if (!fields.length) continue;
    const isOpen = onlyIds ? true : openSet.has(dr.id);
    html += `<details class="drawer" data-drawer="${dr.id}" ${isOpen ? 'open' : ''}><summary><span>${h(dr.title)}</span><span class="sum">${h(drawerSummary(dr, o))}</span><span class="chev">▸</span></summary><div class="dbody">`;
    let row = [];
    const flush = () => { if (row.length) { html += `<div class="row2">${row.join('')}</div>`; row = []; } };
    for (const fd of fields) {
      const block = fieldHTML(fd, o, prefix);
      if (['multi', 'doll'].includes(fd.type) || fd.hint || fd.id === 'style' || fd.id === 'item' || fd.id === 'name') { flush(); html += block; }
      else { row.push(block); if (row.length === 2) flush(); }
    }
    flush();
    html += `</div></details>`;
  }
  container.innerHTML = html;
  // events
  $$('details.drawer', container).forEach(d => d.addEventListener('toggle', () => { if (d.open) openSet.add(d.dataset.drawer); else openSet.delete(d.dataset.drawer); }));
  const fire = (id, val) => onChange(id, val);
  $$('[data-f]', container).forEach(el => {
    const id = el.dataset.f;
    const evt = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'change';
    el.addEventListener(evt, () => {
      let val = el.type === 'checkbox' ? el.checked : el.value;
      if (el.type === 'number') val = el.value === '' ? '' : parseFloat(el.value);
      fire(id, val);
    });
  });
  $$('[data-multi]', container).forEach(box => $$('.chip', box).forEach(ch => ch.onclick = () => {
    const id = box.dataset.multi; const cur = (o[id] || []).slice();
    const v = ch.dataset.v; const i = cur.indexOf(v); if (i >= 0) cur.splice(i, 1); else cur.push(v);
    fire(id, cur);
  }));
}
function renderBuilder() {
  const p = $('#panel-builder');
  if (!BUILD.opts) initBuild();
  if (BUILD.opts.doll && !dollById(BUILD.opts.doll)) BUILD.opts.doll = DB.dolls[0] ? DB.dolls[0].id : '';
  if (!BUILD.opts.doll && DB.dolls[0]) BUILD.opts.doll = DB.dolls[0].id;
  if (!p.dataset.ready) {
    p.innerHTML = `<div id="buildBanner"></div><div id="buildDrawers"></div>
      <div class="btn-row" style="margin:12px 0;"><button class="btn big" id="btnGenerate">Generate pattern</button><button class="btn secondary" id="btnResetBuild">Reset</button></div>
      <div id="buildOutput"></div>`;
    p.dataset.ready = '1';
    $('#btnGenerate').onclick = generateFromBuilder;
    $('#btnResetBuild').onclick = () => { if (!confirm('Reset all options for this accessory?')) return; BUILD.opts = normalizeOptions({ item: BUILD.opts.item, doll: BUILD.opts.doll }); BUILD.editingSavedId = null; renderBuilder(); };
  }
  $('#buildBanner').innerHTML = BUILD.editingSavedId ? `<div class="note">Duplicate & tweak: you are editing a copy of <b>${h((DB.saved.find(s => s.id === BUILD.editingSavedId) || {}).label || '')}</b>. Save it as a new pattern, or tap “Update” under the result to replace the original.</div>` : '';
  renderDrawers($('#buildDrawers'), BUILD.opts, BUILD.open, (id, val) => {
    BUILD.opts = changeOption(BUILD.opts, id, val);
    sset('lastOptions', BUILD.opts);
    renderBuilder();
    if (BUILD.result) liveReadouts();
  });
  liveReadouts();
}
let readoutTimer = null;
function liveReadouts() {
  clearTimeout(readoutTimer);
  readoutTimer = setTimeout(() => {
    const d = dollById(BUILD.opts.doll);
    if (!d) return;
    try {
      const r = buildGarment(d, BUILD.opts);
      $$('[data-readout]').forEach(el => { const k = el.dataset.readout; el.textContent = r.readout[k] ? '= ' + r.readout[k] + ' on ' + d.name : ''; });
    } catch (e) { }
  }, 120);
}
function generateFromBuilder() {
  const d = dollById(BUILD.opts.doll);
  if (!d) { toast('Add a doll first (Dolls tab).'); showTab('dolls'); return; }
  const r = buildGarment(d, BUILD.opts);
  BUILD.result = { res: r, doll: d, opts: JSON.parse(JSON.stringify(BUILD.opts)) };
  // Duplicate & tweak: also offer to overwrite the pattern the copy came from
  const orig = BUILD.editingSavedId ? DB.saved.find(s => s.id === BUILD.editingSavedId) : null;
  const opt = { mode: 'build' };
  if (orig) {
    opt.extraButtons = `<button class="btn secondary" data-x="updorig">Update “${h(orig.label)}”</button>`;
    opt.wire = (el) => { const b = $('[data-x="updorig"]', el); if (b) b.onclick = () => {
      if (!confirm('Replace the saved pattern "' + orig.label + '" with this version? Its name, notes and collections are kept.')) return;
      orig.opts = JSON.parse(JSON.stringify(BUILD.result.opts)); orig.dollId = d.id; orig.dollName = d.name; orig.dollSnap = JSON.parse(JSON.stringify(d)); orig.ts = Date.now();
      saveDB('saved'); BUILD.result.savedId = orig.id; toast('"' + orig.label + '" updated.');
    }; };
  }
  renderOutput($('#buildOutput'), BUILD.result, opt);
  $('#buildOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===================== OUTPUT =====================
function patternTitle(ctx) {
  const o = ctx.opts;
  return o.name || (o.style ? o.style.replace(/^\w/, c => c.toUpperCase()) : gLabel(o.item));
}
function renderOutput(el, ctx, opt = {}) {
  const r = ctx.res, o = r.o, d = ctx.doll;
  const title = patternTitle(ctx);
  const info = { title: title + ' – ' + (d.name || '') };
  const S = r.S;
  S.brand = 'DOLLHEIMR';
  let layout = null, pagesSVG = [];
  if (r.pieces.length) {
    layout = layoutPages(r.pieces, S, info);
    pagesSVG = layout.pages.map((_, i) => renderPageSVG(layout, i, S, info));
  }
  ctx.pagesSVG = pagesSVG; ctx.info = info; ctx.title = title;
  const flat = drawFlats(r);
  ctx.flatSVG = flat;
  const mode = ctx.instrMode || 'quick';
  const saved = ctx.savedId ? DB.saved.find(s => s.id === ctx.savedId) : null;
  const edits = (saved && saved.instrEdits) || ctx.instrEdits || {};
  const stepsHTML = (m) => edits[m] ? edits[m] : r.steps.map(s => `<li>${m === 'quick' ? h(s.quick) : `<b>${h(s.quick)}</b> ${h(s.detail)}`}</li>`).join('');
  const passHTML = Object.keys(r.readout || {}).length ? `<div class="pass"><b>Sizes for ${h(d.name)}</b><br>${Object.values(r.readout).map(x => h(x)).join('<br>')}</div>` : '';
  const notionsHTML = (r.notions || []).length ? `<h4>Notions & hardware</h4><table class="pieces"><tr><th>Qty</th><th>Item</th><th>Size / note</th></tr>${r.notions.map(n => `<tr><td>${n.qty}</td><td>${h(n.label)}</td><td>${h(n.note || '')}</td></tr>`).join('')}</table>` : '';
  const est = r.info.estimated && r.info.estimated.length ? `<div class="note"><b>Estimated measurements</b> (not filled in for ${h(d.name)}): ${h(r.info.estimated.slice(0, 14).join(', '))}${r.info.estimated.length > 14 ? '…' : ''}. Add them in the Dolls tab for a closer fit.</div>` : '';
  const piecesRows = r.pieces.map(pc => `<tr><td>${h(pc.code)}</td><td>${h(pc.name)}</td><td>${h(cutLine(pc).join('; ') || '—')}${pc.cut && pc.cut.note ? '<br><span class="hint">' + h(pc.cut.note) + '</span>' : ''}${pc.cut && pc.cut.bias ? '<br><span class="hint">bias</span>' : ''}</td><td>${pc.isRect ? cm(pc.isRect.w) + ' × ' + cm(pc.isRect.h) : ''}${(pc.notes || []).length ? '<div class="hint">' + h(pc.notes.join(' ')) + '</div>' : ''}</td></tr>`).join('');
  el.innerHTML = `<div class="output">
    <div class="output-head"><h2>${h(title)}</h2><div class="sub2">${h(d.name)} · ${h(gLabel(o.item))}${o.style ? ' · ' + h(o.style) : ''} · ${S.useSA ? 'SA ' + fmt(S.sa) + ' cm, hem ' + fmt(S.hemSa) + ' cm' : 'no SA'}</div></div>
    <div class="output-body">
      ${r.warnings.map(w => `<div class="warn">${h(w)}</div>`).join('')}
      ${passHTML}${est}
      ${!r.pieces.length && (r.notions || []).length ? notionsHTML : ''}
      ${r.pieces.length ? `
      <h4>Technical flat</h4><div class="flatbox">${flat}</div>
      ${notionsHTML}
      <h4>Pieces</h4><table class="pieces"><tr><th>#</th><th>Piece</th><th>Cut</th><th>Size / notes</th></tr>${piecesRows}</table>
      <h4>Pattern pages <span class="hint" style="font-family:var(--sans)">(true scale — print at 100% · tap a page to zoom)</span></h4>
      <div class="btn-row noprint" style="margin-bottom:10px;"><button class="btn small" data-x="print">Print / save PDF</button><button class="btn small secondary" data-x="svgall">Download SVG (all pages)</button><button class="btn small secondary" data-x="pngall">Download PNG (all pages, 300 dpi)</button></div>
      <div class="pages">${pagesSVG.map((s, i) => `<div class="pagewrap"><div class="ptools"><span>Page ${i + 1} of ${pagesSVG.length}</span><span class="btn-row" style="margin:0;"><button class="btn small secondary" data-page-svg="${i}">SVG</button><button class="btn small secondary" data-page-png="${i}">PNG</button></span></div>${s}</div>`).join('')}</div>
      <h4>Cutting layout & fabric needed</h4><div id="cutBox"></div>
      <h4>Legend — what the marks mean</h4>${legendHTML()}
      ` : flat ? `<h4>Technical flat</h4><div class="flatbox">${flat}</div><div class="note">No pattern pieces to print — everything is cut from bought ribbon / strips (see Notions).</div>` : ''}
      ${r.steps.length ? `
      <h4>Construction</h4>
      <div class="btn-row noprint" style="margin-bottom:8px;"><span class="seg"><button data-im="quick" class="${mode === 'quick' ? 'on' : ''}">Quick assembly</button><button data-im="detail" class="${mode === 'detail' ? 'on' : ''}">Detailed</button></span>
        <button class="btn small secondary" data-x="editinstr">Edit instructions</button>${edits[mode] ? '<button class="btn small secondary" data-x="resetinstr">Reset to generated</button>' : ''}</div>
      <ol class="steps pattern-content" id="stepsList">${stepsHTML(mode)}</ol>
      ${r.notes.length ? `<h4>Notes</h4>${Array.from(new Set(r.notes)).map(n => `<div class="note">${h(n)}</div>`).join('')}` : ''}
      ` : ''}
      <div class="btn-row noprint" style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
        ${opt.mode !== 'saved' ? `<button class="btn" data-x="save">Save pattern</button><button class="btn secondary" data-x="savebase">Save as base (for remixing)</button>` : ''}
        ${opt.extraButtons || ''}
      </div>
    </div></div>`;
  // cutting layout (its own little control so the width can be changed without re-drafting)
  const cutBox = $('#cutBox', el);
  const drawCut = () => {
    if (!cutBox) return;
    const cl = layoutCutting(r.pieces, S, o);
    ctx.cutLayout = cl;
    const opts = [['fat quarter', 'fat quarter (50 × 55 cm)'], ['110', '110 cm'], ['140', '140 cm'], ['150', '150 cm'], ['custom', 'custom']];
    cutBox.innerHTML = `<div class="btn-row noprint" style="margin:0 0 8px;"><label class="hint" style="font-style:normal">Fabric width</label><select id="cutW" style="padding:5px;border:1px solid var(--line);">${opts.map(x => `<option value="${x[0]}" ${o.fabricWidth === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select>${o.fabricWidth === 'custom' ? `<input id="cutWcm" type="number" value="${h(o.fabricWidthCm || '')}" placeholder="cm" style="width:70px;padding:5px;border:1px solid var(--line);">` : ''}</div>` +
      `<div class="kv">${cl.groups.map(g => `<b>${h(g.label)}</b>: ${g.count} piece${g.count > 1 ? 's' : ''} → about <b>${fmt(g.len, 0)} cm</b> of ${fmt(g.W, 0)} cm wide fabric — buy <b>${g.buy} cm</b>${cl.fq && g.key === 'fabric' ? (g.len <= 55 ? ' (fits on one fat quarter)' : ' (' + Math.ceil(g.len / 55) + ' fat quarters)') : ''}${g.tooWide.length ? ' · <span style="color:var(--danger)">wider than the fabric: ' + h(Array.from(new Set(g.tooWide)).join(', ')) + '</span>' : ''}`).join('<br>')}</div>` +
      `<p class="hint">Single layer, right side up, grain parallel to the selvedge. Pieces marked ′ are the mirrored copy (flip the pattern piece over). On-fold pieces are shown opened out. Estimate includes 10% for straightening and shrinkage.</p>` +
      cl.groups.map(g => `<div class="flatbox" style="margin-bottom:8px;">${cuttingSVG(g, cl.fq)}</div>`).join('');
    const sel = $('#cutW', cutBox); if (sel) sel.onchange = () => { o.fabricWidth = sel.value; if (ctx.opts) ctx.opts.fabricWidth = sel.value; drawCut(); };
    const inp = $('#cutWcm', cutBox); if (inp) inp.onchange = () => { o.fabricWidthCm = inp.value; if (ctx.opts) ctx.opts.fabricWidthCm = inp.value; drawCut(); };
  };
  if (r.pieces.length) drawCut();
  // wire
  $$('[data-im]', el).forEach(b => b.onclick = () => { ctx.instrMode = b.dataset.im; renderOutput(el, ctx, opt); });
  $$('[data-page-svg]', el).forEach(b => b.onclick = () => { const i = +b.dataset.pageSvg; download(safeName(title) + '_page' + (i + 1) + '.svg', new Blob([xmlHead() + pagesSVG[i]], { type: 'image/svg+xml' })); });
  $$('[data-page-png]', el).forEach(b => b.onclick = () => exportPNG(pagesSVG[+b.dataset.pagePng], safeName(title) + '_page' + (+b.dataset.pagePng + 1) + '.png', layout.paper));
  const act = (k, fn) => { const b = $(`[data-x="${k}"]`, el); if (b) b.onclick = fn; };
  act('print', () => printPattern(ctx));
  act('svgall', () => download(safeName(title) + '_all_pages.svg', new Blob([xmlHead() + combinedSVG(pagesSVG, layout.paper)], { type: 'image/svg+xml' })));
  act('pngall', async () => { for (let i = 0; i < pagesSVG.length; i++) { await exportPNG(pagesSVG[i], safeName(title) + '_page' + (i + 1) + '.png', layout.paper); await new Promise(r2 => setTimeout(r2, 500)); } });
  act('editinstr', () => {
    const list = $('#stepsList', el);
    const on = list.getAttribute('contenteditable') === 'true';
    if (!on) { list.setAttribute('contenteditable', 'true'); list.focus(); $('[data-x="editinstr"]', el).textContent = 'Done editing'; }
    else {
      list.setAttribute('contenteditable', 'false');
      const m2 = ctx.instrMode || 'quick';
      ctx.instrEdits = Object.assign({}, ctx.instrEdits || {}, { [m2]: list.innerHTML });
      if (ctx.savedId) { const s = DB.saved.find(x => x.id === ctx.savedId); if (s) { s.instrEdits = Object.assign({}, s.instrEdits || {}, { [m2]: list.innerHTML }); saveDB('saved'); } }
      renderOutput(el, ctx, opt); toast('Instructions updated' + (ctx.savedId ? ' and saved.' : ' — save the pattern to keep them.'));
    }
  });
  act('resetinstr', () => { const m2 = ctx.instrMode || 'quick'; if (ctx.instrEdits) delete ctx.instrEdits[m2]; if (ctx.savedId) { const s = DB.saved.find(x => x.id === ctx.savedId); if (s && s.instrEdits) { delete s.instrEdits[m2]; saveDB('saved'); } } renderOutput(el, ctx, opt); });
  act('save', () => savePattern(ctx, false));
  act('savebase', () => savePattern(ctx, true));
  if (opt.wire) opt.wire(el);
}
function xmlHead() { return '<?xml version="1.0" encoding="UTF-8"?>\n'; }
function combinedSVG(pages, paper) {
  const H = paper.h + 6;
  const inner = pages.map((s, i) => s.replace('<svg ', `<svg x="0" y="${i * H}" `).replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${paper.w}" height="${paper.h}"`)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${paper.w}mm" height="${H * pages.length}mm" viewBox="0 0 ${paper.w} ${H * pages.length}">${svgStyleBlock()}${inner}</svg>`;
}
function legendHTML() {
  const sw = (inner) => `<svg viewBox="0 0 44 16" width="44" height="16">${inner}</svg>`;
  const items = [
    [sw('<path class="cut" d="M2,8H42" style="stroke-width:1.2"/>'), '<b>Cutting line</b> — seam allowance is already included.'],
    [sw('<path class="stitch" d="M2,8H42" style="stroke-width:1;stroke-dasharray:4 2"/>'), '<b>Stitching line</b> — sew here.'],
    [sw('<path class="foldedge" d="M2,8H42" style="stroke-width:1.6;stroke-dasharray:8 2 1.5 2"/>'), '<b>Place on fold</b> — this edge goes on the folded fabric; cut one piece that opens out double.'],
    [sw('<path class="foldline" d="M2,8H42" style="stroke-width:1;stroke-dasharray:6 2 1 2"/>'), '<b>Fold line</b> — fold here (facings, casings, pleats, cuffs, "fold back" on openings).'],
    [sw('<path class="centre" d="M2,8H42" style="stroke-width:1;stroke-dasharray:9 2 1.5 2"/>'), '<b>Centre line (CB / CF)</b> — on openings the two centre lines sit exactly on top of each other when closed.'],
    [sw('<rect x="2" y="3" width="40" height="10" fill="#FBF7EE" stroke="#2C2418" stroke-width="0.8"/><path d="M8,3V13" class="centre" style="stroke-width:0.8;stroke-dasharray:3 1"/><path d="M4,3V13" class="foldline" style="stroke-width:0.8;stroke-dasharray:3 1"/>'), '<b>Overlap / extension</b> — the strip beyond the centre line. The overlapping side laps over the underlap by this much; the snaps/buttons sit on it.'],
    [sw('<path class="grain" d="M4,8H40" style="stroke-width:0.9"/><path class="grainhead" d="M40,8L35,5L35,11Z"/><path class="grainhead" d="M4,8L9,5L9,11Z"/>'), '<b>Grain</b> — parallel to the selvedge (BIAS GRAIN = 45°).'],
    [sw('<path d="M22,2V14" class="notch" style="stroke-width:1.2"/>'), '<b>Notch</b> — match points. Single = front, double = back.'],
    [sw('<path class="dartfill" d="M4,14L22,2L40,14Z"/><path class="dart" d="M4,14L22,2L40,14" style="stroke-width:1"/>'), '<b>Dart</b> — fold the legs together and stitch to the point.'],
    [sw('<path class="gather" d="M2,8L6,5L10,8L14,5L18,8L22,5L26,8L30,5L34,8L38,5L42,8" style="stroke-width:1"/>'), '<b>Gather / ease</b> — gather (or ease) between these points.'],
    [sw('<path class="foldline" d="M12,2V14" style="stroke-width:1"/><path class="pleat" d="M30,2V14" style="stroke-width:1"/><path d="M12,6H27" stroke="#5C6A50" stroke-width="1"/><path class="pleatarrow" d="M30,6L26,4L26,8Z"/>'), '<b>Pleat / tuck</b> — bring the fold line (dash-dot) to the placement line (dashed) in the arrow\'s direction.'],
    [sw('<circle class="snapball" cx="14" cy="8" r="4"/><circle class="snapsock" cx="30" cy="8" r="4"/>'), '<b>Snap</b> — ball half on the underside of the overlap, socket half on the underlap, at the same dot.'],
    [sw('<circle class="button" cx="30" cy="8" r="4.5"/><path class="bhole" d="M4,8H18" style="stroke-width:1.5"/>'), '<b>Buttonhole & button</b> — hole on the overlap, button on the centre line of the underlap.'],
    [sw('<rect x="6" y="3" width="32" height="10" class="place" style="stroke:#5C6A50;stroke-width:1"/>'), '<b>Placement</b> — where pockets, hook & loop tape or flaps go.'],
    [sw('<circle class="eyelet" cx="22" cy="8" r="3"/>'), '<b>Eyelet</b> — lacing holes.'],
    [sw('<circle class="dot" cx="22" cy="8" r="2.5"/>'), '<b>Dot</b> — stop / start point (end of opening, zip stop, slit ends, pocket opening).'],
    [sw('<path class="cutout" d="M8,3H36V13H8Z" style="stroke-width:1"/>'), '<b>Cut-out / slit</b> — stitch around through the facing, then cut and turn.']
  ];
  return `<div class="legend">${svgStyleBlock()}${items.map(i => `<div>${i[0]}<span>${i[1]}</span></div>`).join('')}</div>`;
}
// ---- PNG export (300 dpi, with pHYs so it prints at true size) ----
function exportPNG(svg, name, paper) {
  return new Promise((resolve) => {
    const dpi = 300;
    const W = Math.round(paper.w / 25.4 * dpi), H = Math.round(paper.h / 25.4 * dpi);
    const src = svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${W}" height="${H}"`);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H);
      c.toBlob(async (blob) => {
        const buf = new Uint8Array(await blob.arrayBuffer());
        download(name, new Blob([addPngDpi(buf, dpi)], { type: 'image/png' }));
        resolve();
      }, 'image/png');
    };
    img.onerror = () => { toast('PNG export failed in this browser — use SVG or Print instead.'); resolve(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  });
}
function crc32(bytes) { let c, crc = 0xFFFFFFFF; for (let n = 0; n < bytes.length; n++) { c = (crc ^ bytes[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; }
function addPngDpi(png, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
  dv.setUint32(17, crc32(chunk.slice(4, 17)));
  // insert after IHDR (8 byte signature + 25 byte IHDR chunk)
  const out = new Uint8Array(png.length + 21);
  out.set(png.slice(0, 33), 0); out.set(chunk, 33); out.set(png.slice(33), 54);
  return out;
}
// ---- print / PDF ----
function printPattern(ctx) {
  const r = ctx.res, o = r.o;
  const mode = ctx.instrMode || 'quick';
  const saved = ctx.savedId ? DB.saved.find(s => s.id === ctx.savedId) : null;
  const edits = (saved && saved.instrEdits) || ctx.instrEdits || {};
  const steps = edits[mode] || r.steps.map(s => `<li>${mode === 'quick' ? h(s.quick) : `<b>${h(s.quick)}</b> ${h(s.detail)}`}</li>`).join('');
  const paper = r.S.paper === 'Letter' ? 'letter' : 'A4';
  const css = `@page{size:${paper};margin:0}body{margin:0;font-family:Inter,Helvetica,Arial,sans-serif;color:#2C2418}
  .sheet{page-break-after:always;padding:12mm;box-sizing:border-box}.pg{page-break-after:always;width:${r.S.paper === 'Letter' ? '215.9mm' : '210mm'};height:${r.S.paper === 'Letter' ? '279.4mm' : '297mm'};overflow:hidden}
  .pg svg{display:block}h1{font-family:Georgia,serif;margin:0 0 4px;font-size:20pt}h2{font-family:Georgia,serif;color:#7B2D3A;font-size:13pt;border-bottom:1px solid #C7B999;padding-bottom:3px;margin:14px 0 6px}
  table{border-collapse:collapse;width:100%;font-size:8.5pt}td,th{border:1px solid #C7B999;padding:3px 5px;text-align:left;vertical-align:top}ol{font-size:9pt;line-height:1.45;padding-left:18px}li{margin-bottom:3px}
  .legend{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:8pt}.legend div{display:flex;gap:6px;align-items:center}.note{font-size:8.5pt;border-left:3px solid #A9782E;padding:3px 8px;margin:4px 0}.warn{font-size:8.5pt;color:#8C3B2E;border-left:3px solid #8C3B2E;padding:3px 8px;margin:4px 0}.flat svg{width:100%;height:auto;max-height:95mm}.cut svg{width:100%;height:auto;max-height:110mm;margin-top:4px}`;
  const pieces = r.pieces.map(pc => `<tr><td>${h(pc.code)}</td><td>${h(pc.name)}</td><td>${h(cutLine(pc).join('; '))}</td><td>${pc.isRect ? cm(pc.isRect.w) + ' × ' + cm(pc.isRect.h) : ''}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${h(ctx.title)}</title><style>${css}</style></head><body>
  <div class="sheet"><h1>${h(ctx.title)}</h1><div style="font-size:9pt;color:#6b6152">DOLLHEIMR · ${h(ctx.doll.name)} · ${h(gLabel(o.item))}${o.style ? ' · ' + h(o.style) : ''} · ${r.S.useSA ? 'seam allowance ' + fmt(r.S.sa) + ' cm, hem ' + fmt(r.S.hemSa) + ' cm included' : 'no seam allowance'}</div>
  ${r.warnings.map(x => `<div class="warn">${h(x)}</div>`).join('')}
  <div class="flat">${ctx.flatSVG}</div>${Object.keys(r.readout || {}).length ? '<h2>Sizes</h2><div style="font-size:9pt">' + Object.values(r.readout).map(x => h(x)).join('<br>') + '</div>' : ''}${(r.notions || []).length ? '<h2>Notions & hardware</h2><table><tr><th>Qty</th><th>Item</th><th>Size / note</th></tr>' + r.notions.map(n => `<tr><td>${n.qty}</td><td>${h(n.label)}</td><td>${h(n.note || '')}</td></tr>`).join('') + '</table>' : ''}<h2>Pieces</h2><table><tr><th>#</th><th>Piece</th><th>Cut</th><th>Size</th></tr>${pieces}</table>${ctx.cutLayout ? `<h2>Cutting layout</h2><div style="font-size:8.5pt">${ctx.cutLayout.groups.map(g => `<b>${h(g.label)}</b>: ${fmt(g.len, 0)} cm of ${fmt(g.W, 0)} cm wide — buy ${g.buy} cm`).join(' · ')}</div>${ctx.cutLayout.groups.map(g => `<div class="cut">${cuttingSVG(g, ctx.cutLayout.fq)}</div>`).join('')}` : ''}
  <h2>Legend</h2>${legendHTML()}
  <h2>Construction — ${mode === 'quick' ? 'quick assembly' : 'detailed'}</h2><ol>${steps}</ol>
  ${r.notes.length ? '<h2>Notes</h2>' + Array.from(new Set(r.notes)).map(n => `<div class="note">${h(n)}</div>`).join('') : ''}
  <p style="font-size:8pt;color:#6b6152">Print the pattern pages at 100% ("actual size", no scaling) and check the 5 × 5 cm test square.</p></div>
  ${ctx.pagesSVG.map(s => `<div class="pg">${s}</div>`).join('')}
  <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script></body></html>`;
  printHTML(html, ctx.title);
}

// ===================== SAVE =====================
function savePattern(ctx, asBase) {
  const def = ctx.title || patternTitle(ctx);
  const label = prompt(asBase ? 'Name this base (e.g. "SD cropped jacket block"):' : 'Name this pattern:', def + (asBase ? ' — base' : ''));
  if (label === null) return;
  const entry = {
    id: uid('pat'), label: label || def, ts: Date.now(), dollId: ctx.doll.id, dollName: ctx.doll.name,
    dollSnap: JSON.parse(JSON.stringify(ctx.doll)), opts: JSON.parse(JSON.stringify(ctx.opts)),
    notes: '', sewn: false, base: !!asBase, parentId: ctx.parentId || null, gradedFrom: ctx.gradedFrom || null,
    instrEdits: ctx.instrEdits || {}, collectionIds: []
  };
  DB.saved.unshift(entry);
  saveDB('saved');
  ctx.savedId = entry.id;
  toast(asBase ? 'Saved as a base — find it in Remix.' : 'Pattern saved.');
}

// ===================== SAVED =====================
const SAVED = { q: '', tag: '', col: '', expanded: null, panel: null, viewId: null, ctx: null };
function renderSaved() {
  const p = $('#panel-saved');
  const tags = Array.from(new Set(DB.saved.flatMap(s => [].concat(s.opts.styleTags || [], s.opts.season || [], s.opts.occasion || []))));
  p.innerHTML = `<div class="card"><h3>Collections</h3><div class="btn-row" style="margin-top:0;"><button class="btn small secondary" id="btnNewCol">+ New collection</button></div><ul class="entry-list" id="colList" style="margin-top:8px;"></ul></div>
    <div class="card"><div class="row3"><div class="field"><label>Search</label><input id="savedSearch" value="${h(SAVED.q)}" placeholder="name, accessory, doll…"></div>
    <div class="field"><label>Tag</label><select id="savedTag"><option value="">all</option>${tags.map(t => `<option ${t === SAVED.tag ? 'selected' : ''}>${h(t)}</option>`).join('')}</select></div>
    <div class="field"><label>Collection</label><select id="savedCol"><option value="">all</option>${DB.collections.map(c => `<option value="${c.id}" ${c.id === SAVED.col ? 'selected' : ''}>${h(c.name)}</option>`).join('')}</select></div></div></div>
    <ul class="entry-list" id="savedList"></ul><div id="savedView"></div>`;
  $('#savedSearch').oninput = (e) => { SAVED.q = e.target.value; renderSavedList(); };
  $('#savedTag').onchange = (e) => { SAVED.tag = e.target.value; renderSavedList(); };
  $('#savedCol').onchange = (e) => { SAVED.col = e.target.value; renderSavedList(); };
  $('#btnNewCol').onclick = () => { const n = prompt('Collection name:'); if (!n) return; DB.collections.push({ id: uid('col'), name: n }); saveDB('collections'); renderSaved(); };
  renderCollections();
  renderSavedList();
  if (SAVED.viewId) viewSaved(SAVED.viewId, true);
}
function renderCollections() {
  const el = $('#colList');
  if (!DB.collections.length) { el.innerHTML = '<li class="empty">No collections yet — group related patterns (e.g. a themed drop).</li>'; return; }
  el.innerHTML = DB.collections.map(c => { const n = DB.saved.filter(s => (s.collectionIds || []).includes(c.id)).length; return `<li class="entry"><div><div class="entry-name">${h(c.name)}</div><div class="entry-meta">${n} pattern${n === 1 ? '' : 's'}</div></div><div class="btn-row" style="margin:0;"><button class="btn small secondary" data-colrename="${c.id}">Rename</button><button class="btn small danger" data-coldel="${c.id}">Delete</button></div></li>`; }).join('');
  $$('[data-coldel]').forEach(b => b.onclick = () => { if (!confirm('Delete this collection? The patterns stay.')) return; const id = b.dataset.coldel; DB.collections = DB.collections.filter(c => c.id !== id); DB.saved.forEach(s => s.collectionIds = (s.collectionIds || []).filter(x => x !== id)); saveDB('collections'); saveDB('saved'); renderSaved(); });
  $$('[data-colrename]').forEach(b => b.onclick = () => { const c = DB.collections.find(x => x.id === b.dataset.colrename); const n = prompt('Rename collection:', c.name); if (!n) return; c.name = n; saveDB('collections'); renderSaved(); });
}
function savedMatches(s) {
  const q = SAVED.q.trim().toLowerCase();
  if (q && !(s.label + ' ' + s.dollName + ' ' + gLabel(s.opts.item) + ' ' + (s.opts.style || '')).toLowerCase().includes(q)) return false;
  if (SAVED.tag && ![].concat(s.opts.styleTags || [], s.opts.season || [], s.opts.occasion || []).includes(SAVED.tag)) return false;
  if (SAVED.col && !(s.collectionIds || []).includes(SAVED.col)) return false;
  return true;
}
function renderSavedList() {
  const el = $('#savedList');
  if (!DB.saved.length) { el.innerHTML = '<li class="empty">No saved patterns yet — generate one in Build, then tap Save.</li>'; return; }
  const list = DB.saved.filter(savedMatches);
  if (!list.length) { el.innerHTML = '<li class="empty">No saved patterns match.</li>'; return; }
  el.innerHTML = list.map(s => {
    const tags = [].concat(s.opts.styleTags || [], s.opts.season || [], s.opts.occasion || []);
    const parent = s.parentId ? DB.saved.find(x => x.id === s.parentId) : null;
    const panel = SAVED.expanded === s.id ? (SAVED.panel === 'notes' ? `<div class="adjust-panel"><div class="field"><label>Notes</label><textarea id="notes-${s.id}">${h(s.notes || '')}</textarea></div><button class="btn small secondary" data-savenotes="${s.id}">Save notes</button></div>` : SAVED.panel === 'rename' ? `<div class="adjust-panel"><div class="field"><label>Rename</label><input id="rename-${s.id}" value="${h(s.label)}"></div><button class="btn small secondary" data-saverename="${s.id}">Save name</button></div>` : '') : '';
    return `<li class="entry col"><div><div class="entry-name">${s.base ? '<span class="tag wine">Base</span>' : ''}${s.sewn ? '<span class="tag sage">Sewn</span>' : ''}${s.gradedFrom ? '<span class="tag mustard">Graded</span>' : ''}${h(s.label)}</div>
      <div class="entry-meta">${h(gLabel(s.opts.item))}${s.opts.style ? ' · ' + h(s.opts.style) : ''} · ${h(s.dollName || '')} · ${new Date(s.ts).toLocaleDateString()}${parent ? ' · remix of ' + h(parent.label) : ''}${s.notes ? ' · ' + h(s.notes.length > 60 ? s.notes.slice(0, 60) + '…' : s.notes) : ''}</div>
      ${tags.length ? `<div style="margin-top:4px;">${tags.map(t => `<span class="tag">${h(t)}</span>`).join('')}</div>` : ''}</div>
      <div class="btn-row">
        <button class="btn small" data-sv="view" data-id="${s.id}">View</button>
        <button class="btn small secondary" data-sv="dup" data-id="${s.id}">Duplicate & tweak</button>
        <button class="btn small secondary" data-sv="remix" data-id="${s.id}">Remix</button>
        <button class="btn small secondary" data-sv="grade" data-id="${s.id}">Grade</button>
        <button class="btn small secondary" data-sv="rename" data-id="${s.id}">Rename</button>
        <button class="btn small secondary" data-sv="notes" data-id="${s.id}">Notes</button>
        <button class="btn small secondary" data-sv="sewn" data-id="${s.id}">${s.sewn ? 'Mark not sewn' : 'Mark as sewn'}</button>
        <button class="btn small secondary" data-sv="base" data-id="${s.id}">${s.base ? 'Unmark base' : 'Make base'}</button>
        <select class="btn small secondary" style="padding:5px 8px;font-size:0.75rem;" data-colsel="${s.id}"><option value="">Collection…</option>${DB.collections.map(c => `<option value="${c.id}">${(s.collectionIds || []).includes(c.id) ? '✓ ' : ''}${h(c.name)}</option>`).join('')}<option value="__new__">+ New collection</option></select>
        <button class="btn small danger" data-sv="del" data-id="${s.id}">Delete</button>
      </div>${panel}</li>`;
  }).join('');
  $$('[data-sv]').forEach(b => b.onclick = () => savedAction(b.dataset.sv, b.dataset.id));
  $$('[data-colsel]').forEach(sel => sel.onchange = () => {
    const s = DB.saved.find(x => x.id === sel.dataset.colsel); let v = sel.value; if (!v) return;
    if (v === '__new__') { const n = prompt('New collection name:'); if (!n) { sel.value = ''; return; } const c = { id: uid('col'), name: n }; DB.collections.push(c); saveDB('collections'); v = c.id; }
    s.collectionIds = s.collectionIds || [];
    if (s.collectionIds.includes(v)) s.collectionIds = s.collectionIds.filter(x => x !== v); else s.collectionIds.push(v);
    saveDB('saved'); renderSaved();
  });
  $$('[data-savenotes]').forEach(b => b.onclick = () => { const s = DB.saved.find(x => x.id === b.dataset.savenotes); s.notes = $('#notes-' + s.id).value; saveDB('saved'); SAVED.expanded = null; renderSavedList(); });
  $$('[data-saverename]').forEach(b => b.onclick = () => { const s = DB.saved.find(x => x.id === b.dataset.saverename); s.label = $('#rename-' + s.id).value || s.label; saveDB('saved'); SAVED.expanded = null; renderSavedList(); });
}
function savedDoll(s) { return dollById(s.dollId) || s.dollSnap; }
function savedAction(act, id) {
  const s = DB.saved.find(x => x.id === id); if (!s) return;
  if (act === 'view') { SAVED.viewId = id; viewSaved(id); }
  if (act === 'dup') { BUILD.opts = normalizeOptions(JSON.parse(JSON.stringify(s.opts))); if (dollById(s.dollId)) BUILD.opts.doll = s.dollId; BUILD.editingSavedId = id; BUILD.result = null; $('#buildOutput') && ($('#buildOutput').innerHTML = ''); renderBuilder(); showTab('builder'); }
  if (act === 'remix') { REMIX.baseId = id; showTab('remix'); }
  if (act === 'grade') { GRADE.srcId = id; showTab('grade'); }
  if (act === 'rename' || act === 'notes') { SAVED.expanded = SAVED.expanded === id && SAVED.panel === act ? null : id; SAVED.panel = act; renderSavedList(); }
  if (act === 'sewn') { s.sewn = !s.sewn; saveDB('saved'); renderSavedList(); }
  if (act === 'base') { s.base = !s.base; saveDB('saved'); renderSavedList(); }
  if (act === 'del') { if (!confirm('Delete "' + s.label + '"?')) return; DB.saved = DB.saved.filter(x => x.id !== id); saveDB('saved'); if (SAVED.viewId === id) SAVED.viewId = null; renderSaved(); }
}
function viewSaved(id, noScroll) {
  const s = DB.saved.find(x => x.id === id); if (!s) return;
  const d = savedDoll(s);
  if (!d) { toast('The doll for this pattern is missing.'); return; }
  const res = buildGarment(d, s.opts);
  const ctx = { res, doll: d, opts: s.opts, savedId: s.id, title: s.label };
  ctx.opts = Object.assign({}, s.opts, { name: s.opts.name || s.label });
  renderOutput($('#savedView'), ctx, { mode: 'saved', extraButtons: `<button class="btn secondary" data-x="closeview">Close</button>` , wire: (el) => { const b = $('[data-x="closeview"]', el); if (b) b.onclick = () => { SAVED.viewId = null; $('#savedView').innerHTML = ''; }; } });
  if (!noScroll) $('#savedView').scrollIntoView({ behavior: 'smooth' });
}

// ===================== REMIX =====================
const REMIX = { baseId: null, opts: null, action: null, ctx: null };
const REMIX_ACTIONS = [
  ['bagsize', 'Change size & shape', ['bagsize']], ['bagbody', 'Change body & pockets', ['bagbody']], ['bagtop', 'Change opening, flap & closure', ['bagtop']],
  ['baghandles', 'Change handles & straps', ['baghandles']], ['bagmat', 'Change lining & structure', ['bagmat']],
  ['hatfit', 'Change fit & crown', ['hatfit']], ['hatbrim', 'Change brim & visor', ['hatbrim']], ['hatdetails', 'Change details', ['hatdetails']], ['hatmat', 'Change lining & stiffness', ['hatmat']],
  ['beltfit', 'Change position & fit', ['beltfit']], ['beltmake', 'Change construction & hardware', ['beltmake']],
  ['neckopts', 'Change style & fit', ['neckopts']], ['hairopts', 'Change style & size', ['hairopts']], ['stylopts', 'Change style', ['stylopts']], ['shoeopts', 'Change the shoe', ['shoeopts']],
  ['finish', 'Change seam allowance', ['finish']]
];
function renderRemix() {
  const p = $('#panel-remix');
  const bases = DB.saved.filter(s => s.base);
  const others = DB.saved.filter(s => !s.base);
  const base = REMIX.baseId ? DB.saved.find(s => s.id === REMIX.baseId) : null;
  let html = `<div class="card"><h3>Remix a design</h3><p class="help">Make the perfect accessory once, save it as a base, then remix it: change one component (flap, handles, brim, closure…) and everything else stays exactly as it was.</p>
    <div class="field"><label>Base pattern</label><select id="remixBase"><option value="">— choose —</option>${bases.length ? `<optgroup label="Bases">${bases.map(s => `<option value="${s.id}" ${s.id === REMIX.baseId ? 'selected' : ''}>${h(s.label)}</option>`).join('')}</optgroup>` : ''}${others.length ? `<optgroup label="Other saved patterns">${others.map(s => `<option value="${s.id}" ${s.id === REMIX.baseId ? 'selected' : ''}>${h(s.label)}</option>`).join('')}</optgroup>` : ''}</select></div>
    ${!DB.saved.length ? '<div class="empty">No saved patterns yet. Generate one in Build Pattern and tap "Save as base".</div>' : ''}</div>`;
  if (base) {
    if (!REMIX.opts || REMIX.optsFor !== base.id) { REMIX.opts = normalizeOptions(JSON.parse(JSON.stringify(base.opts))); REMIX.optsFor = base.id; REMIX.changes = []; }
    const children = DB.saved.filter(s => s.parentId === base.id);
    const acts = REMIX_ACTIONS.filter(a => a[2].some(did => { const dr = DRAWERS.find(x => x.id === did); return dr && (!dr.show || dr.show(REMIX.opts)) && dr.fields.some(fd => fieldVisible(fd, dr, REMIX.opts)); }));
    html += `<div class="card"><h3>${h(base.label)}</h3><div class="entry-meta">${h(gLabel(base.opts.item))} · ${h(base.dollName || '')}</div>
      <div class="btn-row" style="margin-top:10px;">${acts.map(a => `<button class="btn small ${REMIX.action === a[0] ? '' : 'secondary'}" data-ra="${a[0]}">${h(a[1])}</button>`).join('')}</div>
      ${REMIX.changes && REMIX.changes.length ? `<div class="note" style="margin-top:10px;">Changes so far: ${h(REMIX.changes.join(' · '))}</div>` : ''}
      <div id="remixDrawers" style="margin-top:10px;"></div>
      <div class="btn-row"><button class="btn" id="btnRemixGo">Preview remix</button><button class="btn secondary" id="btnRemixReset">Start over from base</button></div>
      ${children.length ? `<div class="section-label">Remixes of this base</div><ul class="entry-list">${children.map(c => `<li class="entry"><div><div class="entry-name">${h(c.label)}</div><div class="entry-meta">${new Date(c.ts).toLocaleDateString()}</div></div><button class="btn small secondary" data-rview="${c.id}">View</button></li>`).join('')}</ul>` : ''}
    </div><div id="remixOut"></div>`;
  }
  p.innerHTML = html;
  $('#remixBase').onchange = (e) => { REMIX.baseId = e.target.value || null; REMIX.action = null; REMIX.opts = null; renderRemix(); };
  if (!base) return;
  $$('[data-ra]').forEach(b => b.onclick = () => { REMIX.action = b.dataset.ra; renderRemix(); });
  $$('[data-rview]').forEach(b => b.onclick = () => { SAVED.viewId = b.dataset.rview; showTab('saved'); });
  if (REMIX.action) {
    const a = REMIX_ACTIONS.find(x => x[0] === REMIX.action);
    renderDrawers($('#remixDrawers'), REMIX.opts, new Set(), (id, val) => {
      const before = REMIX.opts[id];
      REMIX.opts = changeOption(REMIX.opts, id, val);
      const lbl = (DRAWERS.flatMap(d => d.fields).find(f => f.id === id) || {}).label || id;
      if (typeof val !== 'object') REMIX.changes = (REMIX.changes || []).filter(c => !c.startsWith(lbl.split('(')[0].trim() + ' →')).concat([lbl.split('(')[0].trim() + ' → ' + val]);
      else REMIX.changes = (REMIX.changes || []).filter(c => !c.startsWith(id)).concat([id + ' updated']);
      renderRemix();
    }, a[2], 'r_');
  }
  $('#btnRemixGo').onclick = () => {
    const d = savedDoll(base);
    const opts = JSON.parse(JSON.stringify(REMIX.opts));
    opts.name = (base.opts.name || base.label.replace(/ — base$/, '')) + ' — remix';
    const res = buildGarment(d, opts);
    REMIX.ctx = { res, doll: d, opts, parentId: base.id };
    renderOutput($('#remixOut'), REMIX.ctx, { mode: 'remix' });
    $('#remixOut').scrollIntoView({ behavior: 'smooth' });
  };
  $('#btnRemixReset').onclick = () => { REMIX.opts = null; REMIX.action = null; renderRemix(); };
}

// ===================== GRADE =====================
// Re-draft a saved accessory for another doll. Automatic sizes always follow the new doll; the
// mode decides what happens to sizes you typed in cm.
const GRADE = { srcId: null, targetId: null, mode: 'proportional', ctx: null };
const GRADE_NUMERIC = ['bagW', 'bagH', 'bagD', 'taperCm', 'cornerCm', 'frameW', 'frameH', 'strapW', 'strapLen', 'hatEase', 'crownH', 'brimW', 'visorD', 'beltW', 'beltTail', 'corsetH', 'chokerW', 'bowW', 'ribbonMm', 'sashW', 'shoeEase'];
function gradeRatio(cat, a, b) {
  if (cat === 'hat' || cat === 'hair') return b.headCircWig / a.headCircWig;
  if (cat === 'shoe') return b.footLength / a.footLength;
  if (cat === 'neck') return b.neckCirc / a.neckCirc;
  if (cat === 'belt' || cat === 'styling') return b.waistCirc / a.waistCirc;
  return b.k / a.k;
}
function gradeOptions(src, srcDoll, tgtDoll, mode) {
  const o = JSON.parse(JSON.stringify(src.opts));
  const a = resolveAcc(srcDoll).m, b = resolveAcc(tgtDoll).m;
  const r = gradeRatio(itemCat(o.item), a, b);
  const changed = [];
  GRADE_NUMERIC.forEach(k => {
    const v = +o[k];
    if (!(v > 0)) return;
    if (mode === 'proportional') { o[k] = Math.round(v * r * 100) / 100; changed.push(k); }
    else if (mode === 'fit') { o[k] = ''; changed.push(k); }
  });
  if (o.hwSize !== 'auto' && mode !== 'exact') o.hwSize = 'auto';
  return { o, r, changed };
}
function renderGrade() {
  const p = $('#panel-grade');
  const srcs = DB.saved;
  const src = GRADE.srcId ? DB.saved.find(s => s.id === GRADE.srcId) : null;
  if (!GRADE.targetId && DB.dolls[0]) GRADE.targetId = DB.dolls[0].id;
  if (!srcs.length) { p.innerHTML = `<div class="card"><h3>Grade a pattern</h3><div class="empty">Save a pattern first (Build → Save pattern).</div></div>`; return; }
  p.innerHTML = `<div class="card"><h3>Grade an accessory to another doll</h3><p class="help">Takes a saved accessory (e.g. your MSD bag) and re-drafts it for another doll. Everything set to "auto" follows the new doll automatically; the mode decides what happens to the sizes you typed in.</p>
    <div class="field"><label>Pattern</label><select id="gSrc"><option value="">— choose a saved pattern —</option>${srcs.map(s => `<option value="${s.id}" ${s.id === GRADE.srcId ? 'selected' : ''}>${h(s.label)} (${h(s.dollName || '')})</option>`).join('')}</select></div>
    <div class="field"><label>Grade for doll</label><select id="gTgt">${DB.dolls.map(d => `<option value="${d.id}" ${d.id === GRADE.targetId ? 'selected' : ''}>${h(d.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Your typed-in sizes</label><div class="seg" id="gMode">
      <button data-gm="proportional" class="${GRADE.mode === 'proportional' ? 'on' : ''}">Scale them</button><button data-gm="fit" class="${GRADE.mode === 'fit' ? 'on' : ''}">Back to auto</button><button data-gm="exact" class="${GRADE.mode === 'exact' ? 'on' : ''}">Keep in cm</button></div>
      <div class="hint" style="margin-top:6px;">${{ proportional: 'Scale: custom sizes grow or shrink with the doll (head size for hats and hair, foot for shoes, neck for neckwear, waist for belts, body scale for bags), so it looks the same on the new doll.', fit: 'Back to auto: custom sizes are cleared and the app picks sizes that suit the new doll.', exact: 'Keep in cm: a 6 cm bag stays 6 cm — only body-fitted parts (straps, head bands, belts) follow the new doll.' }[GRADE.mode]}</div></div>
    <div class="btn-row"><button class="btn" id="btnGrade" ${!src || !DB.dolls.length ? 'disabled' : ''}>Grade</button></div></div>
    <div id="gradeWarn"></div><div id="gradeOut"></div>`;
  $('#gSrc').onchange = (e) => { GRADE.srcId = e.target.value; renderGrade(); };
  $('#gTgt').onchange = (e) => { GRADE.targetId = e.target.value; };
  $$('[data-gm]').forEach(b => b.onclick = () => { GRADE.mode = b.dataset.gm; renderGrade(); });
  $('#btnGrade').onclick = () => doGrade();
}
function doGrade() {
  const src = DB.saved.find(s => s.id === GRADE.srcId);
  const tgt = dollById(GRADE.targetId);
  if (!src || !tgt) return;
  const g = gradeOptions(src, savedDoll(src), tgt, GRADE.mode);
  const opts = g.o;
  opts.name = (src.opts.name || src.label) + ' — ' + tgt.name;
  opts.doll = tgt.id;
  const res = buildGarment(tgt, opts);
  $('#gradeWarn').innerHTML = `<div class="note">Size ratio ${fmt(g.r, 2)}× · ${g.changed.length ? (GRADE.mode === 'proportional' ? 'scaled: ' : 'reset to auto: ') + h(g.changed.join(', ')) : 'no typed-in sizes — everything follows the new doll'}.</div>`;
  GRADE.ctx = { res, doll: tgt, opts, gradedFrom: src.id, parentId: src.parentId || null };
  renderOutput($('#gradeOut'), GRADE.ctx, { mode: 'grade' });
}

// ===================== BACKUP / RESTORE / IMPORT DOLLS =====================
function backupAll() {
  const payload = { app: 'doll-acc-studio', version: 1, exportedAt: new Date().toISOString(), dolls: DB.dolls, saved: DB.saved, collections: DB.collections, settings: DB.settings, lastOptions: sget('lastOptions', null) };
  download('doll-accessories-backup-' + new Date().toISOString().slice(0, 10) + '.json', new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })).then(ok => {
    if (!ok) return;
    sset('lastBackup', Date.now()); backupStatus();
    toast(DB.dolls.length || DB.saved.length ? 'Backup downloaded.' : 'Backup downloaded — but the app is empty, so it contains no dolls or patterns.');
  });
}
// Dolls from a Doll sew, Doll knit (or another Doll accessories) backup: same measurement keys.
// Existing dolls (same id or name) are updated; measurements only stored here are kept.
function importDolls(data, from) {
  const list = Array.isArray(data) ? data : (data.dolls || []);
  let added = 0, updated = 0;
  list.forEach(kd => {
    if (!kd || !kd.m) return;
    const existing = DB.dolls.find(d => d.id === kd.id) || DB.dolls.find(d => d.name === kd.name);
    const m = {};
    DOLL_FIELDS.forEach(f => { if (f.k && kd.m[f.k] > 0) m[f.k] = +kd.m[f.k]; });
    if (existing) { existing.m = Object.assign({}, existing.m, m); existing.size = kd.size || existing.size; existing.heightCm = kd.heightCm || existing.heightCm; existing.importedFrom = from; updated++; }
    else { DB.dolls.push({ id: kd.id || uid('doll'), name: kd.name || 'Imported doll', size: kd.size || 'Other', heightCm: kd.heightCm || 0, m, importedFrom: from }); added++; }
  });
  saveDB('dolls');
  renderDollsPanel(); if (BUILD.opts && !BUILD.opts.doll && DB.dolls[0]) BUILD.opts.doll = DB.dolls[0].id; refreshDollSelects();
  return { added, updated };
}
const OTHER_APPS = { 'doll-sew-studio': 'sew', 'bjd-pattern-studio': 'knit' };
async function readJSONFile(file) { const t = await file.text(); return JSON.parse(t); }
async function restoreFromFile(file) {
  if (!file) return;
  let data;
  try { data = await readJSONFile(file); } catch (e) { alert('Could not read that file — make sure it is a backup (.json) from Doll accessories, Doll sew or Doll knit.'); return; }
  if (data && OTHER_APPS[data.app]) {
    const from = OTHER_APPS[data.app], n = (data.dolls || []).length;
    if (!confirm('This is a Doll ' + from + ' backup. Import its ' + n + ' doll(s) here? Dolls with the same name are updated; your accessory patterns are not touched.')) return;
    const r = importDolls(data, from);
    alert('Imported from Doll ' + from + ': ' + r.added + ' new doll(s), ' + r.updated + ' updated. Add the head (over the wig) and feet measurements in the Dolls tab for hats and shoes.');
    return;
  }
  if (!data || data.app !== 'doll-acc-studio') { alert('This doesn\'t look like a Doll accessories, Doll sew or Doll knit backup file.'); return; }
  if ((DB.dolls.length || DB.saved.length) && !confirm('Replace everything in the app (dolls, saved patterns, collections) with this backup?')) return;
  DB.dolls = data.dolls || []; DB.saved = data.saved || []; DB.collections = data.collections || []; DB.settings = data.settings || {};
  saveDB('dolls'); saveDB('saved'); saveDB('collections'); saveDB('settings');
  if (data.lastOptions) sset('lastOptions', data.lastOptions);
  BUILD.opts = null; initBuild(); $('#panel-builder').dataset.ready = ''; $('#panel-builder').innerHTML = '';
  renderDollsPanel(); renderBuilder(); renderSaved();
  sset('lastBackup', Date.now() + 1); backupStatus(); // what is in the app now is exactly that backup
  alert('Restored: ' + DB.dolls.length + ' doll(s), ' + DB.saved.length + ' saved pattern(s), ' + DB.collections.length + ' collection(s).');
}
async function importKnitFromFile(file) {
  if (!file) return;
  let data;
  try { data = await readJSONFile(file); } catch (e) { alert('Could not read that file.'); return; }
  const from = data && OTHER_APPS[data.app] ? OTHER_APPS[data.app] : data && data.app === 'doll-acc-studio' ? 'accessories' : null;
  if (!(from || Array.isArray(data && data.dolls) || Array.isArray(data))) { alert('No dolls found in that file. Choose a backup downloaded from Doll sew or Doll knit ("Backup all data").'); return; }
  const r = importDolls(data, from || 'sew');
  alert('Imported: ' + r.added + ' new doll(s), ' + r.updated + ' updated. Add the head (over the wig), hand and feet measurements in the Dolls tab for hats, bag handles and shoes.');
}

// ===================== DATA SAFETY =====================
// Everything lives in this browser's storage, so nudge for a backup whenever something changed since the last one.
function backupStatus() {
  const el = $('#backupNote'); if (!el) return;
  const has = DB.dolls.length || DB.saved.length;
  const last = sget('lastBackup', 0), chg = sget('lastChange', 0);
  if (!has || (last && chg <= last)) { el.className = 'help'; el.textContent = has && last ? 'Last backup: ' + new Date(last).toLocaleDateString() + ' ✓' : ''; return; }
  el.className = 'backup-warn';
  el.innerHTML = (last ? 'You have changes since your last backup (' + h(new Date(last).toLocaleDateString()) + ').' : 'You have not downloaded a backup yet.') + ' Tap <b>⬇ Backup all data</b>: clearing browser data, reinstalling the app or changing phone wipes everything.';
}
function askPersistentStorage() {
  // installed apps usually get this automatically; it stops the browser evicting the data when space runs low
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch (e) { }
}

// ===================== PAGE VIEWER (tap a pattern page to zoom) =====================
let pvZoom = 2.5;
function openPageViewer(svgEl) {
  closePageViewer(true);
  const ov = document.createElement('div'); ov.className = 'pv'; ov.id = 'pageViewer';
  ov.innerHTML = `<div class="pv-bar"><button class="btn small secondary" data-pv="out" aria-label="Zoom out">−</button><span class="pv-z"></span><button class="btn small secondary" data-pv="in" aria-label="Zoom in">+</button><span style="flex:1"></span><button class="btn small" data-pv="close">Close</button></div><div class="pv-scroll"></div>`;
  const sc = $('.pv-scroll', ov);
  const svg = svgEl.cloneNode(true); svg.removeAttribute('width'); svg.removeAttribute('height'); sc.appendChild(svg);
  const apply = () => { svg.style.width = Math.round(pvZoom * 100) + '%'; $('.pv-z', ov).textContent = Math.round(pvZoom * 100) + '%'; };
  const zoomBy = (f) => {
    const cx = (sc.scrollLeft + sc.clientWidth / 2) / sc.scrollWidth, cy = (sc.scrollTop + sc.clientHeight / 2) / sc.scrollHeight;
    pvZoom = Math.min(8, Math.max(1, pvZoom * f)); apply();
    sc.scrollLeft = cx * sc.scrollWidth - sc.clientWidth / 2; sc.scrollTop = cy * sc.scrollHeight - sc.clientHeight / 2;
  };
  ov.onclick = (e) => { const a = e.target.closest('[data-pv]'); if (!a) return; if (a.dataset.pv === 'close') closePageViewer(); else zoomBy(a.dataset.pv === 'in' ? 1.4 : 1 / 1.4); };
  document.body.appendChild(ov); document.body.style.overflow = 'hidden'; apply();
  try { history.pushState({ pageViewer: 1 }, ''); } catch (e) { } // so the phone's back button closes the viewer
}
function closePageViewer(silent) {
  const ov = $('#pageViewer'); if (!ov) return;
  ov.remove(); document.body.style.overflow = '';
  if (!silent && history.state && history.state.pageViewer) history.back();
}
window.addEventListener('popstate', () => closePageViewer(true));
document.addEventListener('click', (e) => { const svg = e.target.closest('.pagewrap > svg'); if (svg && !e.target.closest('#pageViewer')) openPageViewer(svg); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePageViewer(); });

// ===================== INIT =====================
function init() {
  loadDB();
  backupStatus(); askPersistentStorage(); initNativeShell(); initSync();
  $$('.tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));
  $('#btnBackup').onclick = backupAll;
  $('#btnRestore').onclick = () => $('#restoreFileInput').click();
  $('#btnImportKnit').onclick = () => $('#knitFileInput').click();
  $('#restoreFileInput').onchange = async (e) => { await restoreFromFile(e.target.files[0]); e.target.value = ''; };
  $('#knitFileInput').onchange = async (e) => { await importKnitFromFile(e.target.files[0]); e.target.value = ''; };
  initBuild();
  renderDollsPanel();
  renderBuilder();
  if (!DB.dolls.length) showTab('dolls');
}
document.addEventListener('DOMContentLoaded', init);
