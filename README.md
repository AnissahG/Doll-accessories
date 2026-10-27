# Doll accessories Pattern Studio

A PWA with the same layout as Doll sew: source in `src/`, built into one `dist/index.html`.

## Layout
- `src/order.json` sets the engine order; `app.js` (the UI) always comes last.
- `src/index.tmpl.html` + `src/style.css` form the page shell.
- Engine modules:
  - **Core:** `geom.js`, `model.js`, `measure.js`, `render.js`, `cutting.js`. These started as copies of Doll sew's and have since diverged (the accessory doll fields, label layout and so on), so they stay as separate copies.
  - **Measurements & helpers:** `accmeasure.js` (head, hand and foot measurements), `shapes.js`, `hardware.js` (rings, buckles, zips).
  - **Options:** `options.js` (catalogue, drawers, presets).
  - **Item drafts:** `bags.js`, `hats.js`, `belts.js`, `neck.js` (neckwear, hair accessories, other styling), `collars.js` (collars & cuffs), `aprons.js`, `legs.js` (leg & boot; its `hose*` functions are copied from Doll sew's `hosiery.js` — keep the two in step), `shoes.js`.
  - **Output:** `flats.js`, `assembly.js` (`buildAccessory`).
- `platform.js` + `sync.js` come after `app.js` (see below).
- `app.js`: the UI. Its DATA SAFETY + PAGE VIEWER block is shared word-for-word with Doll sew's `src/app.js`; keep the two in step.
- `dist/` is what gets deployed: `index.html`, `sw.js`, `manifest.json`, icons, `fonts/`.

## Build & test
- **Build:** `py build.py` (on Windows use `py`, not `python`) writes `dist/index.html`.
- **Serve locally:** `node scripts/serve.mjs` serves `dist/` on http://localhost:5184.
- **Tests:**
  - `node test/fuzz.js test/real_dolls_backup.json`: every item × style × doll, plus 3000 random option sets.
  - `node test/item_sheet.js <outdir> <doll prefix> <item…>`: writes every preset's pages + flat as SVG to look at.
  - `node test/one.js test/real_dolls_backup.json <doll prefix> '{"item":"tote",...}'`: one case, piece by piece.
- **When shipping:** bump `CACHE` in `dist/sw.js` (now `doll-acc-v6`). Old caches are removed by the `doll-acc-` prefix only.

## APK + PWA + sync
- **Repo:** github.com/AnissahG/Doll-accessories.
  - Netlify publishes `dist/` as it is (`netlify.toml`).
  - Every push to `main` builds a signed APK (`.github/workflows/android.yml`, Capacitor 8, app id `com.dollheimr.accessoriesstudio`) and publishes it as a GitHub Release.
  - The repo is public, so the signing key is not committed. The workflow takes it from the `KEYSTORE_BASE64` secret, or from `signing/debug.keystore` if present.
- **`src/platform.js`** and **`src/sync.js`** are shared word-for-word with Doll sew; keep them in step.
  - `platform.js` handles the share-sheet downloads, the native `HtmlPrint` print (written by `scripts/patch-android.mjs`) and the back button.
  - `sync.js` uses Supabase table `acc_records` in the Dollheimr Studio project. Its setup SQL is in the app: ☁ Sync → Setup script.
- **Fonts:** bundled in `dist/fonts`, so the app works fully offline.

## History
- **2026-10-27 — APK + sync between devices:**
  - Native downloads and printing, with bundled fonts.
  - Sync is checked against a mock Supabase with two browser "devices".
  - Fuzz 6984 / 0. Cache `doll-acc-v6`.
- **2026-10-26 — Leg & boot** (`src/legs.js`): a new category, "leg".
  - **Boot covers** (ankle → thigh-high): the sock side profile with an open sole (an elastic casing tucks under the shoe) + a stirrup strap.
  - **Spats / gaiters:** the same profile cut off across the instep, with an instep strap.
  - **Covers and spats:** opening down the back (hook & loop, zip, lacing, buttons, snaps); "over shoes" grows the foot by the shoe's bulk; fold-down cuff or faux-fur top.
  - **Boot cuffs / toppers:** fold-over, cable-knit look, ruffle, lace, faux fur.
  - **Ankle cuffs:** ruffle, double ruffle, lace; snap, ribbon or elastic; optional bow.
  - 18 presets. Fuzz 6984 / 0. Cache `doll-acc-v5`.
- **2026-10-26 — Aprons** (`src/aprons.js`): a new category, "apron".
  - **Half (waist) apron:** straight, rounded, curved or scalloped; flat, gathered, full or pleated; ruffle / double ruffle / lace; pockets (incl. heart); waistband running on into ties, optional big bow.
  - **Bib apron and maid / lolita apron:** the same skirt plus a bib (straight, rounded, heart, scalloped) on a neck loop or crossed straps (optionally frilled).
  - **Pinafore (cross-back) apron:** A-line front, two overlapping backs, crossed straps.
  - **Tabard:** front & back joined at the shoulders. The neck is kept to a quarter of the way to the waist; beyond that, a back slit with a button lets the head through.
  - The plan data uses `type` (not `kind`, which is the flat's dispatch key).
  - 20 presets. Fuzz 6632 / 0. Cache `doll-acc-v4`.
- **2026-10-26 — Collars & cuffs** (`src/collars.js`): a new category, "collar".
  - **Flat collar:** round Peter Pan, pointed, scalloped or Bertha; edge plain / lace / ruffle / piping, or all-lace. Drafted in the flat-collar plane (neck arc = 88 % of a circle).
  - **Sailor collar:** back flap + V front, ribbon stripes, sailor tie.
  - **Ruffle collar:** 1–3 layers, up to an Elizabethan ruff.
  - **False shirt collar:** stand + collar with classic, rounded or button-down points.
  - **Dickey:** front & back bib; mock placket, pintucks or jabot front; shirt or Peter Pan collar; the back opens fully, side ties.
  - **Detachable cuffs:** band, French, flared gauntlet, ruffle or lolita wrist cuff; closed by snap, button, ribbon or elastic.
  - **Fastening:** all neck pieces fasten with a bias binding that runs on into ties, ribbon ties, or a neckband + snap.
  - 31 presets. Flats in `collarFlat`. Fuzz 6232 / 0. Cache `doll-acc-v3`.
- **2026-10-26:** split into `src/` + `build.py`. The rebuild was byte-identical to the previous single file.
- **2026-10-24:**
  - Fixed tiny bags with a facing top producing a zero-height lining gusset (NaN pages): the facing is capped at 35 % of the bag height.
  - New icons (separate any / maskable + apple-touch-icon).
  - The service worker no longer deletes the Doll sew cache, and caches Google Fonts.
  - Backup reminder + persistent-storage request, tap a page to zoom, and "Update original" on Duplicate & tweak.
