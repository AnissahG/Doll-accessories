// ===================== CATALOGUE, OPTIONS, PRESETS =====================
const CATS = [
  ['bag', 'Bags'], ['hat', 'Sewn hats & headwear'], ['belt', 'Belts & harnesses'], ['neck', 'Neckwear'],
  ['hair', 'Hair accessories'], ['styling', 'Other styling'], ['shoe', 'Shoes (beta)'], ['collar', 'Collars & cuffs'], ['apron', 'Aprons'], ['leg', 'Leg & boot']
];
// [id, label, category]
const ITEMS = [
  ['tote', 'Tote', 'bag'], ['shoulder', 'Shoulder bag', 'bag'], ['crossbody', 'Crossbody bag', 'bag'], ['messenger', 'Messenger bag', 'bag'],
  ['satchel', 'Satchel / school bag', 'bag'], ['backpack', 'Backpack', 'bag'], ['drawstring', 'Drawstring bag', 'bag'], ['bucket', 'Bucket bag', 'bag'],
  ['baguette', 'Baguette', 'bag'], ['minibag', 'Mini handbag', 'bag'], ['tophandle', 'Structured top-handle bag', 'bag'], ['hobo', 'Hobo bag', 'bag'],
  ['duffel', 'Duffel / barrel bag', 'bag'], ['pouch', 'Pouch / clutch', 'bag'], ['beltbag', 'Belt bag / fanny pack', 'bag'],
  ['buckethat', 'Bucket hat', 'hat'], ['cap', 'Baseball cap', 'hat'], ['beret', 'Beret', 'hat'], ['bonnet', 'Bonnet', 'hat'],
  ['newsboy', 'Newsboy cap', 'hat'], ['bakerboy', 'Baker-boy cap', 'hat'], ['flatcap', 'Flat cap', 'hat'], ['sunhat', 'Sunhat / wide brim', 'hat'],
  ['sailor', 'Sailor hat', 'hat'], ['trapper', 'Trapper / aviator hat', 'hat'], ['witch', 'Witch hat', 'hat'], ['cloche', 'Cloche', 'hat'],
  ['pillbox', 'Pillbox / fur hat', 'hat'], ['peaked', 'Peaked cap / Breton cap', 'hat'], ['tulip', 'Tulip hat', 'hat'],
  ['hood', 'Hood (headpiece)', 'hat'], ['balaclava', 'Balaclava', 'hat'],
  ['belt', 'Belt', 'belt'], ['corsetbelt', 'Corset belt', 'belt'], ['obi', 'Obi-style belt', 'belt'], ['utilitybelt', 'Utility belt', 'belt'],
  ['waistharness', 'Waist harness', 'belt'], ['chestharness', 'Chest / body harness', 'belt'], ['thighharness', 'Thigh / leg harness', 'belt'],
  ['choker', 'Choker', 'neck'], ['tie', 'Necktie', 'neck'], ['bowtie', 'Bow tie', 'neck'], ['cravat', 'Cravat / ascot', 'neck'],
  ['scrunchie', 'Scrunchie', 'hair'], ['hairbow', 'Hair bow', 'hair'], ['ribbonbow', 'Ribbon bow', 'hair'], ['headband', 'Headband', 'hair'],
  ['bandana', 'Bandana', 'hair'], ['kerchief', 'Kerchief', 'hair'], ['headscarf', 'Head scarf', 'hair'],
  ['suspenders', 'Suspenders', 'styling'], ['garters', 'Garters', 'styling'], ['sash', 'Sash', 'styling'],
  ['slippers', 'Fabric slippers', 'shoe'], ['flats', 'Ballet flats', 'shoe'], ['maryjanes', 'Mary Janes', 'shoe'], ['sandals', 'Simple sandals', 'shoe'], ['espadrilles', 'Espadrilles', 'shoe'],
  ['flatcollar', 'Flat collar (Peter Pan, Bertha…)', 'collar'], ['sailorcollar', 'Sailor collar', 'collar'], ['rufflecollar', 'Ruffle collar', 'collar'],
  ['shirtcollar', 'False shirt collar', 'collar'], ['dickey', 'Dickey / false shirt front', 'collar'], ['cuffs', 'Detachable cuffs', 'collar'],
  ['halfapron', 'Half / waist apron', 'apron'], ['bibapron', 'Bib apron', 'apron'], ['maidapron', 'Maid / lolita apron', 'apron'], ['pinafore', 'Pinafore (cross-back) apron', 'apron'], ['tabard', 'Tabard', 'apron'],
  ['bootcovers', 'Boot covers', 'leg'], ['spats', 'Spats / gaiters', 'leg'], ['bootcuffs', 'Boot cuffs / toppers', 'leg'], ['anklecuffs', 'Ankle cuffs', 'leg']
];
const itemCat = (id) => { const x = ITEMS.find(i => i[0] === id); return x ? x[2] : 'bag'; };
const itemLabel = (id) => { const x = ITEMS.find(i => i[0] === id); return x ? x[1] : id; };
const isCat = (o, c) => itemCat(o.item) === c;
// real-life bag sizes in cm (width, height, depth) — scaled to the doll
const BAG_REF = {
  tote: [40, 36, 12], shoulder: [30, 22, 9], crossbody: [22, 16, 6], messenger: [34, 26, 9], satchel: [32, 25, 10],
  backpack: [28, 36, 13], drawstring: [30, 38, 0], bucket: [24, 28, 24], baguette: [26, 13, 5], minibag: [20, 15, 8],
  tophandle: [27, 19, 12], hobo: [36, 30, 8], duffel: [50, 28, 26], pouch: [24, 15, 0], beltbag: [24, 13, 6]
};
const BAG_SIZE_K = { tiny: 0.55, small: 0.75, medium: 1, large: 1.25, oversized: 1.55 };

