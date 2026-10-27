// Loads the engine sources (everything except app.js) into one scope for node testing
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const order = JSON.parse(fs.readFileSync(path.join(SRC, 'order.json'), 'utf8')).engine;
let code = order.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
code += '\n;module.exports = { G, ITEMS, CATS, ACC_STYLES, ACC_DRAWERS, DRAWERS, STYLES, normalizeOptions, applyStyle, changeOption, buildAccessory, buildGarment, settingsFrom, layoutPages, renderPageSVG, pieceSVG, drawFlats, layoutCutting, cuttingSVG, fieldVisible, fieldChoices, choiceVals, resolveAcc, resolveMeasurements, DOLL_FIELDS };';
const m = new module.constructor();
m.paths = module.paths;
m._compile(code, path.join(SRC, '__bundle.js'));
module.exports = m.exports;
