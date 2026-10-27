// ===================== PLATFORM (browser PWA or Android APK) =====================
// Shared word-for-word by Doll sew and Doll accessories (src/platform.js); keep the two in step.
// In the APK there is no download bar and no print dialog in the web view, so files go through
// Android's share sheet (Files, Drive, email…) and printing goes through Android's own print service
// (the HtmlPrint plugin added by scripts/patch-android.mjs), which also offers "Save as PDF".
const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const capPlugin = (name) => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) || (window.Capacitor && window.Capacitor.registerPlugin && window.Capacitor.registerPlugin(name));

function blobToBase64(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
}
// Written in ~1.5 MB pieces (a multiple of 3 bytes, so each piece is valid base64 on its own):
// one giant write is what fails for big backups in an Android app.
async function writeNativeFile(path, blob, directory) {
  const Filesystem = capPlugin('Filesystem'), CHUNK = 3 * 512 * 1024;
  if (!blob.size) await Filesystem.writeFile({ path, data: '', directory, recursive: true });
  for (let off = 0; off < blob.size; off += CHUNK) {
    const data = await blobToBase64(blob.slice(off, off + CHUNK));
    if (off === 0) await Filesystem.writeFile({ path, data, directory, recursive: true });
    else await Filesystem.appendFile({ path, data, directory });
  }
  return (await Filesystem.getUri({ path, directory })).uri;
}
// Browser: a normal download. APK: the share sheet. Resolves false if the share was cancelled.
async function download(name, blob) {
  if (!IS_NATIVE) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  }
  try {
    const uri = await writeNativeFile(name, blob, 'CACHE');
    await capPlugin('Share').share({ title: name, url: uri, dialogTitle: name });
    return true;
  } catch (e) {
    if (/cancel/i.test(String(e && e.message || e))) return false;
    toast('Could not save the file: ' + (e && e.message || e));
    return false;
  }
}
// html is a complete page; in the browser it opens in a new tab and prints itself.
async function printHTML(html, name) {
  if (IS_NATIVE) {
    const paper = /@page\{size:letter/.test(html) ? 'Letter' : 'A4';
    try { await capPlugin('HtmlPrint').print({ html: html.replace(/<script>window\.onload[\s\S]*?<\/script>/, ''), name: name || 'Pattern', paper }); }
    catch (e) { toast('Printing is not available: ' + (e && e.message || e)); }
    return;
  }
  const w = window.open('', '_blank');
  if (!w) { toast('Allow pop-ups to print, or download the SVG instead.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
// Android back button: close the page viewer / go back a step, and only leave the app from the start.
function initNativeShell() {
  if (!IS_NATIVE) return;
  document.documentElement.classList.add('native');
  // Android's file picker greys out backups saved as 'octet-stream' when only JSON is allowed
  document.querySelectorAll('input[type=file][accept*="json"]').forEach(i => i.removeAttribute('accept'));
  const App = capPlugin('App');
  if (App && App.addListener) App.addListener('backButton', (ev) => {
    if (document.getElementById('pageViewer')) { closePageViewer(); return; }
    const sheet = document.querySelector('.sync-sheet');
    if (sheet) { sheet.remove(); return; }
    if (ev && ev.canGoBack) history.back(); else App.minimizeApp ? App.minimizeApp() : App.exitApp();
  });
}
