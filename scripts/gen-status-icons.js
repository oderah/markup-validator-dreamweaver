/**
 * Generate the classic floater's 16x16 status icons (PNG) without dependencies.
 * Output: dw-classic/Floaters/MarkupValidator/status-{none,busy,ok,fail}.png
 */
var fs = require('fs');
var path = require('path');
var glyphMod = require('./gen-status-icons-glyphs');
var renderMod = require('./gen-status-icons-render');
var pngMod = require('./gen-status-icons-png');

var SIZE = glyphMod.GEN_ICON_SIZE;
var SS = 4;
var OUT = path.join(__dirname, '..', 'dw-classic', 'Floaters', 'MarkupValidator');

var ICONS = {
  none: { color: [107, 114, 128], glyph: [[[5, 8], [11, 8]]] },
  busy: { color: [37, 99, 235], glyph: 'dots' },
  ok: { color: [22, 128, 72], glyph: [[[4.6, 8.3], [7, 10.7]], [[7, 10.7], [11.4, 5.6]]] },
  fail: { color: [200, 40, 40], glyph: [[[5.3, 5.3], [10.7, 10.7]], [[10.7, 5.3], [5.3, 10.7]]] }
};

fs.mkdirSync(OUT, { recursive: true });
Object.keys(ICONS).forEach(function (name) {
  var file = path.join(OUT, 'status-' + name + '.png');
  var rgba = renderMod.genIconRenderIcon(ICONS[name], SIZE, SS);
  fs.writeFileSync(file, pngMod.genIconEncodePng(rgba, SIZE));
  console.log('Wrote', path.relative(process.cwd(), file));
});