const ACH = {
  legFabric: [['woven', 'woven'], ['stretch', 'stretch knit'], ['faux leather', 'faux leather / felt (raw edges)']],
  legOver: [['bare foot / socks', 'bare foot or socks'], ['over shoes', 'over shoes']],
  bootLen: [['ankle boot', 'ankle boot'], ['mid-calf', 'mid-calf'], ['knee-high', 'knee-high'], ['over-the-knee', 'over-the-knee'], ['thigh-high', 'thigh-high']],
  bootClose: [['hook & loop', 'hook & loop down the back'], ['zip', 'zip down the back'], ['lacing', 'lacing down the back'], ['buttons', 'buttons down the back'], ['none', 'none (stretch only)']],
  bootTop: [['hem', 'plain hem'], ['fold-down cuff', 'fold-down cuff'], ['faux-fur trim', 'faux-fur trim']],
  spatLen: [['ankle', 'spats (ankle)'], ['mid-calf', 'mid-calf gaiters'], ['knee', 'knee gaiters']],
  spatClose: [['buttons', 'buttons'], ['snaps', 'snaps'], ['hook & loop', 'hook & loop'], ['lacing', 'lacing']],
  cuffPos: [['ankle boot', 'ankle boots'], ['mid-calf', 'mid-calf boots'], ['knee-high', 'knee boots']],
  bootCuffStyle: [['fold-over', 'fold-over band'], ['cable knit', 'cable-knit look'], ['ruffle', 'ruffle'], ['lace ruffle', 'lace ruffle'], ['faux fur', 'faux fur']],
  ankleCuffStyle: [['ruffle', 'ruffle'], ['double ruffle', 'double ruffle'], ['lace ruffle', 'lace ruffle'], ['lace', 'band with lace']],
  ankleClose: [['snap', 'snap'], ['ribbon tie', 'ribbon tie'], ['elastic', 'elastic (pull-on)']],
  apronLen: [['short', 'short (mid-thigh)'], ['knee', 'knee'], ['midi', 'midi'], ['long', 'long (ankle)']],
  apronShape: [['rectangle', 'straight'], ['rounded', 'rounded corners'], ['curved', 'curved (half-moon)'], ['scalloped', 'scalloped hem']],
  apronFull: [['flat', 'flat'], ['gathered', 'gathered (1.6×)'], ['full', 'full (2×)'], ['pleated', 'pleated']],
  apronHem: [['plain', 'plain hem'], ['lace', 'lace edge'], ['ruffle', 'ruffle'], ['double ruffle', 'double ruffle']],
  apronPockets: [['none', 'none'], ['one', 'one'], ['two', 'two'], ['heart', 'heart pockets']],
  bibShape: [['rectangle', 'straight'], ['rounded', 'rounded'], ['heart', 'heart'], ['scalloped', 'scalloped top']],
  apronStraps: [['neck loop', 'neck loop (halter)'], ['cross-back', 'straps crossing at the back'], ['button-on', 'crossed straps, buttoned on']],
  bowSize: [['normal', 'normal'], ['big', 'big bow']],
  tabardTie: [['side ties', 'side ties'], ['belt', 'belt'], ['open', 'open sides']],
  tabardNeck: [['round', 'round'], ['V', 'V-neck'], ['square', 'square']],
  tabardHem: [['straight', 'straight'], ['rounded', 'rounded'], ['pointed', 'pointed']],
  collarShape: [['round', 'round (Peter Pan)'], ['pointed', 'pointed'], ['scalloped', 'scalloped'], ['Bertha', 'Bertha (wide, over the shoulders)']],
  collarEdge: [['plain', 'plain'], ['lace edging', 'lace edging'], ['ruffle edge', 'ruffle edge'], ['piping', 'piping'], ['all lace', 'all lace (single layer)']],
  collarFasten: [['bias ties', 'bias binding that runs on into ties'], ['ribbon ties', 'ribbon ties'], ['neckband + snap', 'neckband with a snap']],
  sailorStripes: [['0', 'none'], ['1', '1 stripe'], ['2', '2 stripes'], ['3', '3 stripes']],
  ruffleTiers: [['1', '1 layer'], ['2', '2 layers'], ['3', '3 layers (ruff)']],
  ruffleFull: [['medium', 'medium (2×)'], ['full', 'full (2.6×)']],
  shirtPoint: [['classic', 'classic points'], ['rounded', 'rounded (club)'], ['button-down', 'button-down']],
  dickeyFront: [['plain', 'plain'], ['mock placket', 'mock button placket'], ['pintucks', 'pintucks'], ['jabot ruffles', 'jabot ruffles']],
  dickeyCollar: [['shirt collar', 'shirt collar'], ['Peter Pan', 'Peter Pan'], ['none', 'no collar']],
  cuffStyle: [['band', 'band'], ['French (fold-back)', 'French (fold-back)'], ['flared gauntlet', 'flared gauntlet'], ['ruffle', 'band + ruffle'], ['lolita wrist cuff', 'lolita wrist cuff']],
  cuffClose: [['snap', 'snap'], ['button', 'button'], ['ribbon tie', 'ribbon tie'], ['elastic (pull-on)', 'elastic (pull-on)']],
  sa: [['0', 'no seam allowance'], '0.3', '0.5', '0.7', '1', 'custom'],
  hemSa: [['0', 'none'], '0.5', '1', '1.5', 'custom'],
  paper: ['A4', 'Letter'],
  styleTags: ['Y2K', 'Korean fashion', 'kawaii', 'soft girl', 'preppy', 'academia', 'dark academia', 'streetwear', 'sporty', 'casual', 'minimal', 'romantic', 'coquette', 'gothic', 'punk', 'grunge', 'rock', 'utility', 'workwear', 'military', 'vintage', 'retro', 'cottagecore', 'fantasy', 'fairy', 'elegant', 'formal', 'luxury', 'cosy', 'cute', 'edgy', 'Dollheimr'],
  season: ['spring', 'summer', 'autumn/fall', 'winter', 'transitional', 'all-season'],
  occasion: ['everyday', 'casual', 'streetwear', 'school', 'office', 'party', 'formal', 'evening', 'holiday', 'beach', 'festival', 'fantasy/costume', 'photoshoot'],
  construction: [['turned', 'turned & lined (woven fabric)'], ['raw', 'raw edge (faux leather, felt, leather)']],
  interfacing: [['none', 'none'], ['fusible', 'fusible interfacing'], ['foam', 'foam / fleece (soft structure)'], ['fusible + foam', 'interfacing + foam'], ['stiff', 'stiff (buckram / heavy felt)']],
  bagSize: ['tiny', 'small', 'medium', 'large', 'oversized'],
  bagShape: [['rectangle', 'rectangle'], ['trapezoid', 'trapezoid (narrower top)'], ['rounded', 'rounded bottom corners'], ['rounded all', 'rounded corners (all four)'], ['crescent', 'crescent / slouchy top (hobo)'], ['dome', 'dome / arched top'], ['half-moon', 'half-moon']],
  bodyCon: [['flat', 'flat (no gusset)'], ['boxed', 'boxed corners'], ['band', 'gusset band (sides + bottom)'], ['sides', 'side gussets + separate base'], ['round', 'round / oval base + tube'], ['barrel', 'end panels (barrel / duffel)']],
  bodyCut: [['two', 'front & back pieces'], ['one', 'one piece, folded at the bottom']],
  gather: [['none', 'none'], ['gathered', 'gathered top'], ['2 pleats', '2 pleats'], ['4 pleats', '4 pleats']],
  topFinish: [['lining', 'lining (bagged out)'], ['facing', 'facing band'], ['binding', 'bias binding'], ['hem', 'turned hem (unlined)']],
  closure: [['none', 'none (open top)'], ['magnet', 'magnetic snap'], ['snap', 'sew-on snap'], ['loop', 'button & loop'], ['tab', 'tab & button / snap'], ['zip', 'zip top'], ['zippanel', 'recessed zip panel'], ['casing', 'drawstring casing'], ['eyelets', 'drawstring through eyelets'], ['frame', 'clasp frame (sew-in / glue-in)'], ['buckles', 'buckle straps'], ['turnlock', 'turn-lock'], ['toggle', 'toggle & loop']],
  flap: [['none', 'no flap'], ['straight', 'straight'], ['rounded', 'rounded corners'], ['envelope', 'envelope (pointed)'], ['curved', 'curved (U)']],
  flapLen: [['short', 'short (⅓)'], ['half', 'half'], ['long', 'long (¾)'], ['full', 'full front']],
  handles: [['none', 'none'], ['two', 'two handles'], ['top', 'one top handle'], ['shoulder', 'shoulder strap'], ['crossbody', 'crossbody strap'], ['adjustable', 'adjustable crossbody (slider)'], ['backpack', 'backpack straps'], ['wrist', 'wrist strap'], ['chain', 'chain / bought strap (tabs + rings)'], ['beltstrap', 'belt strap (waist)']],
  carry: [['waist', 'bag top at the waist'], ['hip', 'bag top at the hip'], ['mid thigh', 'bag top at mid thigh']],
  handleDrop: [['hand', 'short (hand carry)'], ['arm', 'medium (over the forearm)'], ['shoulder', 'long (over the shoulder)']],
  strapMake: [['folded', 'folded strip (4 layers)'], ['tube', 'turned tube'], ['ribbon', 'ribbon / leather strip (bought)'], ['cord', 'cord']],
  attach: [['seam', 'sewn into the top seam'], ['rings', 'tabs & rings'], ['outside', 'stitched on the outside (box stitch)']],
  hwSize: [['auto', 'auto (fits the bag)']].concat(HW.ring.map(v => [String(v), v + ' mm'])),
  bagPockets: ['front patch pocket', 'front zip pocket', 'back slip pocket', 'inside slip pocket'],
  zipType: Object.keys(ZIPS),
  // hats
  crownShape: [['round', 'round'], ['oval', 'oval (front–back longer)']],
  crownTaper: [['none', 'straight sides'], ['slight', 'slightly tapered'], ['strong', 'tapered']],
  panels: [['4', '4'], ['6', '6'], ['8', '8']],
  brimShape: [['flat', 'flat'], ['slight', 'slightly drooping'], ['droop', 'drooping'], ['deep', 'deep droop (cloche / bucket)'], ['up', 'turned up']],
  brimEdge: [['plain', 'plain'], ['topstitched', 'rows of topstitching'], ['wired', 'wired edge'], ['bound', 'bias-bound']],
  capBack: [['closed', 'closed back'], ['snapback', 'adjustable strap (snapback)'], ['elastic', 'elastic back']],
  hatBand: [['none', 'none'], ['fabric', 'fabric band'], ['ribbon', 'ribbon band'], ['cord', 'cord']],
  stiffness: [['soft', 'soft'], ['medium', 'medium (interfacing)'], ['stiff', 'stiff (buckram / felt)']],
  frontFlap: [['up', 'worn up'], ['down', 'worn down']],
  hoodFit: [['easy', 'easy'], ['snug', 'snug']],
  // belts & harnesses
  beltPos: ['underbust', 'waist', 'high hip', 'hip', 'low hip'],
  beltClosure: [['pin buckle', 'pin buckle'], ['slide buckle', 'slide buckle (no holes)'], ['snap', 'snap'], ['hook', 'hook & eye'], ['ties', 'ties'], ['lace-up', 'lace-up'], ['velcro', 'hook & loop']],
  beltMake: [['folded', 'folded strip (4 layers)'], ['layers', 'two layers + interfacing'], ['single', 'faux leather / felt (single layer)'], ['ribbon', 'ribbon / webbing (bought)']],
  corsetShape: [['straight', 'straight'], ['pointed', 'pointed front'], ['curved', 'curved top & bottom']],
  obiTie: [['ties', 'long ties'], ['bow', 'bow at the back'], ['wrap', 'wrap & snap']],
  harnessStyle: [['simple', 'shoulders (simple)'], ['collar', 'with collar & centre ring'], ['xback', 'X-back'], ['cage', 'cage (double underbust strap)']],
  waistHarness: [['double', 'double belt with connectors'], ['suspender', 'belt + hanging straps']],
  ringType: [['O-ring', 'O-ring'], ['D-ring', 'D-ring'], ['square', 'square ring']],
  thighPos: ['upper thigh', 'mid thigh', 'above knee'],
  // neck
  chokerStyle: [['plain', 'plain band'], ['ruffled', 'ruffled'], ['lace-up', 'lace-up front'], ['ring', 'with front ring']],
  neckClosure: [['snap', 'snap'], ['hook', 'hook & eye'], ['ties', 'ties'], ['velcro', 'hook & loop']],
  tieStyle: [['classic', 'classic'], ['skinny', 'skinny'], ['wide', 'wide (70s)']],
  tieMake: [['self', 'self-tie'], ['pretied', 'pre-tied (snap neckband)']],
  tieLen: [['waist', 'tip at the waist'], ['belt', 'tip at the belt (high hip)'], ['short', 'short (mid chest)']],
  bowStyle: [['butterfly', 'butterfly'], ['batwing', 'batwing (straight)'], ['diamond', 'diamond point']],
  cravatStyle: [['ascot', 'ascot (pointed ends)'], ['plain', 'plain (rounded ends)'], ['jabot', 'jabot (ruffle)']],
  // hair
  scrunchieSize: ['skinny', 'regular', 'oversized'],
  bowType: [['loop', 'loop bow (classic)'], ['flat', 'flat bow (pinched)'], ['double', 'double loop'], ['lolita', 'big lolita bow']],
  bowMount: [['clip', 'hair clip'], ['elastic', 'elastic'], ['sewn', 'sew on'], ['headband', 'on a headband']],
  headbandStyle: [['flat', 'flat band'], ['padded', 'padded'], ['knot', 'knotted top'], ['twist', 'twisted front']],
  headbandBack: [['elastic', 'elastic at the back'], ['cover', 'covers a bought hard headband']],
  scarfSize: ['small', 'medium', 'large'],
  hemFinish: [['rolled', 'rolled hem'], ['narrow', 'narrow double hem'], ['fray', 'raw edge + fray stopper'], ['lined', 'self-lined (sewn & turned)']],
  // styling
  suspStyle: [['Y', 'Y-back'], ['X', 'X-back'], ['H', 'H-back (straight)']],
  suspEnds: [['buttons', 'button tabs'], ['clips', 'clips'], ['sewn', 'sewn in']],
  garterStyle: [['ruffled', 'ruffled thigh garter'], ['flat', 'flat / lace garter band'], ['belt', 'garter belt (stocking suspenders)']],
  sashStyle: [['waist', 'waist sash (tie)'], ['shoulder', 'shoulder sash'], ['bow', 'wide sash, bow at the back']],
  // shoes
  toeShape: ['round', 'almond', 'square'],
  soleMake: [['felt', 'felt / leather outsole'], ['card', 'card insole + felt / leather outsole'], ['cord', 'cord / jute (espadrille)']],
  shoeClosure: [['snap', 'snap'], ['button', 'button'], ['buckle', 'buckle'], ['elastic', 'elastic']],
  sandalStyle: [['ankle', 'ankle strap'], ['tbar', 'T-bar'], ['slide', 'slide (one strap)'], ['cross', 'cross straps']]
};

