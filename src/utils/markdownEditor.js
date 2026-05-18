/**
 * Helpers for wrapping / prefixing text in a markdown textarea.
 */

export function applyTextareaEdit(textarea, newValue, selectionStart, selectionEnd) {
  const onChange = textarea._markdownOnChange;
  if (onChange) {
    onChange(newValue);
  } else {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    nativeInputValueSetter?.call(textarea, newValue);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(selectionStart, selectionEnd);
  });
}

export function wrapSelection(textarea, prefix, suffix = "", placeholder = "") {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end) || placeholder;
  const newValue =
    value.slice(0, start) + prefix + selected + suffix + value.slice(end);
  const selStart = start + prefix.length;
  const selEnd = selStart + selected.length;
  return { newValue, selectionStart: selStart, selectionEnd: selEnd };
}

export function prefixLines(textarea, linePrefix, placeholder = "") {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, blockEnd);
  const hadSelection = start !== end;

  const lines = block.split("\n");
  const prefixed = lines
    .map((line, i) => {
      if (!hadSelection && i === 0 && !line && placeholder) {
        return `${linePrefix}${placeholder}`;
      }
      if (line.startsWith(linePrefix)) return line;
      return `${linePrefix}${line}`;
    })
    .join("\n");

  const newValue = value.slice(0, lineStart) + prefixed + value.slice(blockEnd);
  const newStart = lineStart;
  const newEnd = lineStart + prefixed.length;
  return { newValue, selectionStart: newStart, selectionEnd: newEnd };
}

export function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const newValue = value.slice(0, start) + text + value.slice(end);
  const pos = start + text.length;
  return { newValue, selectionStart: pos, selectionEnd: pos };
}
