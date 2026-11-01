import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCrossLineRange,
  splitLinePrefix,
  getVisibleLineLength,
  sliceStoredByVisualOffsets,
  splitStoredAtVisualOffset,
  applyFormatToCrossLineRange,
  deleteOrReplaceCrossLineRange,
  extractPlainTextFromCrossLineRange,
  getLineSelectionSlice,
  extendCrossLineRangeByKey,
} from './crossLineSelectionEngine.ts';
import {
  storedToVisualHtmlWithSelection,
  storedToPlainText,
} from './richTextHtmlCodec.ts';

describe('crossLineSelectionEngine (v1.1.0 Granular Word-by-Word Selection)', () => {
  it('1. Formats full Line 1 and ONLY the first word of Line 2 without modifying the rest of Line 2', () => {
    const lines = [
      'Cuenta de desarrollador playstore:q',
      'correo@gmail.com',
      'contraseña',
    ];

    // Select all of line 0 (length 35) and only "correo" (length 6) of line 1
    const range = createCrossLineRange(0, 0, 1, 6);

    const { lines: bolded } = applyFormatToCrossLineRange(lines, range, { type: 'bold' });

    assert.equal(bolded[0], '**Cuenta de desarrollador playstore:q**');
    assert.equal(bolded[1], '**correo**@gmail.com');
    assert.equal(bolded[2], 'contraseña');

    // Toggling bold again on the exact same range removes bold cleanly without touching @gmail.com
    const { lines: unbolded } = applyFormatToCrossLineRange(bolded, range, { type: 'bold' });
    assert.equal(unbolded[0], 'Cuenta de desarrollador playstore:q');
    assert.equal(unbolded[1], 'correo@gmail.com');
    assert.equal(unbolded[2], 'contraseña');
  });

  it('2. Formats only the last word of Line 1 and the first word of Line 2', () => {
    const lines = [
      'Cuenta de desarrollador playstore:q',
      'correo@gmail.com',
      'contraseña',
    ];

    // "Cuenta de desarrollador " is 24 chars; "playstore:q" is chars 24..35
    // "correo" in line 1 is chars 0..6
    const range = createCrossLineRange(0, 24, 1, 6);

    const { lines: colored } = applyFormatToCrossLineRange(lines, range, {
      type: 'color',
      hex: '#22c55e',
    });

    assert.equal(
      colored[0],
      'Cuenta de desarrollador [color=#22c55e]playstore:q[/color]'
    );
    assert.equal(colored[1], '[color=#22c55e]correo[/color]@gmail.com');
    assert.equal(colored[2], 'contraseña');
  });

  it('3. Preserves existing rich-text tags when splitting or formatting mid-word', () => {
    const richBody = 'Hola **mundo** bonito';
    const { before, after } = splitStoredAtVisualOffset(richBody, 7); // "Hola mu" | "ndo bonito"

    assert.equal(before, 'Hola **mu**');
    assert.equal(after, '**ndo** bonito');

    const sliced = sliceStoredByVisualOffsets(richBody, 2, 8); // "la mun"
    assert.equal(sliced, 'la **mun**');
  });

  it('4. Deletes a partial cross-line selection and merges unselected start of Line 1 with unselected end of Line 2', () => {
    const lines = [
      'Cuenta de **desarrollador** playstore:q',
      'correo@gmail.com',
      'contraseña',
    ];

    // Select from offset 24 ("playstore:q") on line 0 to offset 6 ("correo") on line 1
    const range = createCrossLineRange(0, 24, 1, 6);
    const res = deleteOrReplaceCrossLineRange(lines, range, '');

    assert.equal(res.lines.length, 2);
    assert.equal(res.lines[0], 'Cuenta de **desarrollador** @gmail.com');
    assert.equal(res.lines[1], 'contraseña');
    assert.equal(res.cursorLine, 0);
    assert.equal(res.cursorOffset, 24);
  });

  it('5. Replaces a partial cross-line selection with single-line and multi-line pasted text', () => {
    const lines = ['- [ ] Comprar pan y leche', 'Revisar correo urgente'];
    // In line 0, body is "Comprar pan y leche" (19 chars). Select "leche" (14..19) and "Revisar " (0..8) in line 1
    const range = createCrossLineRange(0, 14, 1, 8);

    const singleRep = deleteOrReplaceCrossLineRange(lines, range, 'café para ');
    assert.equal(singleRep.lines.length, 1);
    assert.equal(singleRep.lines[0], '- [ ] Comprar pan y café para correo urgente');
    assert.equal(singleRep.cursorLine, 0);
    assert.equal(singleRep.cursorOffset, 24);

    const multiRep = deleteOrReplaceCrossLineRange(lines, range, 'huevos\nLlamar y ');
    assert.equal(multiRep.lines.length, 2);
    assert.equal(multiRep.lines[0], '- [ ] Comprar pan y huevos');
    assert.equal(multiRep.lines[1], 'Llamar y correo urgente');
    assert.equal(multiRep.cursorLine, 1);
    assert.equal(multiRep.cursorOffset, 9);
  });

  it('6. Preserves task checkboxes, headings, bullets, and skips [embed:...] lines safely', () => {
    const lines = [
      '- [x] Tarea completada hoy',
      '[embed:link:lnk-123]',
      '## Subtítulo importante',
    ];

    assert.equal(splitLinePrefix(lines[0]).prefix, '- [x] ');
    assert.equal(splitLinePrefix(lines[0]).isChecked, true);
    assert.equal(splitLinePrefix(lines[1]).isEmbed, true);
    assert.equal(splitLinePrefix(lines[2]).prefix, '## ');

    // Select from "hoy" (offset 17..20 of line 0) to "Subtítulo" (offset 0..9 of line 2)
    const range = createCrossLineRange(0, 17, 2, 9);
    const { lines: formatted } = applyFormatToCrossLineRange(lines, range, {
      type: 'underline',
    });

    assert.equal(formatted[0], '- [x] Tarea completada <u>hoy</u>');
    assert.equal(formatted[1], '[embed:link:lnk-123]');
    assert.equal(formatted[2], '## <u>Subtítulo</u> importante');
  });

  it('7. Extracts exact plain text for Copy/Cut across partial lines and handles reverse (bottom-up) selection', () => {
    const lines = [
      'Primera frase completa',
      'Segunda **línea** media',
      'Tercera palabra final',
    ];

    // Dragging upwards from line 2 offset 7 ("Tercera") to line 0 offset 8 ("frase completa")
    const reverseRange = createCrossLineRange(2, 7, 0, 8);
    assert.equal(reverseRange.startLine, 0);
    assert.equal(reverseRange.startOffset, 8);
    assert.equal(reverseRange.endLine, 2);
    assert.equal(reverseRange.endOffset, 7);

    const copied = extractPlainTextFromCrossLineRange(lines, reverseRange);
    assert.equal(copied, 'frase completa\nSegunda línea media\nTercera');
  });

  it('8. Renders inline <mark data-udo-sel="true"> highlight only around selected characters without corrupting HTML or plain text', () => {
    const raw = 'correo@gmail.com';
    const html = storedToVisualHtmlWithSelection(raw, 0, 6);

    assert.equal(
      html,
      '<mark data-udo-sel="true" class="bg-[#3b82f6]/40 text-white rounded-[2px]">correo</mark>@gmail.com'
    );

    const richRaw = 'Cuenta **playstore:q** fin';
    // Visible text: "Cuenta playstore:q fin" -> highlight "playstore" (7..16)
    const richHtml = storedToVisualHtmlWithSelection(richRaw, 7, 16);
    assert.equal(
      richHtml,
      'Cuenta <strong class="font-bold"><mark data-udo-sel="true" class="bg-[#3b82f6]/40 text-white rounded-[2px]">playstore</mark>:q</strong> fin'
    );

    assert.equal(storedToPlainText(richRaw), 'Cuenta playstore:q fin');
    const slice = getLineSelectionSlice(1, getVisibleLineLength(raw), createCrossLineRange(0, 5, 1, 6));
    assert.deepEqual(slice, { start: 0, end: 6 });
  });

  it('9. Extends selection across lines character-by-character and word-by-word with Shift+Arrows', () => {
    const lines = [
      'Cuenta de desarrollador playstore:q',
      'correo@gmail.com',
      'contraseña',
    ];

    // Start with all of line 0 selected: anchor (0, 0), focus (0, 35)
    let range = createCrossLineRange(0, 0, 0, 35);

    // Press Ctrl+Shift+ArrowRight -> jumps into line 1 and selects the first word "correo" (offset 6)
    range = extendCrossLineRangeByKey(lines, range, 'right', true);
    assert.equal(range.focusLine, 1);
    assert.equal(range.focusOffset, 6);
    assert.equal(
      extractPlainTextFromCrossLineRange(lines, range),
      'Cuenta de desarrollador playstore:q\ncorreo'
    );

    // Press Shift+ArrowLeft once -> shrinks by 1 character to "corre" (offset 5)
    range = extendCrossLineRangeByKey(lines, range, 'left', false);
    assert.equal(range.focusLine, 1);
    assert.equal(range.focusOffset, 5);
    assert.equal(
      extractPlainTextFromCrossLineRange(lines, range),
      'Cuenta de desarrollador playstore:q\ncorre'
    );
  });
});
