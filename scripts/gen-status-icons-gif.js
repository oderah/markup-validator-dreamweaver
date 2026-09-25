'use strict';

var CLEAR_LIMIT = 4096;

function genIconPaletteSlot(colors, rgba, offset) {
  if (rgba[offset + 3] < 128) return 0;
  var rgb = [rgba[offset], rgba[offset + 1], rgba[offset + 2]];
  for (var c = 1; c < colors.length; c++) {
    if (colors[c][0] === rgb[0] && colors[c][1] === rgb[1] && colors[c][2] === rgb[2]) return c;
  }
  colors.push(rgb);
  return colors.length - 1;
}

function genIconQuantize(rgba, size) {
  var colors = [[0, 0, 0]];
  var index = Buffer.alloc(size * size);
  for (var i = 0; i < index.length; i++) {
    index[i] = genIconPaletteSlot(colors, rgba, i * 4);
  }
  return { colors: colors, index: index };
}

function genIconColorTable(colors) {
  var bits = 1;
  while ((1 << bits) < colors.length) bits++;
  if (bits < 2) bits = 2;
  var table = Buffer.alloc((1 << bits) * 3);
  for (var i = 0; i < colors.length; i++) {
    table[i * 3] = colors[i][0];
    table[i * 3 + 1] = colors[i][1];
    table[i * 3 + 2] = colors[i][2];
  }
  return { bits: bits, table: table };
}

function genIconKnownCode(seq, clearCode, dict) {
  if (seq.indexOf(',') < 0) return Number(seq) < clearCode;
  return dict.has(seq);
}

function genIconPackBits(state, code) {
  state.bitBuf |= code << state.bitCount;
  state.bitCount += state.codeSize;
  var maxCode = (1 << state.codeSize) - 1;
  if (state.nextCode > maxCode && state.codeSize < 12) state.codeSize++;
  while (state.bitCount >= 8) {
    state.bytes.push(state.bitBuf & 0xff);
    state.bitBuf >>>= 8;
    state.bitCount -= 8;
  }
}

function genIconResetLzw(state, clearCode) {
  state.dict = new Map();
  state.nextCode = clearCode + 2;
  state.codeSize = state.minCodeSize + 1;
  genIconPackBits(state, clearCode);
}

function genIconAddCode(state, seq, clearCode) {
  state.dict.set(seq, state.nextCode);
  state.nextCode++;
  if (state.nextCode === CLEAR_LIMIT) genIconResetLzw(state, clearCode);
}

function genIconLzw(index, minCodeSize) {
  var clearCode = 1 << minCodeSize;
  var state = { minCodeSize: minCodeSize, dict: null, nextCode: 0, codeSize: 0, bitBuf: 0, bitCount: 0, bytes: [] };
  genIconResetLzw(state, clearCode);
  var prefix = String(index[0]);
  for (var i = 1; i < index.length; i++) {
    var seq = prefix + ',' + index[i];
    if (genIconKnownCode(seq, clearCode, state.dict)) {
      prefix = seq;
    } else {
      genIconPackBits(state, genIconCodeValue(prefix, state.dict));
      genIconAddCode(state, seq, clearCode);
      prefix = String(index[i]);
    }
  }
  genIconPackBits(state, genIconCodeValue(prefix, state.dict));
  genIconPackBits(state, clearCode + 1);
  if (state.bitCount > 0) state.bytes.push(state.bitBuf & 0xff);
  return Buffer.from(state.bytes);
}

function genIconCodeValue(seq, dict) {
  if (seq.indexOf(',') < 0) return Number(seq);
  return dict.get(seq);
}

function genIconSubBlocks(bytes) {
  var parts = [];
  for (var i = 0; i < bytes.length; i += 255) {
    var slice = bytes.slice(i, i + 255);
    parts.push(Buffer.from([slice.length]), slice);
  }
  parts.push(Buffer.from([0]));
  return Buffer.concat(parts);
}

function genIconEncodeGif(rgba, size) {
  var quant = genIconQuantize(rgba, size);
  var table = genIconColorTable(quant.colors);
  var screen = Buffer.from([
    size & 0xff, size >> 8, size & 0xff, size >> 8,
    0x80 | ((table.bits - 1) << 4) | (table.bits - 1), 0, 0
  ]);
  var gce = Buffer.from([0x21, 0xf9, 4, 1, 0, 0, 0, 0]);
  var image = Buffer.from([0x2c, 0, 0, 0, 0, size & 0xff, size >> 8, size & 0xff, size >> 8, 0]);
  var lzw = genIconLzw(quant.index, table.bits);
  return Buffer.concat([
    Buffer.from('GIF89a', 'ascii'),
    screen,
    table.table,
    gce,
    image,
    Buffer.from([table.bits]),
    genIconSubBlocks(lzw),
    Buffer.from([0x3b])
  ]);
}

module.exports = { genIconEncodeGif: genIconEncodeGif };