const ACC_DEFAULTS = {
  cat: 'bag', item: 'tote', style: '', name: '', doll: '',
  sa: '0.5', saCm: '', hemSa: '1', hemSaCm: '', paper: 'A4', packPages: true, fabricWidth: '110', fabricWidthCm: '',
  styleTags: [], season: [], occasion: [],
  legFabric: 'woven', legOver: 'over shoes', legLined: false, bootLen: 'knee-high', bootClose: 'hook & loop', bootTop: 'hem', spatLen: 'ankle', spatClose: 'buttons', cuffPos: 'mid-calf', bootCuffStyle: 'fold-over', cuffBandH: '', ankleCuffStyle: 'ruffle', ankleClose: 'snap', ankleBow: false,
  apronLen: 'knee', apronShape: 'rectangle', apronFull: 'gathered', apronHem: 'plain', apronLace: false, apronPockets: 'two', bibShape: 'rectangle', apronStraps: 'neck loop', frillStraps: false, bowSize: 'normal', tabardTie: 'side ties', tabardNeck: 'round', tabardHem: 'straight',
  collarShape: 'round', collarW: '', collarEdge: 'plain', collarFasten: 'bias ties', sailorStripes: '2', sailorBow: true, ruffleTiers: '1', ruffleFull: 'medium', shirtPoint: 'classic', dickeyFront: 'mock placket', dickeyCollar: 'shirt collar', cuffStyle: 'band', cuffH: '', cuffClose: 'snap',
  construction: 'turned', lining: 'yes', interfacing: 'fusible',
  // bags
  bagSize: 'medium', bagW: '', bagH: '', bagD: '', bagShape: 'rectangle', taperCm: '', cornerCm: '',
  bodyCon: 'boxed', bodyCut: 'two', gather: 'none', topFinish: 'lining', closure: 'magnet', zipType: 'doll zip (3 mm teeth)', frameW: '', frameH: '',
  flap: 'none', flapLen: 'half', handles: 'two', carry: 'hip', handleDrop: 'shoulder', strapW: '', strapLen: '', strapMake: 'folded', attach: 'seam', hwSize: 'auto',
  bagPockets: [], baseInsert: false, bagFeet: false,
  // hats
  hatEase: '', crownH: '', crownShape: 'oval', crownTaper: 'slight', panels: '6', brimW: '', brimShape: 'slight', brimEdge: 'topstitched', visorD: '',
  capBack: 'closed', topButton: true, eyelets: false, hatBand: 'none', hatBow: false, ties: false, earFlaps: false, frontFlap: 'up', bonnetFrill: false, tipBend: true,
  hoodFit: 'easy', stiffness: 'medium', reversible: false,
  // belts & harnesses
  beltPos: 'waist', beltW: '', overClothes: true, beltClosure: 'pin buckle', beltTail: '', beltMake: 'folded', holes: 5,
  corsetH: '', corsetShape: 'pointed', boning: true, obiTie: 'ties', pouches: 2,
  harnessStyle: 'simple', withWaist: false, waistHarness: 'double', ringType: 'O-ring', thighPos: 'mid thigh', toBelt: true, bothLegs: false,
  // neck
  chokerStyle: 'plain', chokerW: '', neckClosure: 'snap', tieStyle: 'classic', tieMake: 'pretied', tieLen: 'waist', bowStyle: 'butterfly', cravatStyle: 'ascot',
  // hair
  scrunchieSize: 'regular', bowType: 'loop', bowMount: 'clip', bowW: '', tails: true, ribbonMm: '', headbandStyle: 'flat', headbandBack: 'elastic', scarfSize: 'medium', hemFinish: 'rolled',
  // styling
  suspStyle: 'Y', suspEnds: 'buttons', suspW: '', garterStyle: 'ruffled', sashStyle: 'waist', sashW: '',
  // shoes
  toeShape: 'round', soleMake: 'card', shoeClosure: 'snap', sandalStyle: 'ankle', shoeEase: '', shoeLining: true
};
const ITEM_DEFAULTS = {
  tote: { bodyCon: 'boxed', handles: 'two', handleDrop: 'shoulder', closure: 'magnet', bagShape: 'rectangle' },
  shoulder: { bodyCon: 'band', handles: 'shoulder', carry: 'waist', closure: 'zip', bagShape: 'rounded' },
  crossbody: { bodyCon: 'band', handles: 'adjustable', carry: 'hip', closure: 'magnet', flap: 'rounded', flapLen: 'long', bagShape: 'rounded', attach: 'rings' },
  messenger: { bodyCon: 'band', handles: 'adjustable', carry: 'hip', closure: 'magnet', flap: 'straight', flapLen: 'full', attach: 'rings' },
  satchel: { bodyCon: 'band', handles: 'top', closure: 'buckles', flap: 'rounded', flapLen: 'long', interfacing: 'fusible + foam' },
  backpack: { bodyCon: 'band', handles: 'backpack', closure: 'zip', bagShape: 'rounded all', attach: 'rings' },
  drawstring: { bodyCon: 'flat', handles: 'none', closure: 'casing', topFinish: 'lining', interfacing: 'none' },
  bucket: { bodyCon: 'round', handles: 'shoulder', carry: 'waist', closure: 'eyelets', interfacing: 'fusible' },
  baguette: { bodyCon: 'band', handles: 'shoulder', carry: 'waist', closure: 'magnet', flap: 'straight', flapLen: 'half', bagShape: 'rounded', handleDrop: 'shoulder' },
  minibag: { bodyCon: 'band', handles: 'top', closure: 'zip', bagShape: 'dome', interfacing: 'fusible + foam' },
  tophandle: { bodyCon: 'sides', handles: 'top', closure: 'magnet', flap: 'curved', flapLen: 'half', bagShape: 'trapezoid', interfacing: 'fusible + foam', baseInsert: true },
  hobo: { bodyCon: 'band', handles: 'shoulder', carry: 'waist', closure: 'magnet', bagShape: 'crescent', gather: 'none', interfacing: 'none' },
  duffel: { bodyCon: 'barrel', handles: 'two', handleDrop: 'hand', closure: 'zip', interfacing: 'fusible' },
  pouch: { bodyCon: 'flat', handles: 'wrist', closure: 'zip', interfacing: 'fusible' },
  beltbag: { bodyCon: 'band', handles: 'beltstrap', closure: 'zip', bagShape: 'half-moon', attach: 'rings' },
  buckethat: { crownTaper: 'slight', brimShape: 'droop', brimEdge: 'topstitched', stiffness: 'medium', lining: 'yes' },
  cap: { panels: '6', capBack: 'snapback', topButton: true, eyelets: true, stiffness: 'medium', lining: 'no' },
  beret: { stiffness: 'soft', lining: 'yes', topButton: false },
  bonnet: { ties: true, bonnetFrill: true, stiffness: 'medium', lining: 'yes' },
  newsboy: { panels: '8', topButton: true, stiffness: 'soft', lining: 'yes' },
  bakerboy: { panels: '8', topButton: true, stiffness: 'soft', lining: 'yes' },
  flatcap: { stiffness: 'medium', lining: 'yes', topButton: false },
  sunhat: { brimShape: 'slight', brimEdge: 'wired', crownTaper: 'slight', hatBand: 'ribbon', hatBow: true, stiffness: 'stiff', lining: 'yes' },
  sailor: { brimShape: 'up', crownTaper: 'slight', stiffness: 'medium', lining: 'no' },
  trapper: { earFlaps: true, ties: true, frontFlap: 'up', lining: 'yes', stiffness: 'soft' },
  witch: { brimShape: 'flat', brimEdge: 'wired', tipBend: true, hatBand: 'ribbon', stiffness: 'stiff', lining: 'no' },
  cloche: { panels: '6', brimShape: 'deep', hatBand: 'ribbon', hatBow: true, stiffness: 'medium', lining: 'yes' },
  pillbox: { crownTaper: 'none', stiffness: 'stiff', lining: 'yes', brimShape: 'flat' },
  peaked: { crownTaper: 'none', stiffness: 'stiff', hatBand: 'cord', lining: 'yes' },
  tulip: { panels: '6', brimShape: 'droop', brimEdge: 'topstitched', stiffness: 'soft', lining: 'yes' },
  hood: { lining: 'yes', ties: true, hoodFit: 'easy', interfacing: 'none' },
  balaclava: { lining: 'no', hoodFit: 'snug', interfacing: 'none' },
  belt: { beltClosure: 'pin buckle', beltMake: 'folded', beltPos: 'waist' },
  corsetbelt: { beltClosure: 'lace-up', beltPos: 'waist', boning: true, corsetShape: 'pointed', lining: 'yes' },
  obi: { beltClosure: 'ties', obiTie: 'ties', beltPos: 'waist' },
  utilitybelt: { beltClosure: 'slide buckle', beltPos: 'hip', pouches: 2 },
  waistharness: { beltClosure: 'pin buckle', beltPos: 'waist', beltMake: 'single', ringType: 'O-ring' },
  chestharness: { beltClosure: 'pin buckle', beltMake: 'single', ringType: 'O-ring', harnessStyle: 'collar' },
  thighharness: { beltClosure: 'pin buckle', beltMake: 'single', ringType: 'D-ring', thighPos: 'mid thigh' },
  choker: { neckClosure: 'snap', chokerStyle: 'plain', lining: 'no' },
  tie: { tieMake: 'pretied', tieStyle: 'classic', interfacing: 'fusible' },
  bowtie: { tieMake: 'pretied', bowStyle: 'butterfly', interfacing: 'fusible' },
  cravat: { cravatStyle: 'ascot', neckClosure: 'snap', interfacing: 'none' },
  scrunchie: {}, hairbow: { bowType: 'loop', bowMount: 'clip', interfacing: 'fusible' }, ribbonbow: { bowType: 'loop', bowMount: 'clip' },
  headband: { headbandStyle: 'flat', headbandBack: 'elastic' }, bandana: { hemFinish: 'rolled' }, kerchief: { hemFinish: 'rolled', ties: true }, headscarf: { hemFinish: 'rolled', scarfSize: 'medium' },
  suspenders: { suspStyle: 'Y', suspEnds: 'buttons', beltMake: 'folded' }, garters: { garterStyle: 'ruffled', thighPos: 'mid thigh' }, sash: { sashStyle: 'waist' },
  slippers: { soleMake: 'card', shoeLining: true }, flats: { soleMake: 'card', shoeLining: true }, maryjanes: { soleMake: 'card', shoeClosure: 'snap', shoeLining: true },
  sandals: { soleMake: 'card', sandalStyle: 'ankle', shoeClosure: 'buckle', shoeLining: false }, espadrilles: { soleMake: 'cord', shoeLining: false },
  flatcollar: { interfacing: 'none' }, sailorcollar: { interfacing: 'none' }, rufflecollar: { interfacing: 'none' }, shirtcollar: { interfacing: 'fusible' }, dickey: { interfacing: 'none' }, cuffs: { interfacing: 'fusible' },
  halfapron: {}, bibapron: { interfacing: 'none' }, maidapron: { interfacing: 'none', apronFull: 'full', apronHem: 'ruffle', apronLace: true, bibShape: 'rounded', apronStraps: 'cross-back', frillStraps: true, bowSize: 'big', apronShape: 'rounded', apronPockets: 'none' }, pinafore: { apronFull: 'flat' }, tabard: {},
  bootcovers: { legOver: 'over shoes' }, spats: { legOver: 'over shoes', legLined: true }, bootcuffs: { legFabric: 'stretch', legOver: 'over shoes' }, anklecuffs: { legFabric: 'woven', legOver: 'bare foot / socks' }
};
// Style presets per item — they switch on components you can then change.
const ACC_STYLES = {
  bootcovers: { 'knee-high boot covers': {}, 'thigh-high boot covers': { bootLen: 'thigh-high', legFabric: 'stretch', bootClose: 'none' }, 'ankle boot covers': { bootLen: 'ankle boot' },
    'faux leather lace-up boots': { legFabric: 'faux leather', bootClose: 'lacing', styleTags: ['gothic', 'punk'] }, 'cosplay boot covers': { legFabric: 'stretch', bootClose: 'zip', styleTags: ['fantasy'] },
    'fur-topped winter boots': { bootLen: 'mid-calf', bootTop: 'faux-fur trim', styleTags: ['cosy'] }, 'slouch boots': { bootLen: 'mid-calf', bootTop: 'fold-down cuff' } },
  spats: { 'classic spats': {}, 'felt spats': { legFabric: 'faux leather', legLined: false }, 'mid-calf gaiters': { spatLen: 'mid-calf' }, 'lace-up knee gaiters': { spatLen: 'knee', spatClose: 'lacing', styleTags: ['fantasy', 'military'] } },
  bootcuffs: { 'knit boot cuffs': {}, 'cable-knit boot toppers': { bootCuffStyle: 'cable knit', styleTags: ['cosy'] }, 'lace boot cuffs': { bootCuffStyle: 'lace ruffle', legFabric: 'woven', styleTags: ['romantic'] }, 'faux fur boot cuffs': { bootCuffStyle: 'faux fur', styleTags: ['cosy'] } },
  anklecuffs: { 'ruffle ankle cuffs': {}, 'lolita ankle cuffs': { ankleCuffStyle: 'double ruffle', ankleBow: true, ankleClose: 'ribbon tie', styleTags: ['cute', 'romantic'] }, 'lace ankle cuffs': { ankleCuffStyle: 'lace ruffle', ankleClose: 'elastic' } },
  halfapron: { 'gathered half apron': {}, 'café apron': { apronLen: 'short', apronFull: 'flat', apronPockets: 'two', styleTags: ['workwear'] }, 'frilly half apron': { apronShape: 'rounded', apronHem: 'ruffle', apronLace: true, apronPockets: 'none', styleTags: ['cute', 'cottagecore'] },
    'waitress apron': { apronLen: 'short', apronShape: 'curved', apronHem: 'ruffle', apronPockets: 'one', styleTags: ['retro'] }, 'pleated half apron': { apronFull: 'pleated' }, 'scalloped apron': { apronShape: 'scalloped', apronFull: 'flat', styleTags: ['cute'] } },
  bibapron: { 'kitchen / chef apron': { apronFull: 'flat', apronPockets: 'two', styleTags: ['workwear'] }, 'cottagecore bib apron': { bibShape: 'rounded', apronStraps: 'cross-back', apronHem: 'lace', styleTags: ['cottagecore'] },
    'heart bib apron': { bibShape: 'heart', apronPockets: 'heart', apronHem: 'ruffle', styleTags: ['cute', 'kawaii'] }, 'artist / workshop apron': { apronFull: 'flat', apronStraps: 'cross-back', apronPockets: 'two', styleTags: ['utility'] } },
  maidapron: { 'classic maid apron': {}, 'lolita apron': { bibShape: 'heart', apronHem: 'double ruffle', styleTags: ['cute', 'romantic'] },
    'Victorian maid apron': { apronLen: 'long', apronShape: 'rectangle', bibShape: 'rectangle', styleTags: ['vintage'] }, 'café maid apron': { apronLen: 'short', bibShape: 'scalloped', styleTags: ['kawaii'] } },
  pinafore: { 'Japanese cross-back apron': {}, 'long pinafore apron': { apronLen: 'long' }, 'short pinafore': { apronLen: 'short', apronPockets: 'none' } },
  tabard: { 'simple tabard': {}, 'knight / medieval tabard': { tabardHem: 'pointed', tabardTie: 'belt', styleTags: ['fantasy'] }, 'work tabard': { apronLen: 'short', tabardNeck: 'V', styleTags: ['workwear'] } },
  flatcollar: { 'Peter Pan collar': {}, 'lace-edged Peter Pan': { collarEdge: 'lace edging', styleTags: ['cute', 'romantic'] }, 'pointed collar': { collarShape: 'pointed' }, 'scalloped collar': { collarShape: 'scalloped', styleTags: ['cute'] },
    'Bertha collar': { collarShape: 'Bertha', styleTags: ['vintage'] }, 'lace Bertha': { collarShape: 'Bertha', collarEdge: 'all lace', styleTags: ['vintage', 'romantic'] }, 'ruffle-edged collar': { collarEdge: 'ruffle edge', styleTags: ['cottagecore'] },
    'piped collar': { collarEdge: 'piping', styleTags: ['preppy'] }, 'snap-on collar': { collarFasten: 'neckband + snap' } },
  sailorcollar: { 'classic sailor collar': {}, 'school uniform sailor collar': { sailorStripes: '1', sailorBow: true, styleTags: ['preppy', 'academia'], occasion: ['school'] }, 'plain sailor collar': { sailorStripes: '0', sailorBow: false }, 'lace sailor collar': { collarEdge: 'lace edging', sailorStripes: '0', styleTags: ['romantic'] } },
  rufflecollar: { 'ruffle collar': {}, 'double ruffle collar': { ruffleTiers: '2' }, 'Elizabethan ruff': { ruffleTiers: '3', ruffleFull: 'full', styleTags: ['fantasy', 'vintage'] }, 'lace ruffle collar': { collarEdge: 'lace edging', styleTags: ['romantic', 'coquette'] } },
  shirtcollar: { 'classic false collar': {}, 'rounded club collar': { shirtPoint: 'rounded', styleTags: ['preppy', 'academia'] }, 'button-down collar': { shirtPoint: 'button-down' } },
  dickey: { 'shirt-front dickey': {}, 'pintuck dickey': { dickeyFront: 'pintucks', styleTags: ['vintage'] }, 'jabot dickey': { dickeyFront: 'jabot ruffles', styleTags: ['elegant', 'fantasy'] }, 'Peter Pan dickey': { dickeyCollar: 'Peter Pan', dickeyFront: 'plain', styleTags: ['cute'] } },
  cuffs: { 'band cuffs': {}, 'French cuffs': { cuffStyle: 'French (fold-back)', cuffClose: 'button', styleTags: ['formal'] }, 'gauntlet cuffs': { cuffStyle: 'flared gauntlet', styleTags: ['fantasy'] }, 'ruffle cuffs': { cuffStyle: 'ruffle', collarEdge: 'lace edging', styleTags: ['romantic'] },
    'lolita wrist cuffs': { cuffStyle: 'lolita wrist cuff', cuffClose: 'ribbon tie', collarEdge: 'lace edging', styleTags: ['cute', 'romantic'] }, 'elastic frill cuffs': { cuffStyle: 'ruffle', cuffClose: 'elastic (pull-on)' } },
  tote: { 'market tote': { bodyCon: 'boxed', handleDrop: 'shoulder', closure: 'none', interfacing: 'none' }, 'boxy tote with pocket': { bodyCon: 'boxed', bagPockets: ['front patch pocket', 'inside slip pocket'], closure: 'magnet' }, 'beach tote': { bagSize: 'large', bodyCon: 'boxed', closure: 'none', occasion: ['beach'] }, 'zip tote': { closure: 'zip' }, 'flat book bag': { bodyCon: 'flat', closure: 'none', interfacing: 'none' } },
  shoulder: { 'classic shoulder bag': {}, 'flap shoulder bag': { flap: 'rounded', flapLen: 'long', closure: 'magnet' }, 'slouchy shoulder bag': { bagShape: 'crescent', gather: '2 pleats', interfacing: 'none' } },
  crossbody: { 'camera bag': { bodyCon: 'band', flap: 'none', closure: 'zip', bagShape: 'rounded all' }, 'flap crossbody': {}, 'phone pouch': { bagSize: 'small', bodyCon: 'flat', flap: 'envelope', flapLen: 'half' } },
  messenger: { 'school messenger': { styleTags: ['preppy'] }, 'utility messenger': { bagPockets: ['front patch pocket'], closure: 'buckles', styleTags: ['utility'] } },
  satchel: { 'school satchel': { closure: 'buckles', handles: 'top', styleTags: ['academia'] }, 'cartable (backpack straps)': { handles: 'backpack', closure: 'buckles' } },
  backpack: { 'zip-around backpack': { bodyCon: 'band', closure: 'zip', bagShape: 'rounded all' }, 'flap rucksack': { bodyCon: 'round', closure: 'eyelets', flap: 'rounded', flapLen: 'half', bagShape: 'rectangle' }, 'drawstring backpack': { bodyCon: 'flat', closure: 'casing', handles: 'backpack', interfacing: 'none', lining: 'no', topFinish: 'hem' } },
  drawstring: { 'lined drawstring pouch': {}, 'gym sack': { handles: 'backpack', bagSize: 'large' }, 'boxed drawstring': { bodyCon: 'boxed' } },
  bucket: { 'eyelet bucket bag': { closure: 'eyelets' }, 'casing bucket bag': { closure: 'casing' }, 'open bucket': { closure: 'none', handles: 'two', handleDrop: 'arm' } },
  baguette: { 'classic baguette': {}, 'zip baguette': { flap: 'none', closure: 'zip' } },
  minibag: { 'frame purse': { closure: 'frame', bodyCon: 'band', bagShape: 'dome' }, 'mini zip bag': { closure: 'zip', bagShape: 'rounded' }, 'bowling bag': { bodyCon: 'band', bagShape: 'dome', closure: 'zip', handles: 'two', handleDrop: 'hand' } },
  tophandle: { 'Kelly-style flap': { flap: 'straight', flapLen: 'half', closure: 'turnlock', bagShape: 'trapezoid' }, 'curved flap': { flap: 'curved' }, 'doctor bag': { flap: 'none', closure: 'frame', bagShape: 'trapezoid' } },
  hobo: { 'slouchy hobo': { gather: 'gathered', interfacing: 'none' }, 'structured hobo': { gather: 'none', interfacing: 'fusible' } },
  duffel: { 'gym duffel': {}, 'travel barrel bag': { handles: 'two', bagPockets: ['front patch pocket'] } },
  pouch: { 'zip pouch': { closure: 'zip', flap: 'none' }, 'envelope clutch': { closure: 'magnet', flap: 'envelope', flapLen: 'long', handles: 'none' }, 'boxy cosmetic bag': { bodyCon: 'boxed', closure: 'zip' } },
  beltbag: { 'fanny pack': { handles: 'beltstrap' }, 'chest sling': { handles: 'adjustable', carry: 'waist' } },
  buckethat: { 'reversible bucket hat': { reversible: true, lining: 'yes' }, 'fisherman bucket': { brimShape: 'deep', crownTaper: 'strong' } },
  cap: { 'snapback': { capBack: 'snapback' }, 'trucker cap': { capBack: 'snapback', eyelets: false, styleTags: ['streetwear'] }, 'dad cap (soft)': { stiffness: 'soft', capBack: 'snapback' } },
  beret: { 'classic beret': {}, 'big slouchy beret': { stiffness: 'soft' } },
  bonnet: { 'Victorian bonnet': { bonnetFrill: false, brimW: '' }, 'baby bonnet': { bonnetFrill: true } },
  newsboy: { 'newsboy (8 panel)': { panels: '8' } }, bakerboy: { 'baker-boy': {} },
  flatcap: { 'driver cap': {} },
  sunhat: { 'garden hat': { brimShape: 'slight' }, 'floppy wide brim': { brimShape: 'droop', stiffness: 'medium' }, 'boater': { brimShape: 'flat', crownTaper: 'none', hatBand: 'ribbon', hatBow: false } },
  sailor: { 'dixie cup': {} },
  trapper: { 'ushanka': { frontFlap: 'up' }, 'aviator': { frontFlap: 'down' } },
  witch: { 'classic witch hat': {}, 'floppy witch hat': { stiffness: 'soft', brimShape: 'slight' } },
  cloche: { '1920s cloche': {} },
  pillbox: { 'pillbox': { crownH: '' }, 'fur / Cossack hat': { crownTaper: 'none', stiffness: 'medium', season: ['winter'] } },
  peaked: { 'Breton / fisherman cap': { hatBand: 'cord', stiffness: 'medium' }, 'military / officer cap': { stiffness: 'stiff', hatBand: 'cord', styleTags: ['military'] } },
  tulip: { 'tulip hat': {} },
  hood: { 'pixie hood': {}, 'cape hood': { ties: true } }, balaclava: { 'balaclava': {} },
  belt: { 'jeans belt': { beltPos: 'high hip', beltClosure: 'pin buckle' }, 'waist belt': { beltPos: 'waist' }, 'tie belt': { beltClosure: 'ties' } },
  corsetbelt: { 'waist cincher': {}, 'underbust corset belt': { beltPos: 'waist', corsetShape: 'curved' } },
  obi: { 'obi with ties': { obiTie: 'ties' }, 'obi bow back': { obiTie: 'bow' } },
  utilitybelt: { 'two-pouch utility belt': { pouches: 2 }, 'adventurer belt': { pouches: 3 } },
  waistharness: { 'double belt harness': { waistHarness: 'double' }, 'garter-strap harness': { waistHarness: 'suspender' } },
  chestharness: { 'chest harness': { harnessStyle: 'collar' }, 'body harness (chest + waist)': { withWaist: true, harnessStyle: 'collar' }, 'X-back harness': { harnessStyle: 'xback' } },
  thighharness: { 'thigh strap': { toBelt: false }, 'leg harness (to the belt)': { toBelt: true } },
  choker: { 'velvet choker': {}, 'lace-up choker': { chokerStyle: 'lace-up' }, 'ring choker': { chokerStyle: 'ring' } },
  tie: { 'school tie': { tieStyle: 'classic' }, 'skinny tie': { tieStyle: 'skinny' } },
  bowtie: { 'pre-tied bow tie': { tieMake: 'pretied' }, 'self-tie bow tie': { tieMake: 'self' } },
  cravat: { 'ascot': { cravatStyle: 'ascot' }, 'jabot': { cravatStyle: 'jabot' } },
  hairbow: { 'classic bow clip': {}, 'lolita bow': { bowType: 'lolita', bowMount: 'clip' } },
  suspenders: { 'Y-back suspenders': {}, 'X-back suspenders': { suspStyle: 'X' } },
  garters: { 'ruffled garter': {}, 'garter belt': { garterStyle: 'belt' } },
  sash: { 'waist sash': {}, 'shoulder sash': { sashStyle: 'shoulder' } },
  maryjanes: { 'classic Mary Janes': {}, 'T-bar Mary Janes': { sandalStyle: 'tbar' } },
  sandals: { 'ankle-strap sandals': { sandalStyle: 'ankle' }, 'slides': { sandalStyle: 'slide', shoeClosure: 'elastic' }, 'T-bar sandals': { sandalStyle: 'tbar' } }
};

