import { decode } from 'https://cdn.jsdelivr.net/npm/@msgpack/msgpack@3/+esm'

self.onmessage = async () => {
    const [refsRes, bibleRes] = await Promise.all([
        fetch('/data/cross-references.bin'),
        fetch('/data/bible-lookup.bin'),
    ])

    const [refsBuffer, bibleBuffer] = await Promise.all([
        refsRes.arrayBuffer(),
        bibleRes.arrayBuffer(),
    ])

    const { decode } = await import('https://cdn.jsdelivr.net/npm/@msgpack/msgpack@3/+esm')
    const refs = decode(new Uint8Array(refsBuffer))
    const bible = decode(new Uint8Array(bibleBuffer))

    // Compute stats in the worker — never touches main thread
    const books = new Set(refs.flatMap(r => [r.from.split('.')[0], r.to.split('.')[0]])).size
    const chapters = new Set(refs.flatMap(r => [
        r.from.split('.').slice(0, 2).join('.'),
        r.to.split('.').slice(0, 2).join('.'),
    ])).size
    const verses = new Set(refs.flatMap(r => [r.from.split('-')[0], r.to.split('-')[0]])).size

    self.postMessage({
        refs,
        bible,
        dataStats: { books, chapters, verses, links: refs.length }
    })
}