import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps list state (search, filters, sort, page) in the URL query string so it
 * survives refreshes and the back button, e.g. /admin/users?role=OWNER&sortBy=name&order=asc
 */
export default function useListParams(defaults) {
  const [params, setParams] = useSearchParams();

  const values = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const v = params.get(key);
      if (v !== null) out[key] = v;
    }
    out.page = Math.max(1, parseInt(out.page, 10) || 1);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  /** Merge changes; any change other than `page` resets to page 1. */
  const update = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...changes };
          if (!('page' in changes)) merged.page = 1;
          for (const [k, v] of Object.entries(merged)) {
            if (v === '' || v === null || v === undefined || String(v) === String(defaults[k])) next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams]
  );

  return [values, update];
}
