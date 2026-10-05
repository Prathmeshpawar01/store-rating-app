import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader whenever `deps` change and tracks loading / error / data.
 * Ignores responses from stale requests so fast typing in a search box can't
 * show out-of-order results.
 */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await run();
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === requestId.current) setState((s) => ({ ...s, loading: false, error }));
    }
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load, setData: (updater) => setState((s) => ({ ...s, data: updater(s.data) })) };
}
