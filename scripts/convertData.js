import { encode } from '@msgpack/msgpack'
import { readFileSync, writeFileSync } from 'fs'

const refs = JSON.parse(readFileSync('public/data/cross-references.json', 'utf8'))
const bible = JSON.parse(readFileSync('public/data/bible-lookup.json', 'utf8'))

writeFileSync('public/data/cross-references.bin', encode(refs))
writeFileSync('public/data/bible-lookup.bin', encode(bible))

console.log('done')