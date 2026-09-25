'use strict';

var glyphs = require('./gen-status-icons-glyphs');

function genIconSamplePixel(def, px, py, ss) {
  var disc = 0;
  var white = 0;
  var sy;
  var sx;
  for (sy = 0; sy < ss; sy++) {
    for (sx = 0; sx < ss; sx++) {
      var x = px + (sx + 0.5) / ss;
      var y = py + (sy + 0.5) / ss;
      var dx = x - 8;
      var dy = y - 8;
      if (dx * dx + dy * dy <= 7.5 * 7.5) {
        disc++;
        if (glyphs.genIconInGlyph(def.glyph, x, y)) white++;
      }
    }
  }
  return { disc: disc, white: white, samples: ss * ss };
}

function genIconWritePixel(rgba, px, py, size, color, sample) {
  var w = sample.disc ? sample.white / sample.disc : 0;
  var o = (py * size + px) * 4;
  rgba[o] = Math.round(color[0] * (1 - w) + 255 * w);
  rgba[o + 1] = Math.round(color[1] * (1 - w) + 255 * w);
  rgba[o + 2] = Math.round(color[2] * (1 - w) + 255 * w);
  rgba[o + 3] = Math.round(255 * sample.disc / sample.samples);
}

function genIconRenderIcon(def, size, ss) {
  var rgba = Buffer.alloc(size * size * 4);
  var py;
  var px;
  for (py = 0; py < size; py++) {
    for (px = 0; px < size; px++) {
      var sample = genIconSamplePixel(def, px, py, ss);
      genIconWritePixel(rgba, px, py, size, def.color, sample);
    }
  }
  return rgba;
}

module.exports = { genIconRenderIcon: genIconRenderIcon };
