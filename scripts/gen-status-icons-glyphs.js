'use strict';

var GEN_ICON_SIZE = 16;

function genIconDistToSegment(px, py, a, b) {
  var dx = b[0] - a[0];
  var dy = b[1] - a[1];
  var t = ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  var x = a[0] + t * dx - px;
  var y = a[1] + t * dy - py;
  return Math.sqrt(x * x + y * y);
}

function genIconInGlyph(glyph, x, y) {
  if (glyph === 'dots') {
    var centers = [4.8, 8, 11.2];
    for (var i = 0; i < centers.length; i++) {
      var dx = centers[i] - x;
      var dy = y - 8;
      if (dx * dx + dy * dy <= 1.3 * 1.3) return true;
    }
    return false;
  }
  for (var s = 0; s < glyph.length; s++) {
    if (genIconDistToSegment(x, y, glyph[s][0], glyph[s][1]) <= 1.05) return true;
  }
  return false;
}

module.exports = {
  GEN_ICON_SIZE: GEN_ICON_SIZE,
  genIconInGlyph: genIconInGlyph
};
