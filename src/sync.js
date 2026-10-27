// ===================== SYNC BETWEEN DEVICES =====================
// Shared word-for-word by Doll sew and Doll accessories (src/sync.js); keep the two in step.
// Same design as Doll Ledger and Dollheimr Social: the Supabase project already set up for Dollheimr
// Studio (same URL, key, email and password), with this app's own table, so it never touches the
// other apps' data. saveDB() dates every record that changed (_ts) and queues it; the queue goes up a
// few seconds later. Other devices' changes come down on open, every 30 s while the app is visible,
// and after each upload. Newest edit wins.
const SYNC_TABLE = PREFIX.startsWith('doll-sew') ? 'sew_records' : 'acc_records';
const SYNC_APP = PREFIX.startsWith('doll-sew') ? 'Doll sew' : 'Doll accessories';
const SYNC_COLS = ['dolls', 'saved', 'collections'];
const SY = { cfg: sget('sync', null), outbox: sget('outbox', {}), busy: false, state: 'off', error: '', lastOk: sget('syncLastOk', null), touched: new Set(), snap: {}, uiDirty: new Set() };
const syncOn = () => !!(SY.cfg && SY.cfg.url && SY.cfg.key && SY.cfg.session);
const saveSy = () => sset('sync', SY.cfg), saveOutbox = () => sset('outbox', SY.outbox);
const nowIso = () => new Date().toISOString();
const verOf = (r) => (r && r._ts) || '';
const noTs = (r) => JSON.stringify(Object.assign({}, r, { _ts: undefined }));
const recOf = (c, id) => c === 'settings' ? DB.settings : (DB[c] || []).find(x => String(x.id) === id);

// What each record looked like at the last save, so saveDB() can tell what changed.
function syncSnapAll() {
  SYNC_COLS.forEach(c => { SY.snap[c] = new Map((DB[c] || []).filter(r => r && r.id != null).map(r => [String(r.id), noTs(r)])); });
  SY.snap.settings = noTs(DB.settings || {});
}
let syncTimer;
function syncQueue(k, del) {
  if (!SY.cfg) return;
  SY.outbox[k] = del || '1'; if (SY.busy) SY.touched.add(k);
}
// Called by saveDB(k) just before the collection is written to this device's storage.
function syncTrack(k) {
  const ts = nowIso(); let n = 0;
  if (k === 'settings') {
    const s = noTs(DB.settings || {});
    if (s !== SY.snap.settings) { SY.snap.settings = s; DB.settings._ts = ts; syncQueue('settings|settings'); n++; }
  } else if (SYNC_COLS.includes(k)) {
    const old = SY.snap[k] || new Map(), next = new Map();
    for (const r of DB[k]) {
      if (!r) continue;
      if (r.id == null) r.id = uid(k.slice(0, 3));
      const id = String(r.id), s = noTs(r);
      next.set(id, s);
      if (old.get(id) !== s) { r._ts = ts; syncQueue(k + '|' + id); n++; }
    }
    for (const id of old.keys()) if (!next.has(id)) { syncQueue(k + '|' + id, ts); n++; }
    SY.snap[k] = next;
  }
  if (n && SY.cfg) { saveOutbox(); clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(), 2500); }
  syncStatus();
}

