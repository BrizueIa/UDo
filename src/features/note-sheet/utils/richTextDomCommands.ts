import { RichFormatAction } from '../components/RichTextToolbar';
import { storedToVisualHtml, visualHtmlToStored, storedToPlainText } from './richTextHtmlCodec';

/**
 * Applies a RichFormatAction to the current DOM selection inside a contentEditable element,
 * updating the visual HTML in place so raw markup tags are never shown to the user.
 */
export function applyFormatToContentEditable(
  el: HTMLElement,
  action: RichFormatAction,
  savedRange: Range | null,
  onSyncStored: (stored: string) => void
): Range | null {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return null;

  if (savedRange && el.contains(savedRange.commonAncestorContainer)) {
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  if (sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer) || range.collapsed) return null;

  // Create a temporary container from the selected DOM fragment to serialize & transform cleanly
  const frag = range.cloneContents();
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(frag);
  const selectedStored = visualHtmlToStored(tempDiv);
  if (!selectedStored.trim()) return null;

  let nextStored = selectedStored;

  switch (action.type) {
    case 'bold': {
      const stripped = selectedStored.replace(/\*\*/g, '');
      nextStored =
        selectedStored.startsWith('**') && selectedStored.endsWith('**')
          ? stripped
          : `**${stripped}**`;
      break;
    }
    case 'italic': {
      const stripped = selectedStored.replace(/(?<!\*)\*(?!\*)/g, '');
      nextStored =
        selectedStored.startsWith('*') &&
        selectedStored.endsWith('*') &&
        !selectedStored.startsWith('**')
          ? stripped
          : `*${stripped}*`;
      break;
    }
    case 'underline': {
      const stripped = selectedStored.replace(/<\/?u>/gi, '');
      nextStored =
        selectedStored.startsWith('<u>') && selectedStored.endsWith('</u>')
          ? stripped
          : `<u>${stripped}</u>`;
      break;
    }
    case 'strikethrough': {
      const stripped = selectedStored.replace(/~~/g, '');
      nextStored =
        selectedStored.startsWith('~~') && selectedStored.endsWith('~~')
          ? stripped
          : `~~${stripped}~~`;
      break;
    }
    case 'color': {
      const stripped = selectedStored.replace(/\[\/?color(?:=[^\]]+)?\]/gi, '');
      nextStored = action.hex ? `[color=${action.hex}]${stripped}[/color]` : stripped;
      break;
    }
    case 'bg': {
      const stripped = selectedStored.replace(/\[\/?bg(?:=[^\]]+)?\]/gi, '');
      nextStored = action.hex ? `[bg=${action.hex}]${stripped}[/bg]` : stripped;
      break;
    }
    case 'size': {
      const stripped = selectedStored.replace(/\[\/?size(?:=[^\]]+)?\]/gi, '');
      nextStored =
        action.size && action.size !== 'base'
          ? `[size=${action.size}]${stripped}[/size]`
          : stripped;
      break;
    }
    case 'clear': {
      nextStored = storedToPlainText(selectedStored);
      break;
    }
  }

  const replacementHtml = storedToVisualHtml(nextStored);
  const wrapper = document.createElement('span');
  wrapper.innerHTML = replacementHtml;

  range.deleteContents();
  const insertedNodes: Node[] = [];
  while (wrapper.firstChild) {
    const child = wrapper.firstChild;
    insertedNodes.push(child);
    range.insertNode(child);
    range.setStartAfter(child);
    range.collapse(true);
  }

  const newRange = document.createRange();
  if (insertedNodes.length > 0) {
    newRange.setStartBefore(insertedNodes[0]);
    newRange.setEndAfter(insertedNodes[insertedNodes.length - 1]);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  const fullStored = visualHtmlToStored(el);
  onSyncStored(fullStored);
  return newRange;
}
