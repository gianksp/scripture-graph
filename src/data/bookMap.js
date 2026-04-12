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
  '2John': '2 John', '3John': '3 John', 'Jude': 'Jude', 'Rev': 'Revelation',
}

export const OT_BOOKS = [
  'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth',
  '1Sam', '2Sam', '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh',
  'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer',
  'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah',
  'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
]
export const NT_BOOKS = [
  'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor',
  'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim',
  'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John',
  '3John', 'Jude', 'Rev',
]
export const BOOK_ORDER = [...OT_BOOKS, ...NT_BOOKS]
export const OT_SET = new Set(OT_BOOKS)
export const isOT = book => OT_SET.has(book)

/** Maps full book name (lowercase) → book code, e.g. "genesis" → "Gen" */
export const NAME_TO_CODE = Object.fromEntries(
  Object.entries(BOOK_MAP).map(([code, name]) => [name.toLowerCase(), code])
)

export const COLORS = { OT_OT: '#7ab8f5', NT_NT: '#7dd4a0', OT_NT: '#d4a843' }

/** Returns the arc color for a cross-reference based on testament of each book */
export function arcColor(fromBook, toBook) {
  const fromOT = isOT(fromBook), toOT = isOT(toBook)
  if (fromOT && toOT) return COLORS.OT_OT
  if (!fromOT && !toOT) return COLORS.NT_NT
  return COLORS.OT_NT
}

/** Converts a verse ID like "John.3.16" to a human label "John 3:16" */
export function verseIdToLabel(verseId) {
  if (!verseId) return ''
  const baseId = verseId.split('-')[0]
  const [book, chapter, verse] = baseId.split('.')
  if (!chapter || !verse) return BOOK_MAP[book] || book
  return `${BOOK_MAP[book] || book} ${parseInt(chapter)}:${parseInt(verse)}`
}

/** Resolves a raw book name/abbreviation to a book code */
function resolveBookCode(rawName) {
  const lower = rawName.trim().toLowerCase()
  if (NAME_TO_CODE[lower]) return NAME_TO_CODE[lower]
  const byFullName = Object.entries(BOOK_MAP).find(([, name]) => name.toLowerCase().startsWith(lower))
  if (byFullName) return byFullName[0]
  return Object.keys(BOOK_MAP).find(code => code.toLowerCase().startsWith(lower)) || null
}

/**
 * Parses a user search string into an internal verse/book/chapter ID.
 * Supports: "John 3:16", "Gen 1", "Genesis", "Gen 1:1-5", "John.3.16"
 */
export function parseUserInput(rawInput) {
  const input = (rawInput || '').trim()
  if (!input) return null

  // Already in dot format
  if (/^[A-Za-z0-9]+\.\d+\.\d+$/.test(input)) return input

  // Range: Gen 1:1-5
  const rangeMatch = input.match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/)
  if (rangeMatch) {
    const code = resolveBookCode(rangeMatch[1])
    if (code) return `__range__${code}.${rangeMatch[2]}.${rangeMatch[3]}-${code}.${rangeMatch[2]}.${rangeMatch[4]}`
  }

  // Verse: John 3:16
  const verseMatch = input.match(/^(.+?)\s+(\d+):(\d+)$/)
  if (verseMatch) {
    const code = resolveBookCode(verseMatch[1])
    if (code) return `${code}.${verseMatch[2]}.${verseMatch[3]}`
  }

  // Chapter: Gen 1
  const chapterMatch = input.match(/^(.+?)\s+(\d+)$/)
  if (chapterMatch) {
    const code = resolveBookCode(chapterMatch[1])
    if (code) return `__book__${code}__ch__${chapterMatch[2]}`
  }

  // Book only: Genesis
  const bookCode = resolveBookCode(input)
  if (bookCode) return `__book__${bookCode}`

  return null
}

/** Sorts verse IDs chronologically by book order, then chapter, then verse */
export function chronoSort(verseIdA, verseIdB) {
  const ai = BOOK_ORDER.indexOf(verseIdA.split('.')[0])
  const bi = BOOK_ORDER.indexOf(verseIdB.split('.')[0])
  if (ai !== bi) return ai - bi
  const [, ac, av] = verseIdA.split('.')
  const [, bc, bv] = verseIdB.split('.')
  return (parseInt(ac) * 1000 + parseInt(av)) - (parseInt(bc) * 1000 + parseInt(bv))
}

export const ABBREV = {
  'Gen': 'GEN', 'Exod': 'EXO', 'Lev': 'LEV', 'Num': 'NUM', 'Deut': 'DEU',
  'Josh': 'JOS', 'Judg': 'JDG', 'Ruth': 'RUT', '1Sam': '1SA', '2Sam': '2SA',
  '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', 'Ezra': 'EZR',
  'Neh': 'NEH', 'Esth': 'EST', 'Job': 'JOB', 'Ps': 'PSA', 'Prov': 'PRO',
  'Eccl': 'ECC', 'Song': 'SNG', 'Isa': 'ISA', 'Jer': 'JER', 'Lam': 'LAM',
  'Ezek': 'EZK', 'Dan': 'DAN', 'Hos': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO',
  'Obad': 'OBA', 'Jonah': 'JON', 'Mic': 'MIC', 'Nah': 'NAH', 'Hab': 'HAB',
  'Zeph': 'ZEP', 'Hag': 'HAG', 'Zech': 'ZEC', 'Mal': 'MAL',
  'Matt': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Rom': 'ROM', '1Cor': '1CO', '2Cor': '2CO', 'Gal': 'GAL', 'Eph': 'EPH',
  'Phil': 'PHP', 'Col': 'COL', '1Thess': '1TH', '2Thess': '2TH', '1Tim': '1TI',
  '2Tim': '2TI', 'Titus': 'TIT', 'Phlm': 'PHM', 'Heb': 'HEB', 'Jas': 'JAS',
  '1Pet': '1PE', '2Pet': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN',
  'Jude': 'JUD', 'Rev': 'REV',
}