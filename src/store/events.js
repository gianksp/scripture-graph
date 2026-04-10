const bus = new EventTarget();

export const emit = (name, detail = {}) =>
  bus.dispatchEvent(new CustomEvent(name, { detail }));

export const on = (name, fn) => {
  const handler = e => fn(e.detail);
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
};

// ── Event catalogue ────────────────────────────────────────────
// verse:selected    { verseId, label }
// verse:explored    { verseId, connections, centerText }
// arc:hovered       { ref, x, y }
// arc:clicked       { ref }
// arc:cleared       {}
// chapter:selected  { book, chapter, verses }
// view:changed      { view }          — 'arc' | 'graph' | 'chapter'
// threshold:changed { value, count }
// data:loaded       { refCount, verseCount }