/**
 * Shared text offset helpers for Markup Validator classic scripts.
 */
var MVSharedText = (function () {
  function offsetToLineCol(text, offset) {
    var line = 1;
    var col = 1;
    var i = 0;
    var limit = Math.min(offset, text.length);
    while (i < limit) {
      var step = lineBreakStep(text, i);
      i = step.next;
      if (step.broke) {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return { line: line, column: col };
  }

  function lineBreakStep(text, index) {
    var ch = text.charAt(index);
    if (ch === '\n') return { next: index + 1, broke: true };
    if (ch !== '\r') return { next: index + 1, broke: false };
    if (text.charAt(index + 1) === '\n') return { next: index + 2, broke: true };
    return { next: index + 1, broke: true };
  }

  function indexAtLine(text, targetLine) {
    var lineNum = 1;
    var i = 0;
    while (i < text.length && lineNum < targetLine) {
      var step = lineBreakStep(text, i);
      i = step.next;
      if (step.broke) lineNum++;
    }
    return i;
  }

  function indexAtColumn(text, start, targetCol) {
    var i = start;
    var col = 1;
    while (i < text.length && col < targetCol) {
      var ch = text.charAt(i);
      if (ch === '\n' || ch === '\r') break;
      i++;
      col++;
    }
    return i;
  }

  function lineColToOffset(source, line, column) {
    var targetLine = Math.max(1, parseInt(line, 10) || 1);
    var targetCol = Math.max(1, parseInt(column, 10) || 1);
    var text = String(source || '');
    return indexAtColumn(text, indexAtLine(text, targetLine), targetCol);
  }

  function scanOffsetAtLine(text, line, column) {
    return indexAtColumn(text, indexAtLine(text, line), column);
  }

  return {
    offsetToLineCol: offsetToLineCol,
    lineColToOffset: lineColToOffset,
    scanOffsetAtLine: scanOffsetAtLine
  };
})();
