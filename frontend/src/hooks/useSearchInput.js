import { useEffect, useState } from 'react';
import useDebounce from './useDebounce';

/** Local text state for a search box that pushes a debounced value to `onCommit`. */
export default function useSearchInput(committed, onCommit, delay = 350) {
  const [text, setText] = useState(committed || '');
  const debounced = useDebounce(text, delay);

  useEffect(() => {
    if (debounced.trim() !== (committed || '')) onCommit(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Reflect external changes (e.g. browser back button)
  useEffect(() => {
    if ((committed || '') !== text.trim()) setText(committed || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committed]);

  return [text, setText];
}
