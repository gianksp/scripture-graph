export const BOOK_MAP = {
  'Gen': 'Genesis', 'Exod': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers',
  'Deut': 'Deuteronomy', 'Josh': 'Joshua', 'Judg': 'Judges', 'Ruth': 'Ruth',
  '1Sam': '1 Samuel', '2Sam': '2 Samuel', '1Kgs': '1 Kings', '2Kgs': '2 Kings',
  '1Chr': '1 Chronicles', '2Chr': '2 Chronicles', 'Ezra': 'Ezra', 'Neh': 'Nehemiah',
  'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psalms', 'Prov': 'Proverbs',
  'Eccl': 'Ecclesiastes', 'Song': 'Song of Solomon', 'Isa': 'Isaiah', 'Jer': 'Jeremiah',
  'Lam': 'Lamentations', 'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea',
  'Joel': 'Joel', 'Amos': 'Amos', 'Obad': 'Obadiah', 'Jonah': 'Jonah',
  'Mic': 'Micah', 'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zeph': 'Zephaniah',
  'Hag': 'Haggai', 'Zech': 'Zechariah', 'Mal': 'Malachi',
  'Matt': 'Matthew', 'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John',
  'Acts': 'Acts', 'Rom': 'Romans', '1Cor': '1 Corinthians', '2Cor': '2 Corinthians',
  'Gal': 'Galatians', 'Eph': 'Ephesians', 'Phil': 'Philippians', 'Col': 'Colossians',
  '1Thess': '1 Thessalonians', '2Thess': '2 Thessalonians', '1Tim': '1 Timothy',
  '2Tim': '2 Timothy', 'Titus': 'Titus', 'Phlm': 'Philemon', 'Heb': 'Hebrews',
  'Jas': 'James', '1Pet': '1 Peter', '2Pet': '2 Peter', '1John': '1 John',
  '2John': '2 John', '3John': '3 John', 'Jude': 'Jude', 'Rev': 'Revelation'
};

export const OT_BOOKS = [
  'Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth',
  '1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh',
  'Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer',
  'Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah',
  'Mic','Nah','Hab','Zeph','Hag','Zech','Mal'
];

export const NT_BOOKS = [
  'Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor',
  'Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim',
  'Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John',
  '3John','Jude','Rev'
];

export const BOOK_ORDER = [...OT_BOOKS, ...NT_BOOKS];

export const OT_BOOKS_SET = new Set(OT_BOOKS);

export const isOT = book => OT_BOOKS_SET.has(book);

export const NAME_TO_CODE = Object.fromEntries(
  Object.entries(BOOK_MAP).map(([k, v]) => [v.toLowerCase(), k])
);

export const COLORS = {
  OT_OT: '#7ab8f5',
  NT_NT: '#7dd4a0',
  OT_NT: '#d4a843',
  CENTER: '#d4a843',
};

export function getArcColor(fromBook, toBook) {
  const fromOT = isOT(fromBook);
  const toOT   = isOT(toBook);
  if (fromOT && toOT)   return COLORS.OT_OT;
  if (!fromOT && !toOT) return COLORS.NT_NT;
  return COLORS.OT_NT;
}

export function parseVerseId(id) {
  const baseId = (id || '').split('-')[0];
  const parts  = baseId.split('.');
  return {
    book:    parts[0],
    chapter: parseInt(parts[1]) || 0,
    verse:   parseInt(parts[2]) || 0,
    key:     baseId
  };
}

export function verseIdToLabel(id) {
  const { book, chapter, verse } = parseVerseId(id);
  const bookName = BOOK_MAP[book] || book;
  return `${bookName} ${chapter}:${verse}`;
}

export function parseUserInput(raw) {
  const clean = raw.trim();
  if (/^[A-Za-z0-9]+\.\d+\.\d+$/.test(clean)) return clean;
  const match = clean.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const bookInput = match[1].toLowerCase().trim();
  const chapter   = match[2];
  const verse     = match[3];
  if (NAME_TO_CODE[bookInput])
    return `${NAME_TO_CODE[bookInput]}.${chapter}.${verse}`;
  const byName = Object.entries(BOOK_MAP)
    .find(([, v]) => v.toLowerCase().startsWith(bookInput));
  if (byName) return `${byName[0]}.${chapter}.${verse}`;
  const byCode = Object.keys(BOOK_MAP)
    .find(k => k.toLowerCase().startsWith(bookInput));
  if (byCode) return `${byCode}.${chapter}.${verse}`;
  return null;
}

export const POPULAR_VERSES = [
  'John 3:16', 'Genesis 1:1', 'Romans 8:28', 'Psalms 23:1',
  'Isaiah 53:5', 'Jeremiah 29:11', 'Philippians 4:13', 'Matthew 5:3',
  'Romans 3:23', 'Hebrews 11:1', 'Revelation 21:4', 'Proverbs 3:5',
  'Isaiah 40:31', 'Matthew 28:19', 'John 1:1', 'Genesis 1:27'
];

// Chronological sort comparator
export function chronoSort(a, b) {
  const aBook = a.split('.')[0]
  const bBook = b.split('.')[0]
  const aIdx  = BOOK_ORDER.indexOf(aBook)
  const bIdx  = BOOK_ORDER.indexOf(bBook)
  if (aIdx !== bIdx) return aIdx - bIdx
  const [,ac,av] = a.split('.')
  const [,bc,bv] = b.split('.')
  const chDiff = parseInt(ac) - parseInt(bc)
  if (chDiff !== 0) return chDiff
  return parseInt(av) - parseInt(bv)
}