// ---- visibility helpers
const AR = {
  bag: (o) => isCat(o, 'bag'), hat: (o) => isCat(o, 'hat'), belt: (o) => isCat(o, 'belt'), neck: (o) => isCat(o, 'neck'),
  hair: (o) => isCat(o, 'hair'), styling: (o) => isCat(o, 'styling'), shoe: (o) => isCat(o, 'shoe'), collar: (o) => isCat(o, 'collar'), apron: (o) => isCat(o, 'apron'), leg: (o) => isCat(o, 'leg'),
  is: (...ids) => (o) => ids.includes(o.item),
  strapItems: ['belt', 'waistharness', 'chestharness', 'thighharness', 'utilitybelt', 'suspenders'],
  gored: ['cap', 'newsboy', 'bakerboy', 'cloche', 'tulip'],
  brimmed: ['buckethat', 'sunhat', 'sailor', 'witch', 'cloche', 'tulip', 'pillbox'],
  visored: ['cap', 'newsboy', 'bakerboy', 'flatcap', 'peaked']
};
function bagClosures(o) {
  const all = ACH.closure;
  const c = o.bodyCon;
  return all.filter(x => {
    const k = x[0];
    if (k === 'frame') return ['flat', 'band', 'boxed'].includes(c) && ['minibag', 'pouch', 'tophandle', 'shoulder', 'crossbody'].includes(o.item);
    if (k === 'zip') return ['flat', 'boxed', 'band', 'barrel'].includes(c);
    if (k === 'zippanel') return ['band', 'sides', 'boxed', 'round'].includes(c);
    if (k === 'buckles' || k === 'turnlock') return o.flap !== 'none';
    if (k === 'casing' || k === 'eyelets') return o.flap === 'none' || ['round', 'flat', 'boxed'].includes(c);
    return true;
  });
}
const ACC_DRAWERS = [
  { id: 'item', title: 'Doll & accessory', fields: [
    { id: 'doll', label: 'Doll', type: 'doll' },
    { id: 'cat', label: 'Category', type: 'select', choices: CATS },
    { id: 'item', label: 'Accessory', type: 'select', choices: (o) => ITEMS.filter(i => i[2] === o.cat).map(i => [i[0], i[1]]) },
    { id: 'style', label: 'Style (sets up the components — change anything after)', type: 'select', choices: (o) => [['', '— none / custom —']].concat(Object.keys(ACC_STYLES[o.item] || {})) },
    { id: 'name', label: 'Pattern name', type: 'text', hint: 'optional — used on every piece label' }
  ] },
  // ---------------- bags
  { id: 'bagsize', title: 'Size & shape', show: AR.bag, fields: [
    { id: 'bagSize', label: 'Size (to the doll\'s scale)', type: 'select', choices: ACH.bagSize, readout: 'size' },
    { id: 'bagShape', label: 'Shape', type: 'select', choices: (o) => o.bodyCon === 'round' || o.bodyCon === 'barrel' ? ACH.bagShape.filter(s => ['rectangle', 'rounded all'].includes(s[0])) : o.bodyCon === 'boxed' || o.bodyCon === 'sides' ? ACH.bagShape.filter(s => ['rectangle', 'trapezoid'].includes(s[0])) : ACH.bagShape },
    { id: 'bagW', label: 'Width (cm)', type: 'number', placeholder: 'auto' },
    { id: 'bagH', label: 'Height (cm)', type: 'number', placeholder: 'auto' },
    { id: 'bagD', label: 'Depth / gusset (cm)', type: 'number', placeholder: 'auto', show: (o) => o.bodyCon !== 'flat' },
    { id: 'taperCm', label: 'Taper each side at the top (cm)', type: 'number', placeholder: 'auto', show: (o) => o.bagShape === 'trapezoid' },
    { id: 'cornerCm', label: 'Corner radius (cm)', type: 'number', placeholder: 'auto', show: (o) => ['rounded', 'rounded all'].includes(o.bagShape) }
  ] },
  { id: 'bagbody', title: 'Body & gusset', show: AR.bag, fields: [
    { id: 'bodyCon', label: 'Construction', type: 'select', choices: (o) => o.item === 'duffel' ? ACH.bodyCon.filter(c => ['barrel', 'band'].includes(c[0])) : ACH.bodyCon.filter(c => c[0] !== 'barrel'), hint: 'How the depth is built: boxed corners are the quickest, a gusset band gives crisp sides.' },
    { id: 'bodyCut', label: 'Body pieces', type: 'select', choices: ACH.bodyCut, show: (o) => ['flat', 'boxed'].includes(o.bodyCon) && !['trapezoid', 'crescent', 'dome', 'half-moon'].includes(o.bagShape) && o.bagShape !== 'rounded all' },
    { id: 'gather', label: 'Gathers / pleats at the top', type: 'select', choices: ACH.gather, show: (o) => ['flat', 'boxed', 'band', 'round'].includes(o.bodyCon) && o.closure !== 'zip' },
    { id: 'bagPockets', label: 'Pockets', type: 'multi', choices: ACH.bagPockets }
  ] },
  { id: 'bagtop', title: 'Opening, flap & closure', show: AR.bag, fields: [
    { id: 'topFinish', label: 'Top edge', type: 'select', choices: (o) => o.lining === 'yes' ? ACH.topFinish : ACH.topFinish.filter(x => x[0] !== 'lining') },
    { id: 'closure', label: 'Closure', type: 'select', choices: bagClosures },
    { id: 'zipType', label: 'Zipper', type: 'select', choices: ACH.zipType, show: (o) => ['zip', 'zippanel'].includes(o.closure) || (o.bodyCon === 'barrel') || o.bagPockets.includes('front zip pocket') },
    { id: 'frameW', label: 'Frame width (cm)', type: 'number', placeholder: 'auto', show: (o) => o.closure === 'frame', hint: 'Measure your frame from hinge to hinge across the top.' },
    { id: 'frameH', label: 'Frame height (cm)', type: 'number', placeholder: 'auto', show: (o) => o.closure === 'frame', hint: 'Top of the clasp down to the hinge.' },
    { id: 'flap', label: 'Flap', type: 'select', choices: ACH.flap, show: (o) => !['casing', 'eyelets', 'zip', 'zippanel', 'frame'].includes(o.closure) || ['round'].includes(o.bodyCon) },
    { id: 'flapLen', label: 'Flap length', type: 'select', choices: ACH.flapLen, show: (o) => o.flap !== 'none' }
  ] },
  { id: 'baghandles', title: 'Handles & straps', show: AR.bag, fields: [
    { id: 'handles', label: 'Handles / strap', type: 'select', choices: ACH.handles, readout: 'strap' },
    { id: 'handleDrop', label: 'Handle length', type: 'select', choices: ACH.handleDrop, show: (o) => o.handles === 'two' },
    { id: 'carry', label: 'Where the bag hangs', type: 'select', choices: ACH.carry, show: (o) => ['shoulder', 'crossbody', 'adjustable'].includes(o.handles) },
    { id: 'strapW', label: 'Strap width (cm)', type: 'number', placeholder: 'auto', show: (o) => o.handles !== 'none' && o.handles !== 'chain' },
    { id: 'strapLen', label: 'Strap / handle length (cm)', type: 'number', placeholder: 'auto', show: (o) => o.handles !== 'none' && o.handles !== 'chain' },
    { id: 'strapMake', label: 'Strap made from', type: 'select', choices: ACH.strapMake, show: (o) => o.handles !== 'none' && o.handles !== 'chain' },
    { id: 'attach', label: 'Attached with', type: 'select', choices: (o) => ['adjustable', 'backpack', 'chain'].includes(o.handles) ? ACH.attach.filter(a => a[0] === 'rings') : ACH.attach, show: (o) => o.handles !== 'none' && o.handles !== 'beltstrap' },
    { id: 'hwSize', label: 'Rings / slider / buckle size (inner width)', type: 'select', choices: ACH.hwSize, hint: 'Straps are sized to run through it. Auto picks a size you can buy that suits the bag.' }
  ] },
  { id: 'bagmat', title: 'Lining & structure', show: AR.bag, fields: [
    { id: 'construction', label: 'Construction', type: 'select', choices: ACH.construction },
    { id: 'lining', label: 'Lining', type: 'select', choices: [['yes', 'lined'], ['no', 'unlined']], show: (o) => o.construction === 'turned' },
    { id: 'interfacing', label: 'Structure', type: 'select', choices: ACH.interfacing },
    { id: 'baseInsert', label: 'Stiff base insert (card / plastic)', type: 'check', show: (o) => o.bodyCon !== 'flat' },
    { id: 'bagFeet', label: 'Bag feet (mini studs)', type: 'check', show: (o) => ['sides', 'boxed', 'band', 'round'].includes(o.bodyCon) && o.baseInsert }
  ] },
  // ---------------- hats
  { id: 'hatfit', title: 'Fit & crown', show: AR.hat, fields: [
    { id: 'hatEase', label: 'Ease at the head band (cm)', type: 'number', placeholder: 'auto', hint: 'Added to the head-over-wig measurement.', readout: 'band' },
    { id: 'crownH', label: 'Crown height (cm)', type: 'number', placeholder: 'auto', show: (o) => !['beret', 'hood', 'balaclava', 'trapper'].includes(o.item) },
    { id: 'crownShape', label: 'Head shape', type: 'select', choices: ACH.crownShape, show: (o) => ['buckethat', 'sunhat', 'sailor', 'pillbox', 'peaked', 'beret'].includes(o.item) },
    { id: 'crownTaper', label: 'Crown sides', type: 'select', choices: ACH.crownTaper, show: (o) => ['buckethat', 'sunhat', 'sailor', 'pillbox'].includes(o.item) },
    { id: 'panels', label: 'Crown panels', type: 'select', choices: (o) => o.item === 'cap' ? ACH.panels.filter(p => p[0] !== '8') : ACH.panels, show: (o) => AR.gored.includes(o.item) },
    { id: 'hoodFit', label: 'Fit', type: 'select', choices: ACH.hoodFit, show: AR.is('hood', 'balaclava') }
  ] },
  { id: 'hatbrim', title: 'Brim & visor', show: (o) => AR.hat(o) && (AR.brimmed.includes(o.item) || AR.visored.includes(o.item) || ['trapper', 'bonnet'].includes(o.item)), fields: [
    { id: 'brimW', label: 'Brim width (cm)', type: 'number', placeholder: 'auto', show: (o) => AR.brimmed.includes(o.item) || o.item === 'bonnet' || o.item === 'trapper' },
    { id: 'brimShape', label: 'Brim', type: 'select', choices: (o) => o.item === 'sailor' ? ACH.brimShape.filter(b => b[0] === 'up') : o.item === 'witch' ? ACH.brimShape.filter(b => ['flat', 'slight'].includes(b[0])) : o.item === 'pillbox' ? [['flat', 'none'], ['up', 'turned-up cuff (fur hat)']] : ACH.brimShape.filter(b => b[0] !== 'up'), show: (o) => AR.brimmed.includes(o.item) },
    { id: 'brimEdge', label: 'Brim edge', type: 'select', choices: ACH.brimEdge, show: (o) => AR.brimmed.includes(o.item) && o.item !== 'pillbox' },
    { id: 'visorD', label: 'Visor depth (cm)', type: 'number', placeholder: 'auto', show: (o) => AR.visored.includes(o.item) },
    { id: 'frontFlap', label: 'Front flap', type: 'select', choices: ACH.frontFlap, show: AR.is('trapper') }
  ] },
  { id: 'hatdetails', title: 'Details', show: AR.hat, fields: [
    { id: 'capBack', label: 'Back', type: 'select', choices: ACH.capBack, show: AR.is('cap') },
    { id: 'topButton', label: 'Top button', type: 'check', show: AR.is('cap', 'newsboy', 'bakerboy', 'tulip', 'cloche') },
    { id: 'eyelets', label: 'Vent eyelets', type: 'check', show: AR.is('cap') },
    { id: 'hatBand', label: 'Hat band', type: 'select', choices: ACH.hatBand, show: (o) => ['buckethat', 'sunhat', 'witch', 'cloche', 'pillbox', 'peaked', 'tulip'].includes(o.item) },
    { id: 'hatBow', label: 'Bow', type: 'check', show: (o) => ['sunhat', 'cloche', 'buckethat', 'witch', 'bonnet', 'pillbox'].includes(o.item) },
    { id: 'ties', label: 'Chin ties', type: 'check', show: (o) => ['bonnet', 'sunhat', 'trapper', 'hood', 'buckethat'].includes(o.item) },
    { id: 'bonnetFrill', label: 'Frill around the face', type: 'check', show: AR.is('bonnet') },
    { id: 'tipBend', label: 'Bent tip', type: 'check', show: AR.is('witch') },
    { id: 'reversible', label: 'Reversible (lining is a second outer fabric)', type: 'check', show: AR.is('buckethat', 'tulip') }
  ] },
  { id: 'hatmat', title: 'Lining & structure', show: AR.hat, fields: [
    { id: 'lining', label: 'Lining', type: 'select', choices: [['yes', 'lined'], ['no', 'unlined']] },
    { id: 'stiffness', label: 'Stiffness', type: 'select', choices: ACH.stiffness, show: (o) => !['hood', 'balaclava'].includes(o.item) }
  ] },
  // ---------------- belts & harnesses
  { id: 'beltfit', title: 'Position & fit', show: (o) => AR.belt(o) || o.item === 'suspenders' || o.item === 'sash' || o.item === 'garters', fields: [
    { id: 'beltPos', label: 'Sits at', type: 'select', choices: (o) => o.item === 'corsetbelt' || o.item === 'obi' ? ['waist', 'high hip'] : ACH.beltPos, show: (o) => !['thighharness', 'chestharness', 'garters', 'suspenders'].includes(o.item) || (o.item === 'chestharness' && o.withWaist) || (o.item === 'garters' && o.garterStyle === 'belt') || o.item === 'suspenders', readout: 'belt' },
    { id: 'thighPos', label: 'Thigh strap at', type: 'select', choices: ACH.thighPos, show: (o) => o.item === 'thighharness' || o.item === 'garters' },
    { id: 'overClothes', label: 'Worn over clothes (adds ease)', type: 'check', show: (o) => o.item !== 'garters' },
    { id: 'beltW', label: 'Width (cm)', type: 'number', placeholder: 'auto' },
    { id: 'beltTail', label: 'Overlap / tail (cm)', type: 'number', placeholder: 'auto', show: (o) => ['belt', 'utilitybelt', 'waistharness', 'chestharness', 'thighharness'].includes(o.item) },
    { id: 'corsetH', label: 'Height at centre front (cm)', type: 'number', placeholder: 'auto', show: AR.is('corsetbelt', 'obi') },
    { id: 'corsetShape', label: 'Shape', type: 'select', choices: ACH.corsetShape, show: AR.is('corsetbelt') }
  ] },
  { id: 'beltmake', title: 'Construction & hardware', show: (o) => AR.belt(o) || o.item === 'suspenders', fields: [
    { id: 'beltMake', label: 'Straps made from', type: 'select', choices: ACH.beltMake, show: (o) => o.item !== 'corsetbelt' && o.item !== 'obi' },
    { id: 'beltClosure', label: 'Closure', type: 'select', choices: (o) => o.item === 'corsetbelt' ? ACH.beltClosure.filter(c => ['lace-up', 'hook', 'snap'].includes(c[0])) : o.item === 'obi' ? ACH.beltClosure.filter(c => ['ties', 'snap', 'velcro', 'hook'].includes(c[0])) : ACH.beltClosure.filter(c => c[0] !== 'lace-up'), show: (o) => o.item !== 'suspenders' },
    { id: 'holes', label: 'Number of holes', type: 'number', show: (o) => o.beltClosure === 'pin buckle' && !['corsetbelt', 'obi'].includes(o.item) },
    { id: 'hwSize', label: 'Buckle / ring size (inner width)', type: 'select', choices: ACH.hwSize, show: (o) => !['corsetbelt', 'obi'].includes(o.item) },
    { id: 'ringType', label: 'Rings', type: 'select', choices: ACH.ringType, show: AR.is('waistharness', 'chestharness', 'thighharness') },
    { id: 'boning', label: 'Boning channels', type: 'check', show: AR.is('corsetbelt') },
    { id: 'obiTie', label: 'Tie', type: 'select', choices: ACH.obiTie, show: AR.is('obi') },
    { id: 'pouches', label: 'Number of pouches', type: 'number', show: AR.is('utilitybelt') },
    { id: 'harnessStyle', label: 'Harness style', type: 'select', choices: ACH.harnessStyle, show: AR.is('chestharness') },
    { id: 'withWaist', label: 'Add a waist strap (body harness)', type: 'check', show: AR.is('chestharness') },
    { id: 'waistHarness', label: 'Harness style', type: 'select', choices: ACH.waistHarness, show: AR.is('waistharness') },
    { id: 'toBelt', label: 'Connect to a waist belt', type: 'check', show: AR.is('thighharness') },
    { id: 'bothLegs', label: 'Both legs', type: 'check', show: AR.is('thighharness') },
    { id: 'suspStyle', label: 'Back', type: 'select', choices: ACH.suspStyle, show: AR.is('suspenders') },
    { id: 'suspEnds', label: 'Ends', type: 'select', choices: ACH.suspEnds, show: AR.is('suspenders') },
    { id: 'lining', label: 'Lining', type: 'select', choices: [['yes', 'lined'], ['no', 'unlined']], show: AR.is('corsetbelt', 'obi') },
    { id: 'interfacing', label: 'Structure', type: 'select', choices: ACH.interfacing, show: AR.is('corsetbelt', 'obi', 'belt') }
  ] },
  // ---------------- neck
  { id: 'neckopts', title: 'Style & fit', show: AR.neck, fields: [
    { id: 'chokerStyle', label: 'Choker style', type: 'select', choices: ACH.chokerStyle, show: AR.is('choker') },
    { id: 'chokerW', label: 'Width (cm)', type: 'number', placeholder: 'auto', show: AR.is('choker', 'cravat') },
    { id: 'neckClosure', label: 'Closure', type: 'select', choices: ACH.neckClosure, show: (o) => o.item === 'choker' || o.item === 'cravat' || ((o.item === 'tie' || o.item === 'bowtie') && o.tieMake === 'pretied') },
    { id: 'tieStyle', label: 'Tie width', type: 'select', choices: ACH.tieStyle, show: AR.is('tie') },
    { id: 'tieMake', label: 'Made as', type: 'select', choices: ACH.tieMake, show: AR.is('tie', 'bowtie'), hint: 'Pre-tied with a snap neckband is far easier to put on a doll.' },
    { id: 'tieLen', label: 'Length', type: 'select', choices: ACH.tieLen, show: AR.is('tie') },
    { id: 'bowStyle', label: 'Bow shape', type: 'select', choices: ACH.bowStyle, show: AR.is('bowtie') },
    { id: 'cravatStyle', label: 'Cravat style', type: 'select', choices: ACH.cravatStyle, show: AR.is('cravat') },
    { id: 'interfacing', label: 'Interfacing', type: 'select', choices: ACH.interfacing.slice(0, 2), show: AR.is('tie', 'bowtie', 'choker') }
  ] },
  // ---------------- hair
  { id: 'hairopts', title: 'Style & size', show: AR.hair, fields: [
    { id: 'scrunchieSize', label: 'Scrunchie', type: 'select', choices: ACH.scrunchieSize, show: AR.is('scrunchie') },
    { id: 'bowType', label: 'Bow', type: 'select', choices: (o) => o.item === 'ribbonbow' ? ACH.bowType.filter(b => ['loop', 'double'].includes(b[0])) : ACH.bowType, show: AR.is('hairbow', 'ribbonbow') },
    { id: 'bowW', label: 'Bow width (cm)', type: 'number', placeholder: 'auto', show: AR.is('hairbow', 'ribbonbow') },
    { id: 'ribbonMm', label: 'Ribbon width (mm)', type: 'number', placeholder: 'auto', show: AR.is('ribbonbow') },
    { id: 'tails', label: 'Tails', type: 'check', show: AR.is('hairbow', 'ribbonbow') },
    { id: 'bowMount', label: 'Attach to', type: 'select', choices: ACH.bowMount, show: AR.is('hairbow', 'ribbonbow') },
    { id: 'headbandStyle', label: 'Headband', type: 'select', choices: ACH.headbandStyle, show: AR.is('headband') },
    { id: 'headbandBack', label: 'Back', type: 'select', choices: ACH.headbandBack, show: AR.is('headband') },
    { id: 'scarfSize', label: 'Size', type: 'select', choices: ACH.scarfSize, show: AR.is('bandana', 'kerchief', 'headscarf') },
    { id: 'hemFinish', label: 'Edges', type: 'select', choices: ACH.hemFinish, show: AR.is('bandana', 'kerchief', 'headscarf') },
    { id: 'ties', label: 'Ties', type: 'check', show: AR.is('kerchief') },
    { id: 'interfacing', label: 'Interfacing', type: 'select', choices: ACH.interfacing.slice(0, 2), show: AR.is('hairbow', 'headband') }
  ] },
  // ---------------- other styling
  { id: 'stylopts', title: 'Style', show: (o) => o.item === 'garters' || o.item === 'sash', fields: [
    { id: 'garterStyle', label: 'Garter', type: 'select', choices: ACH.garterStyle, show: AR.is('garters') },
    { id: 'sashStyle', label: 'Sash', type: 'select', choices: ACH.sashStyle, show: AR.is('sash') },
    { id: 'sashW', label: 'Width (cm)', type: 'number', placeholder: 'auto', show: AR.is('sash') }
  ] },
  // ---------------- shoes
  { id: 'shoeopts', title: 'Shoe', show: AR.shoe, fields: [
    { id: 'toeShape', label: 'Toe', type: 'select', choices: ACH.toeShape },
    { id: 'shoeEase', label: 'Ease around the foot (cm)', type: 'number', placeholder: 'auto', readout: 'foot' },
    { id: 'soleMake', label: 'Sole', type: 'select', choices: (o) => o.item === 'espadrilles' ? ACH.soleMake : ACH.soleMake.filter(s => s[0] !== 'cord') },
    { id: 'sandalStyle', label: 'Straps', type: 'select', choices: (o) => o.item === 'maryjanes' ? ACH.sandalStyle.filter(s => ['ankle', 'tbar'].includes(s[0])).map(s => s[0] === 'ankle' ? ['ankle', 'single strap'] : s) : ACH.sandalStyle, show: AR.is('sandals', 'maryjanes') },
    { id: 'shoeClosure', label: 'Strap closure', type: 'select', choices: ACH.shoeClosure, show: AR.is('sandals', 'maryjanes') },
    { id: 'shoeLining', label: 'Lined upper', type: 'check', show: (o) => o.item !== 'sandals' },
    { id: 'construction', label: 'Upper fabric', type: 'select', choices: ACH.construction }
  ] },
  // ---------------- collars & cuffs
  { id: 'collaropts', title: 'Collar & cuff', show: AR.collar, fields: [
    { id: 'collarShape', label: 'Shape', type: 'select', choices: ACH.collarShape, show: AR.is('flatcollar') },
    { id: 'collarW', label: (o) => ({ flatcollar: 'Collar width (cm)', sailorcollar: 'Back flap depth (cm)', rufflecollar: 'Ruffle depth (cm)', shirtcollar: 'Collar depth (cm)' }[o.item] || 'Width (cm)'), type: 'number', placeholder: 'auto', show: AR.is('flatcollar', 'sailorcollar', 'rufflecollar', 'shirtcollar') },
    { id: 'collarEdge', label: 'Edge', type: 'select', choices: (o) => o.item === 'flatcollar' ? ACH.collarEdge : o.item === 'sailorcollar' ? ACH.collarEdge.filter(c => ['plain', 'lace edging', 'piping'].includes(c[0])) : ACH.collarEdge.filter(c => ['plain', 'lace edging'].includes(c[0])), show: AR.is('flatcollar', 'sailorcollar', 'rufflecollar', 'cuffs') },
    { id: 'collarFasten', label: 'Fastening', type: 'select', choices: ACH.collarFasten, show: AR.is('flatcollar', 'sailorcollar', 'rufflecollar') },
    { id: 'sailorStripes', label: 'Ribbon stripes', type: 'select', choices: ACH.sailorStripes, show: AR.is('sailorcollar') },
    { id: 'sailorBow', label: 'Sailor tie at the V', type: 'check', show: AR.is('sailorcollar') },
    { id: 'ruffleTiers', label: 'Layers', type: 'select', choices: ACH.ruffleTiers, show: AR.is('rufflecollar') },
    { id: 'ruffleFull', label: 'Fullness', type: 'select', choices: ACH.ruffleFull, show: AR.is('rufflecollar') },
    { id: 'shirtPoint', label: 'Collar points', type: 'select', choices: ACH.shirtPoint, show: AR.is('shirtcollar') },
    { id: 'dickeyFront', label: 'Front', type: 'select', choices: ACH.dickeyFront, show: AR.is('dickey') },
    { id: 'dickeyCollar', label: 'Collar', type: 'select', choices: ACH.dickeyCollar, show: AR.is('dickey') },
    { id: 'cuffStyle', label: 'Cuff style', type: 'select', choices: ACH.cuffStyle, show: AR.is('cuffs') },
    { id: 'cuffH', label: 'Cuff height (cm)', type: 'number', placeholder: 'auto', show: AR.is('cuffs') },
    { id: 'cuffClose', label: 'Closure', type: 'select', choices: ACH.cuffClose, show: AR.is('cuffs') },
    { id: 'interfacing', label: 'Interfacing', type: 'select', choices: ACH.interfacing.slice(0, 2), show: AR.is('flatcollar', 'shirtcollar', 'cuffs') }
  ] },
  // ---------------- aprons
  { id: 'apronopts', title: 'Apron', show: AR.apron, fields: [
    { id: 'apronLen', label: 'Length (below the waist)', type: 'select', choices: ACH.apronLen, readout: 'size' },
    { id: 'apronShape', label: 'Shape', type: 'select', choices: ACH.apronShape, show: AR.is('halfapron', 'bibapron', 'maidapron') },
    { id: 'apronFull', label: 'Fullness at the waist', type: 'select', choices: ACH.apronFull, show: AR.is('halfapron', 'bibapron', 'maidapron') },
    { id: 'apronHem', label: 'Sides & hem', type: 'select', choices: ACH.apronHem, show: AR.is('halfapron', 'bibapron', 'maidapron') },
    { id: 'apronLace', label: 'Lace on the ruffle', type: 'check', show: (o) => AR.is('halfapron', 'bibapron', 'maidapron')(o) && ['ruffle', 'double ruffle'].includes(o.apronHem) },
    { id: 'apronPockets', label: 'Pockets', type: 'select', choices: (o) => o.item === 'pinafore' ? ACH.apronPockets.filter(c => c[0] !== 'heart') : ACH.apronPockets, show: AR.is('halfapron', 'bibapron', 'maidapron', 'pinafore') },
    { id: 'bibShape', label: 'Bib shape', type: 'select', choices: ACH.bibShape, show: AR.is('bibapron', 'maidapron') },
    { id: 'apronStraps', label: 'Straps', type: 'select', choices: ACH.apronStraps, show: AR.is('bibapron', 'maidapron') },
    { id: 'frillStraps', label: 'Frilled straps (over the shoulders)', type: 'check', show: (o) => ['bibapron', 'maidapron'].includes(o.item) && o.apronStraps !== 'neck loop' },
    { id: 'bowSize', label: 'Bow at the back', type: 'select', choices: ACH.bowSize, show: AR.is('halfapron', 'bibapron', 'maidapron') },
    { id: 'tabardNeck', label: 'Neckline', type: 'select', choices: ACH.tabardNeck, show: AR.is('tabard') },
    { id: 'tabardHem', label: 'Hem', type: 'select', choices: ACH.tabardHem, show: AR.is('tabard') },
    { id: 'tabardTie', label: 'Sides', type: 'select', choices: ACH.tabardTie, show: AR.is('tabard') },
    { id: 'interfacing', label: 'Interfacing (bib)', type: 'select', choices: ACH.interfacing.slice(0, 2), show: AR.is('bibapron', 'maidapron') }
  ] },
  // ---------------- leg & boot
  { id: 'legopts', title: 'Leg & boot', show: AR.leg, fields: [
    { id: 'legFabric', label: 'Fabric', type: 'select', choices: (o) => o.item === 'anklecuffs' ? ACH.legFabric.filter(c => c[0] !== 'faux leather') : ACH.legFabric },
    { id: 'legOver', label: 'Worn', type: 'select', choices: ACH.legOver, show: AR.is('bootcovers', 'spats', 'bootcuffs'), hint: 'Over shoes adds the shoe\'s bulk and sole to the foot measurements.' },
    { id: 'bootLen', label: 'Height', type: 'select', choices: ACH.bootLen, show: AR.is('bootcovers'), readout: 'size' },
    { id: 'spatLen', label: 'Height', type: 'select', choices: ACH.spatLen, show: AR.is('spats'), readout: 'size' },
    { id: 'bootClose', label: 'Closure', type: 'select', choices: (o) => o.legFabric === 'stretch' ? ACH.bootClose : ACH.bootClose.filter(c => c[0] !== 'none'), show: AR.is('bootcovers') },
    { id: 'spatClose', label: 'Closure', type: 'select', choices: ACH.spatClose, show: AR.is('spats') },
    { id: 'bootTop', label: 'Top edge', type: 'select', choices: ACH.bootTop, show: AR.is('bootcovers') },
    { id: 'legLined', label: 'Lined', type: 'check', show: (o) => ['bootcovers', 'spats'].includes(o.item) && o.legFabric !== 'faux leather' },
    { id: 'cuffPos', label: 'For boots up to', type: 'select', choices: ACH.cuffPos, show: AR.is('bootcuffs') },
    { id: 'bootCuffStyle', label: 'Style', type: 'select', choices: ACH.bootCuffStyle, show: AR.is('bootcuffs') },
    { id: 'ankleCuffStyle', label: 'Style', type: 'select', choices: ACH.ankleCuffStyle, show: AR.is('anklecuffs') },
    { id: 'ankleClose', label: 'Closure', type: 'select', choices: ACH.ankleClose, show: AR.is('anklecuffs') },
    { id: 'ankleBow', label: 'Ribbon bow', type: 'check', show: AR.is('anklecuffs') },
    { id: 'cuffBandH', label: 'Band height (cm)', type: 'number', placeholder: 'auto', show: AR.is('bootcuffs', 'anklecuffs') }
  ] },
  // ---------------- common
  { id: 'finish', title: 'Seam allowance', fields: [
    { id: 'sa', label: 'Seam allowance', type: 'select', choices: ACH.sa },
    { id: 'saCm', label: 'Custom seam allowance (cm)', type: 'number', show: (o) => o.sa === 'custom' },
    { id: 'hemSa', label: 'Hem / turn-under allowance', type: 'select', choices: ACH.hemSa },
    { id: 'hemSaCm', label: 'Custom hem allowance (cm)', type: 'number', show: (o) => o.hemSa === 'custom' }
  ] },
  { id: 'tags', title: 'Tags', fields: [
    { id: 'styleTags', label: 'Style', type: 'multi', choices: ACH.styleTags },
    { id: 'season', label: 'Season', type: 'multi', choices: ACH.season },
    { id: 'occasion', label: 'Occasion', type: 'multi', choices: ACH.occasion }
  ] },
  { id: 'output', title: 'Printing & fabric', fields: [
    { id: 'paper', label: 'Paper', type: 'select', choices: ACH.paper },
    { id: 'fabricWidth', label: 'Fabric width (for the cutting layout)', type: 'select', choices: [['fat quarter', 'fat quarter (50 × 55 cm)'], ['110', '110 cm'], ['140', '140 cm'], ['150', '150 cm'], ['custom', 'custom']] },
    { id: 'fabricWidthCm', label: 'Fabric width (cm)', type: 'number', show: (o) => o.fabricWidth === 'custom' },
    { id: 'packPages', label: 'Arrange pieces to use the fewest pages', type: 'check' }
  ] }
];
// the app shell expects these names
const DRAWERS = ACC_DRAWERS;
const STYLES = ACC_STYLES;
function choiceVals(ch) { return ch.map(c => Array.isArray(c) ? c[0] : c); }
function fieldChoices(fd, o) { const c = typeof fd.choices === 'function' ? fd.choices(o) : fd.choices; return c || []; }
function fieldVisible(fd, dr, o) { if (dr.show && !dr.show(o)) return false; return !fd.show || fd.show(o); }
function fieldLabel(fd, o) { return typeof fd.label === 'function' ? fd.label(o) : fd.label; }
function normalizeOptions(raw) {
  raw = raw || {};
  let item = raw.item && ITEMS.find(i => i[0] === raw.item) ? raw.item : null;
  if (!item) { const c = raw.cat && CATS.find(x => x[0] === raw.cat) ? raw.cat : 'bag'; item = ITEMS.find(i => i[2] === c)[0]; }
  const o = Object.assign({}, ACC_DEFAULTS, ITEM_DEFAULTS[item] || {}, raw, { item });
  o.cat = itemCat(item);
  if (!Array.isArray(o.bagPockets)) o.bagPockets = [];
  ['styleTags', 'season', 'occasion'].forEach(k => { if (!Array.isArray(o[k])) o[k] = []; });
  if (o.construction === 'raw') { o.lining = isCat(o, 'bag') ? 'no' : o.lining; if (o.topFinish === 'lining') o.topFinish = 'hem'; }
  for (let pass = 0; pass < 3; pass++) {
    for (const dr of ACC_DRAWERS) for (const fd of dr.fields) {
      if (fd.type !== 'select' || fd.id === 'item' || fd.id === 'style' || fd.id === 'cat') continue;
      if (!fieldVisible(fd, dr, o)) continue;
      const vals = choiceVals(fieldChoices(fd, o));
      if (vals.length && !vals.includes(o[fd.id])) {
        const def = (ITEM_DEFAULTS[o.item] || {})[fd.id] ?? ACC_DEFAULTS[fd.id];
        o[fd.id] = vals.includes(def) ? def : vals[0];
      }
    }
  }
  if (o.lining !== 'yes' && o.topFinish === 'lining') o.topFinish = 'hem';
  if (o.style && !(ACC_STYLES[o.item] || {})[o.style]) o.style = '';
  return o;
}
const TAG_KEYS = ['styleTags', 'season', 'occasion'];
function userTags(o) {
  const pt = o._presetTags || {};
  const r = {};
  TAG_KEYS.forEach(k => { r[k] = (Array.isArray(o[k]) ? o[k] : []).filter(t => !(pt[k] || []).includes(t)); });
  return r;
}
const KEEP_KEYS = ['doll', 'name', 'sa', 'saCm', 'hemSa', 'hemSaCm', 'paper', 'packPages', 'fabricWidth', 'fabricWidthCm'];
function applyStyle(o, style) {
  const base = Object.assign({}, ACC_DEFAULTS, ITEM_DEFAULTS[o.item] || {});
  const ut = userTags(o);
  const keep = { item: o.item, cat: o.cat };
  KEEP_KEYS.forEach(k => keep[k] = o[k]);
  Object.assign(keep, ut);
  const preset = JSON.parse(JSON.stringify(((ACC_STYLES[o.item] || {})[style]) || {}));
  const added = {};
  TAG_KEYS.forEach(k => { const p = preset[k] || []; added[k] = p.filter(t => !ut[k].includes(t)); preset[k] = ut[k].concat(added[k]); });
  return normalizeOptions(Object.assign(base, keep, preset, { style, _presetTags: added }));
}
// switching category or item keeps the doll and the print settings, resets the rest
function changeOption(o, id, val) {
  if (id === 'cat' || id === 'item') {
    const keep = {}; KEEP_KEYS.forEach(k => keep[k] = o[k]);
    Object.assign(keep, userTags(o));
    if (id === 'cat') { keep.cat = val; keep.item = (ITEMS.find(i => i[2] === val) || ITEMS[0])[0]; } else keep.item = val;
    return normalizeOptions(keep);
  }
  if (id === 'style') return val ? applyStyle(o, val) : normalizeOptions(Object.assign({}, o, userTags(o), { style: '', _presetTags: {} }));
  return normalizeOptions(Object.assign({}, o, { [id]: val }));
}
