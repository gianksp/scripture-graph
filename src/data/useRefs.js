import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { parseVerseId, isOT, getArcColor, verseIdToLabel } from './bookMap';

export function useRefs() {
  const { state } = useApp();
  const { allRefs, threshold } = state;

  const filteredRefs = useMemo(() =>
    allRefs.filter(r => r.votes >= threshold),
    [allRefs, threshold]
  );

  const getConnectionsForVerse = useMemo(() => (verseId) => {
    return allRefs
      .filter(r => r.from === verseId || r.to === verseId)
      .map(r => ({
        to:    r.from === verseId ? r.to : r.from,
        from:  verseId,
        votes: r.votes,
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 80);
  }, [allRefs]);

  const getConnectionsForChapter = useMemo(() => (book, chapter) => {
    const prefix = `${book}.${chapter}.`;
    return allRefs.filter(r =>
      r.from.startsWith(prefix) || r.to.startsWith(prefix)
    );
  }, [allRefs]);

  const stats = useMemo(() => {
    let OT_OT = 0, NT_NT = 0, OT_NT = 0;
    filteredRefs.forEach(r => {
      const fb = r.from.split('.')[0];
      const tb = r.to.split('.')[0];
      const fo = isOT(fb), to = isOT(tb);
      if (fo && to) OT_OT++;
      else if (!fo && !to) NT_NT++;
      else OT_NT++;
    });
    return { OT_OT, NT_NT, OT_NT, total: filteredRefs.length };
  }, [filteredRefs]);

  return { filteredRefs, getConnectionsForVerse, getConnectionsForChapter, stats };
}