// ---- Supabase REST (no library needed)
const sbUrl = (p) => SY.cfg.url.replace(/\/+$/, '') + p;
async function sb(path, opts, retried) {
  opts = opts || {};
  if (SY.cfg.session.expires_at <= Date.now()) await sbRefresh();
  const r = await fetch(sbUrl(path), Object.assign({}, opts, { headers: Object.assign({ apikey: SY.cfg.key, Authorization: 'Bearer ' + SY.cfg.session.access_token }, opts.headers || {}) }));
  if (r.status === 401 && !retried) { await sbRefresh(); return sb(path, opts, true); }
  if (!r.ok) { let msg = String(r.status); try { const j = await r.json(); msg = j.msg || j.message || j.error_description || j.error || msg; } catch (e) { } const er = new Error(msg); er.status = r.status; throw er; }
  return r;
}
async function sbAuth(kind, body) {
  const r = await fetch(sbUrl(kind === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=' + kind), { method: 'POST', headers: { apikey: SY.cfg.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch (e) { }
  if (!r.ok) throw new Error(j.msg || j.error_description || j.message || j.error || ('Sign-in failed (' + r.status + ')'));
  return j;
}
function keepSession(j) { const o = SY.cfg.session || {}; SY.cfg.session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + ((j.expires_in || 3600) - 60) * 1000, user_id: (j.user && j.user.id) || o.user_id, email: (j.user && j.user.email) || o.email || SY.cfg.email }; saveSy(); }
async function sbRefresh() {
  try { keepSession(await sbAuth('refresh_token', { refresh_token: SY.cfg.session.refresh_token })); }
  catch (e) { SY.cfg.session = null; saveSy(); SY.state = 'error'; SY.error = 'Signed out. Sign in again (☁ Sync).'; throw e; }
}

async function syncPush() {
  SY.touched.clear();
  const keys = Object.keys(SY.outbox);
  let i = 0;
  while (i < keys.length) {
    // batches of up to 200 records or ~1 MB (saved patterns can be large)
    const chunk = [], rows = []; let bytes = 0;
    while (i < keys.length && chunk.length < 200 && (bytes < 1000000 || !chunk.length)) {
      const k = keys[i++], j = k.indexOf('|'), c = k.slice(0, j), id = k.slice(j + 1), r = recOf(c, id), m = SY.outbox[k];
      const row = r ? { id: c + ':' + id, store: c, rec_id: id, data: r, deleted: false, updated_at: verOf(r) || nowIso() } : { id: c + ':' + id, store: c, rec_id: id, data: null, deleted: true, updated_at: m !== '1' ? m : nowIso() };
      bytes += JSON.stringify(row).length; chunk.push(k); rows.push(row);
    }
    await sb('/rest/v1/' + SYNC_TABLE + '?on_conflict=user_id,id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
    chunk.forEach(k => { if (!SY.touched.has(k)) delete SY.outbox[k]; }); saveOutbox();
  }
}
async function syncPull() {
  let n = 0, since = SY.cfg.lastPull || '1970-01-01T00:00:00Z';
  const changed = new Set();
  for (let g = 0; g < 200; g++) {
    const rows = await (await sb('/rest/v1/' + SYNC_TABLE + '?select=store,rec_id,data,deleted,updated_at,server_ts&server_ts=gt.' + encodeURIComponent(since) + '&order=server_ts.asc&limit=200')).json();
    if (!rows.length) break;
    for (const row of rows) {
      since = row.server_ts; const c = row.store, id = row.rec_id;
      if (c !== 'settings' && !SYNC_COLS.includes(c)) continue;
      if (SY.outbox[c + '|' + id]) continue; // a newer change on this device is waiting to go up
      const local = recOf(c, id);
      if (row.deleted) {
        if (c !== 'settings' && local && verOf(local) <= row.updated_at) { DB[c] = DB[c].filter(x => String(x.id) !== id); SY.snap[c].delete(id); changed.add(c); n++; }
        continue;
      }
      if (local && verOf(local) >= row.updated_at) continue;
      if (c === 'settings') { DB.settings = row.data || {}; SY.snap.settings = noTs(DB.settings); }
      else { const arr = DB[c], i = arr.findIndex(x => String(x.id) === id); if (i >= 0) arr[i] = row.data; else arr.push(row.data); SY.snap[c].set(id, noTs(row.data)); }
      changed.add(c); n++;
    }
    SY.cfg.lastPull = since; saveSy();
    if (rows.length < 200) break;
  }
  changed.forEach(c => { sset(c, DB[c]); SY.uiDirty.add(c); });
  if (changed.size) syncRefreshUI();
  return n;
}
// Redraw what changed, but never under the user's fingers: if they are typing, wait until they stop.
function syncRefreshUI() {
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest('.panel')) return;
  const d = SY.uiDirty; if (!d.size) return;
  if (d.has('dolls')) { renderDollsPanel(); refreshDollSelects(); }
  if ((d.has('saved') || d.has('collections')) && $('#panel-saved').classList.contains('active')) renderSaved();
  d.clear(); backupStatus();
}
document.addEventListener('focusout', () => setTimeout(() => { if (SY.uiDirty.size) syncRefreshUI(); }, 300));

async function syncNow(manual) {
  if (!syncOn() || SY.busy) return;
  if (!navigator.onLine) { SY.state = 'offline'; syncStatus(); return; }
  SY.busy = true; SY.state = 'syncing'; syncStatus();
  try {
    await syncPush();
    const n = await syncPull();
    SY.state = 'ok'; SY.error = ''; SY.lastOk = nowIso(); sset('syncLastOk', SY.lastOk);
    if (manual) toast(n ? 'Synced: ' + n + ' change' + (n === 1 ? '' : 's') + ' from your other devices' : 'Everything is up to date');
  } catch (e) {
    SY.state = navigator.onLine ? 'error' : 'offline';
    SY.error = e.status === 404 ? SYNC_APP + '\'s table is missing in Supabase. Run the setup script (☁ Sync → Setup script).' : e.status === 401 || e.status === 403 ? 'Supabase refused access. Sign in again.' : /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'Could not reach Supabase. Changes will sync when the connection is back.' : (e.message || String(e));
    if (manual) toast('Sync failed: ' + SY.error);
  } finally { SY.busy = false; syncStatus(); }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
window.addEventListener('online', () => syncNow());
setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, 30000);

// ---- status pill + sheet
function syncStatus() {
  const el = $('#syncStatus'); if (!el) return;
  const pend = Object.keys(SY.outbox).length, c = SY.cfg;
  let txt = 'Sync: off', on = false;
  if (c && c.url) {
    if (!c.session) txt = 'Signed out'; else if (SY.state === 'syncing') txt = 'Syncing…'; else if (SY.state === 'error') txt = 'Sync problem';
    else if (pend) txt = pend + ' to sync'; else if (SY.state === 'offline') txt = 'Offline'; else { txt = 'Synced'; on = true; }
  }
  el.innerHTML = '<i class="sync-dot' + (on ? ' on' : c && c.url && (SY.state === 'error' || !c.session) ? ' bad' : '') + '"></i>' + h(txt);
  const box = $('#syncBox'); if (box) box.innerHTML = syncBoxHTML();
}
function syncBoxHTML() {
  const c = SY.cfg;
  if (!(c && c.url)) return `<p class="help" style="margin:0 0 10px">Keep your phone, tablet and laptop showing the same dolls, saved patterns and collections. It uses the Supabase project you already set up for Dollheimr Studio: same Project URL, key, email and password.</p>
    <div class="btn-row"><button class="btn" data-sy="setup">Set up sync</button><button class="btn secondary" data-sy="sql">Setup script</button></div>`;
  const pend = Object.keys(SY.outbox).length;
  return `<p class="help" style="margin:0 0 6px">Signed in as <b>${h((c.session && c.session.email) || c.email || '')}</b>${c.session ? '' : ' (signed out)'}. ${({ ok: 'Synced', syncing: 'Syncing…', offline: 'Offline', error: 'Problem' }[SY.state] || 'Waiting')} · ${SY.lastOk ? 'last sync ' + new Date(SY.lastOk).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'not synced yet'}${pend ? ' · ' + pend + ' waiting to upload' : ''}</p>
    ${SY.error ? `<div class="sy-err">${h(SY.error)}</div>` : ''}
    <div class="btn-row"><button class="btn" data-sy="now">Sync now</button>${c.session ? '' : '<button class="btn secondary" data-sy="setup">Sign in again</button>'}<button class="btn secondary" data-sy="off">Turn off here</button><button class="btn secondary" data-sy="sql">Setup script</button></div>`;
}
function openSyncSheet(inner) {
  let ov = $('.sync-sheet');
  if (!ov) {
    ov = document.createElement('div'); ov.className = 'sync-sheet';
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); else syncAction(e); };
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="sync-card"><div class="sync-head"><h3>☁ Sync between devices</h3><button class="btn small secondary" data-sy="close">Close</button></div>${inner}</div>`;
}
const syncHome = () => openSyncSheet(`<div id="syncBox">${syncBoxHTML()}</div>`);
function syncForm() {
  const c = SY.cfg || {};
  openSyncSheet(`<p class="help" style="margin:0 0 8px">Use the same Project URL, key, email and password as in Dollheimr Studio (also on supabase.com → your project → Project Settings → API). Before the first time, run the <a href="#" data-sy="sql">setup script</a> once.</p>
    <label class="sy-field">Project URL<input id="sy-url" value="${h(c.url || '')}" placeholder="https://abcdefgh.supabase.co" autocomplete="off"></label>
    <label class="sy-field">Publishable key (anon key)<input id="sy-key" value="${h(c.key || '')}" placeholder="sb_publishable_… or eyJ…" autocomplete="off"></label>
    <label class="sy-field">Email<input id="sy-email" type="email" value="${h(c.email || '')}" autocomplete="username"></label>
    <label class="sy-field">Password<input id="sy-pass" type="password" autocomplete="current-password"></label>
    <p class="help" id="sy-msg" style="margin:6px 0"></p>
    <div class="btn-row"><button class="btn" data-sy="go">Sign in &amp; sync</button><button class="btn secondary" data-sy="new">Create an account instead</button><button class="btn secondary" data-sy="home">Back</button></div>`);
}
function syncSqlSheet() {
  openSyncSheet(`<p class="help" style="margin:0 0 8px">Once, in the same Supabase project as Dollheimr Studio: supabase.com → your project → SQL Editor → New query, paste this, press Run. It adds ${SYNC_APP}'s own table next to the others and changes nothing in Studio, Ledger or Social.</p>
    <pre class="sy-sql">${h(SYNC_SQL)}</pre><div class="btn-row"><button class="btn" data-sy="copy">Copy</button><button class="btn secondary" data-sy="home">Back</button></div>`);
}
async function syncAction(e) {
  const b = e.target.closest('[data-sy]'); if (!b) return;
  e.preventDefault();
  const a = b.dataset.sy;
  if (a === 'close') $('.sync-sheet').remove();
  else if (a === 'home') syncHome();
  else if (a === 'setup') syncForm();
  else if (a === 'sql') syncSqlSheet();
  else if (a === 'copy') { try { await navigator.clipboard.writeText(SYNC_SQL); b.textContent = 'Copied'; } catch (er) { const sel = getSelection(), rg = document.createRange(); rg.selectNodeContents($('.sy-sql')); sel.removeAllRanges(); sel.addRange(rg); b.textContent = 'Selected: copy it'; } }
  else if (a === 'go' || a === 'new') syncRun(a === 'new');
  else if (a === 'how') syncAfterConnect(b.dataset.v);
  else if (a === 'now') syncNow(true);
  else if (a === 'off') { if (confirm('Stop syncing on this device? Your data stays here and in the cloud; you can sign in again later.')) { await syncNow(); SY.cfg = null; saveSy(); SY.outbox = {}; saveOutbox(); SY.state = 'off'; SY.error = ''; syncStatus(); toast('Sync is off on this device'); } }
}

const SYNC_SQL = `-- ${SYNC_APP}: sync table. Run once in Supabase → SQL Editor (the same project as Dollheimr Studio).
-- Safe to run again; it does not touch the other apps' tables or files.
create table if not exists public.${SYNC_TABLE} (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  store text not null,
  rec_id text not null,
  data jsonb,
  deleted boolean not null default false,
  updated_at text not null,
  server_ts timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);
create index if not exists ${SYNC_TABLE}_pull on public.${SYNC_TABLE} (user_id, server_ts);
alter table public.${SYNC_TABLE} enable row level security;
drop policy if exists "own rows" on public.${SYNC_TABLE};
create policy "own rows" on public.${SYNC_TABLE} for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- newest edit wins, and every accepted change gets a fresh server time for pulling
create or replace function public.${SYNC_TABLE}_stamp() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then return null; end if;
  new.server_ts := clock_timestamp();
  return new;
end $$;
drop trigger if exists ${SYNC_TABLE}_stamp on public.${SYNC_TABLE};
create trigger ${SYNC_TABLE}_stamp before insert or update on public.${SYNC_TABLE}
  for each row execute function public.${SYNC_TABLE}_stamp();
`;
async function syncConnect(url, key, email, password, create) {
  url = url.trim().replace(/\/+$/, ''); key = key.trim(); email = email.trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url)) throw new Error('The Project URL should look like https://abcdefgh.supabase.co');
  if (key.length < 20) throw new Error('Paste the full publishable (anon) key.');
  const prev = SY.cfg; SY.cfg = { url, key, email, session: null, lastPull: null };
  try {
    if (create) { const j = await sbAuth('signup', { email, password }); if (!j.access_token) { SY.cfg = prev; return 'confirm'; } keepSession(j); }
    else keepSession(await sbAuth('password', { email, password }));
    const remoteHas = (await (await sb('/rest/v1/' + SYNC_TABLE + '?select=id&limit=1&deleted=eq.false')).json()).length > 0;
    const localHas = DB.dolls.length + DB.saved.length + DB.collections.length > 0;
    return remoteHas && localHas ? 'choose' : remoteHas ? 'pull' : 'push';
  } catch (e) { if (!SY.cfg.session) SY.cfg = prev; throw e; }
  finally { saveSy(); }
}
async function syncRun(create) {
  const msg = $('#sy-msg'); msg.textContent = create ? 'Creating account…' : 'Connecting…';
  try {
    const res = await syncConnect($('#sy-url').value, $('#sy-key').value, $('#sy-email').value, $('#sy-pass').value, create);
    if (res === 'confirm') { msg.textContent = 'Account created. Open the confirmation email from Supabase, then come back and tap Sign in & sync.'; return; }
    if (res !== 'choose') return syncAfterConnect(res);
    openSyncSheet(`<p class="help" style="margin:0 0 8px">Your cloud already holds ${SYNC_APP} data, and this device has its own too.</p>
      <div class="btn-row"><button class="btn" data-sy="how" data-v="pull">Use the cloud copy on this device</button></div><p class="help">Best for a new phone or laptop. This device's dolls and patterns are replaced (download a backup first if unsure).</p>
      <div class="btn-row"><button class="btn secondary" data-sy="how" data-v="merge">Merge both</button></div><p class="help">Keeps everything from both. If the same item is in both, the most recent edit wins.</p>`);
  } catch (e) { msg.textContent = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'Could not reach that address. Check the Project URL and your internet connection.' : e.status === 404 ? 'Signed in, but ' + SYNC_APP + '\'s table is missing. Run the setup script in Supabase first.' : e.message; }
}
async function syncAfterConnect(how) {
  if (how === 'pull') {
    SYNC_COLS.forEach(c => { DB[c] = []; sset(c, []); }); DB.settings = {}; sset('settings', {});
    syncSnapAll(); SY.outbox = {}; saveOutbox(); SY.cfg.lastPull = null; saveSy();
  } else {
    SYNC_COLS.forEach(c => DB[c].forEach(r => { if (r && r.id != null) SY.outbox[c + '|' + r.id] = '1'; })); SY.outbox['settings|settings'] = '1'; saveOutbox();
  }
  SY.uiDirty = new Set(['dolls', 'saved', 'collections']);
  syncHome(); await syncNow(); syncRefreshUI();
  toast({ push: 'Sync is on. This device\'s dolls and patterns are now in your cloud', pull: 'Sync is on. Your dolls and patterns were downloaded', merge: 'Merged. All your devices now share the same dolls and patterns' }[how]);
}
function initSync() {
  syncSnapAll();
  const btn = $('#btnSync'); if (btn) btn.onclick = syncHome;
  syncStatus(); syncNow();
}
