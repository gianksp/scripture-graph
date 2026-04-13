import { create } from 'zustand'
import { deduplicateConnections } from '../utils/arcGeometry'
import { isOT } from '../data/bookMap'

function dedupConns(conns) {
    const map = new Map()
    conns.forEach(c => {
        const normFrom = c.from.split('-')[0]
        const normTo = c.to.split('-')[0]
        const key = [normFrom, normTo].sort().join('|')
        const ex = map.get(key)
        if (!ex || c.votes > ex.votes) map.set(key, c)
    })
    return [...map.values()]
}

function buildBookConns(book, allRefs) {
    const raw = allRefs
        .filter(r => r.from.split('.')[0] === book || r.to.split('.')[0] === book)
        .map(r => {
            const fb = r.from.split('.')[0]
            return { from: fb === book ? r.from : r.to, to: fb === book ? r.to : r.from, votes: r.votes }
        })
    return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

function buildChapterConns(book, chapter, allRefs) {
    const prefix = `${book}.${chapter}.`
    const raw = allRefs
        .filter(r => r.from.startsWith(prefix) || r.to.startsWith(prefix))
        .map(r => ({
            from: r.from.startsWith(prefix) ? r.from : r.to,
            to: r.from.startsWith(prefix) ? r.to : r.from,
            votes: r.votes,
        }))
    return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

function buildVerseConns(verseId, allRefs) {
    const raw = allRefs
        .filter(r => r.from === verseId || r.to === verseId)
        .map(r => ({ from: verseId, to: r.from === verseId ? r.to : r.from, votes: r.votes }))
    return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

function buildRangeConns(fromBook, ch, v1, v2, allRefs) {
    const raw = allRefs
        .filter(r => {
            const inRange = vid => {
                const p = vid.split('.')
                return p[0] === fromBook && parseInt(p[1]) === ch && parseInt(p[2]) >= v1 && parseInt(p[2]) <= v2
            }
            return inRange(r.from) || inRange(r.to)
        })
        .map(r => {
            const p = r.from.split('.')
            const fromIn = p[0] === fromBook && parseInt(p[1]) === ch
            return { from: fromIn ? r.from : r.to, to: fromIn ? r.to : r.from, votes: r.votes }
        })
    return dedupConns(raw).sort((a, b) => b.votes - a.votes)
}

export const useStore = create((set, get) => ({
    // data
    allRefs: [],
    bibleLookup: {},
    loaded: false,
    threshold: 5,
    dataStats: null,
    loading: false,

    // selection
    activeVerse: null,
    connections: [],
    centerText: null,
    selectedBook: null,
    focusedConn: null,  // replaces window.__focusedConn
    theme: localStorage.getItem('theme') || 'dark',

    // camera reset signal — increment to trigger reset
    resetSignal: 0,

    loadData: async () => {
        if (get().loaded || get().loading) return
        set({ loading: true })
        const worker = new Worker('/dataWorker.js', { type: 'module' })
        worker.postMessage(null)
        worker.onmessage = ({ data: { refs, bible, dataStats } }) => {
            set({ allRefs: refs, bibleLookup: bible, loaded: true, loading: false, dataStats })
            worker.terminate()
        }
        worker.onerror = e => { console.error(e); set({ loading: false }) }
    },

    setThreshold: value => set({ threshold: value }),

    clearVerse: () => set({ activeVerse: null, connections: [], centerText: null, selectedBook: null }),

    selectBook: book => {
        const conns = buildBookConns(book, get().allRefs)
        set({ selectedBook: book, activeVerse: `__book__${book}`, connections: conns, centerText: null })
    },

    deselectBook: () => set({ selectedBook: null, activeVerse: null, connections: [], centerText: null }),

    selectChapter: (book, chapter) => {
        const conns = buildChapterConns(book, chapter, get().allRefs)
        set({ activeVerse: `__book__${book}__ch__${chapter}`, connections: conns, centerText: null, selectedBook: null })
    },

    selectChapterArc: chArc => {
        const conns = chArc.versePairs
            .map(v => ({ from: v.from, to: v.to, votes: v.votes }))
            .sort((a, b) => b.votes - a.votes)
        const id = `__book__${chArc.fromChapter.split('.')[0]}__ch__${chArc.fromChapter.split('.')[1]}`
        set({ activeVerse: id, connections: conns, centerText: null, selectedBook: null })
    },

    selectVerse: (verseId, getVerseFn, verseIdToLabelFn) => {
        if (!verseId) return

        if (verseId.startsWith('__range__')) {
            const rangeStr = verseId.replace('__range__', '')
            const [fromId, toId] = rangeStr.split('-')
            const fromBook = fromId.split('.')[0]
            const ch = parseInt(fromId.split('.')[1])
            const v1 = parseInt(fromId.split('.')[2])
            const v2 = parseInt(toId.split('.')[2])
            get().selectRange(fromBook, ch, v1, v2)
            return
        }

        if (verseId.startsWith('__book__') && verseId.includes('__ch__')) {
            const bookPart = verseId.replace('__book__', '')
            const [book, chStr] = bookPart.split('__ch__')
            get().selectChapter(book, parseInt(chStr))
            return
        }

        if (verseId.startsWith('__book__')) {
            const book = verseId.replace('__book__', '')
            get().selectBook(book)
            return
        }

        const conns = buildVerseConns(verseId, get().allRefs)
        const text = getVerseFn(verseIdToLabelFn(verseId))
        set({ activeVerse: verseId, connections: conns, centerText: text, selectedBook: null })
    },

    selectRange: (fromBook, ch, v1, v2) => {
        const conns = buildRangeConns(fromBook, ch, v1, v2, get().allRefs)
        set({ activeVerse: `__book__${fromBook}__ch__${ch}`, connections: conns, centerText: null, selectedBook: null })
    },

    setFocusedConn: conn => set({ focusedConn: conn }),

    resetView: () => set(s => ({ resetSignal: s.resetSignal + 1 })),

    // action — add:
    toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('dark', next === 'dark')
        localStorage.setItem('theme', next)
        set({ theme: next })
    },
}))

// ── Selectors (plain functions, not hooks) ────────────────────────────────────
// These memo-ise by reference so components don't rerender on unrelated changes.

let _allRefs = null, _threshold = null, _filtered = []
export function selectFilteredRefs(state) {
    if (state.allRefs === _allRefs && state.threshold === _threshold) return _filtered
    _allRefs = state.allRefs; _threshold = state.threshold
    _filtered = deduplicateConnections(state.allRefs.filter(r => r.votes >= state.threshold))
    return _filtered
}

let _filtered2 = null, _maxVotes = 1
export function selectMaxVotes(state) {
    const f = selectFilteredRefs(state)
    if (f === _filtered2) return _maxVotes
    _filtered2 = f
    _maxVotes = f.reduce((m, r) => r.votes > m ? r.votes : m, 1)
    return _maxVotes
}

let _allRefs2 = null, _linkCounts = {}
export function selectBookLinkCounts(state) {
    if (state.allRefs === _allRefs2) return _linkCounts
    _allRefs2 = state.allRefs
    const counts = {}
    state.allRefs.forEach(r => {
        const fb = r.from.split('.')[0]; const tb = r.to.split('.')[0]
        counts[fb] = (counts[fb] || 0) + 1
        counts[tb] = (counts[tb] || 0) + 1
    })
    _linkCounts = counts
    return counts
}