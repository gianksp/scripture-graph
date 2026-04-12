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
export const isOT = b => OT_SET.has(b)

export const NAME_TO_CODE = Object.fromEntries(
  Object.entries(BOOK_MAP).map(([k, v]) => [v.toLowerCase(), k])
)

export const COLORS = { OT_OT: '#7ab8f5', NT_NT: '#7dd4a0', OT_NT: '#d4a843' }

export function arcColor(from, to) {
  const fo = isOT(from), to2 = isOT(to)
  if (fo && to2) return COLORS.OT_OT
  if (!fo && !to2) return COLORS.NT_NT
  return COLORS.OT_NT
}

export function verseIdToLabel(id) {
  if (!id) return ''
  const base = id.split('-')[0]
  const [book, ch, v] = base.split('.')
  return `${BOOK_MAP[book] || book} ${parseInt(ch)}:${parseInt(v)}`
}

export function parseUserInput(raw) {
  const clean = raw?.trim() || ''
  if (!clean) return null

  // Already dot format e.g. John.3.16
  if (/^[A-Za-z0-9]+\.\d+\.\d+$/.test(clean)) return clean

  // Range: Gen 1:1-5 → return special range token
  const rangeMatch = clean.match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/)
  if (rangeMatch) {
    const bi = rangeMatch[1].toLowerCase()
    const ch = rangeMatch[2]
    const v1 = rangeMatch[3]
    const v2 = rangeMatch[4]
    const code = NAME_TO_CODE[bi]
      || Object.entries(BOOK_MAP).find(([, v]) => v.toLowerCase().startsWith(bi))?.[0]
      || Object.keys(BOOK_MAP).find(k => k.toLowerCase().startsWith(bi))
    if (code) return `__range__${code}.${ch}.${v1}-${code}.${ch}.${v2}`
  }

  // Book + chapter: Gen 1
  const chMatch = clean.match(/^(.+?)\s+(\d+)$/)
  if (chMatch) {
    const bi = chMatch[1].toLowerCase()
    const ch = chMatch[2]
    const code = NAME_TO_CODE[bi]
      || Object.entries(BOOK_MAP).find(([, v]) => v.toLowerCase().startsWith(bi))?.[0]
      || Object.keys(BOOK_MAP).find(k => k.toLowerCase().startsWith(bi))
    if (code) return `__book__${code}__ch__${ch}`
  }

  // Book only: Gen
  const bookOnly = NAME_TO_CODE[clean.toLowerCase()]
    || Object.entries(BOOK_MAP).find(([, v]) => v.toLowerCase().startsWith(clean.toLowerCase()))?.[0]
    || Object.keys(BOOK_MAP).find(k => k.toLowerCase().startsWith(clean.toLowerCase()))
  if (bookOnly) return `__book__${bookOnly}`

  // Verse: John 3:16
  const m = clean.match(/^(.+?)\s+(\d+):(\d+)$/)
  if (!m) return null
  const bi = m[1].toLowerCase()
  if (NAME_TO_CODE[bi]) return `${NAME_TO_CODE[bi]}.${m[2]}.${m[3]}`
  const byName = Object.entries(BOOK_MAP).find(([, v]) => v.toLowerCase().startsWith(bi))
  if (byName) return `${byName[0]}.${m[2]}.${m[3]}`
  const byCode = Object.keys(BOOK_MAP).find(k => k.toLowerCase().startsWith(bi))
  if (byCode) return `${byCode}.${m[2]}.${m[3]}`
  return null
}

export function chronoSort(a, b) {
  const ai = BOOK_ORDER.indexOf(a.split('.')[0])
  const bi = BOOK_ORDER.indexOf(b.split('.')[0])
  if (ai !== bi) return ai - bi
  const [, ac, av] = a.split('.'), [, bc, bv] = b.split('.')
  return (parseInt(ac) * 1000 + parseInt(av)) - (parseInt(bc) * 1000 + parseInt(bv))
}

export const POPULAR = [
  'John 3:16', 'Genesis 1:1', 'Romans 8:28', 'Psalms 23:1',
  'Isaiah 53:5', 'Jeremiah 29:11', 'Philippians 4:13', 'Matthew 5:3',
  'Romans 3:23', 'Hebrews 11:1', 'Revelation 21:4', 'Proverbs 3:5',
]

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