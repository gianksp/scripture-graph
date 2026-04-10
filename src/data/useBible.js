import { useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { BOOK_MAP, parseVerseId, verseIdToLabel } from './bookMap';

export function useBible() {
  const { state } = useApp();
  const { bibleLookup } = state;

  const getVerseByKey = useCallback(key => {
    const baseKey = key.split('-')[0];
    return bibleLookup[baseKey] || null;
  }, [bibleLookup]);

  const getVerseByLabel = useCallback(label => {
    const clean = label.split('-')[0].trim();
    const match = clean.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) return null;
    const code = Object.entries(BOOK_MAP).find(([, v]) => v === match[1])?.[0];
    if (!code) return null;
    return bibleLookup[`${code}.${match[2]}.${match[3]}`] || null;
  }, [bibleLookup]);

  const getChapterVerses = useCallback((book, chapter) => {
    const verses = [];
    let v = 1;
    while (true) {
      const key  = `${book}.${chapter}.${v}`;
      const text = bibleLookup[key];
      if (!text) break;
      verses.push({ key, verse: v, text });
      v++;
    }
    return verses;
  }, [bibleLookup]);

  const getBookChapters = useCallback(book => {
    const chapters = new Set();
    Object.keys(bibleLookup).forEach(key => {
      const { book: b, chapter } = parseVerseId(key);
      if (b === book && chapter) chapters.add(chapter);
    });
    return [...chapters].sort((a, b) => a - b);
  }, [bibleLookup]);

  return { getVerseByKey, getVerseByLabel, getChapterVerses, getBookChapters };
}