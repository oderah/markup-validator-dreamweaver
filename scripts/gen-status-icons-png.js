'use strict';

var zlib = require('zlib');

var GEN_ICON_CRC_TABLE = (function () {
  var t = [];
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function genIconCrc32(buf) {
  var c = 0xffffffff;
  for (var i = 0; i < buf.length; i++) c = GEN_ICON_CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function genIconChunk(type, data) {
  var len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  var body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  var crc = Buffer.alloc(4);
  crc.writeUInt32BE(genIconCrc32(body));
  return Buffer.concat([len, body, crc]);
}

function genIconEncodePng(rgba, size) {
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  var raw = Buffer.alloc(size * (size * 4 + 1));
  for (var y = 0; y < size; y++) {
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    genIconChunk('IHDR', ihdr),
    genIconChunk('IDAT', zlib.deflateSync(raw)),
    genIconChunk('IEND', Buffer.alloc(0))
  ]);
}

module.exports = { genIconEncodePng: genIconEncodePng };
