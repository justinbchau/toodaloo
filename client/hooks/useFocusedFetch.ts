import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export type FocusedFetch<T> = {
  /** Latest successful result, or null before the first load resolves. */
  data: T | null;
  /** Setter for optimistic local mutations (e.g. removing a deleted row). */
  setData: Dispatch<SetStateAction<T | null>>;
  /** True during the initial load and any retry (full-screen spinner). */
  isLoading: boolean;
  /** True during a pull-to-refresh (keeps the list visible). */
  isRefreshing: boolean;
  /** True when the most recent load threw. */
  hasError: boolean;
  /** Re-run with the full-screen loading indicator (Retry button). */
  refetch: () => Promise<void>;
  /** Re-run with the pull-to-refresh indicator. */
  refresh: () => Promise<void>;
};

/**
 * Runs `load` on every screen focus and exposes the four-state machine every
 * list screen needs: first-load spinner, pull-to-refresh, and a retryable
 * error flag.
 *
 * Centralizing this is deliberate. When each screen hand-rolled the machine,
 * one forgot to treat a Supabase `{ error }` result as a failure and silently
 * rendered an empty list (the FAF-23 bug). Here, a `load` that throws is the
 * single, unavoidable error path — correct handling is the only path.
 *
 * `load` MUST be a stable reference (wrap it in `useCallback`) — it is the
 * focus effect's dependency, so an unstable one refetches on every render.
 */
export function useFocusedFetch<T>(load: () => Promise<T>): FocusedFetch<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Monotonic run token. Each run captures the current value; only the run that
  // still matches `runId.current` when it settles may commit state. This guards
  // the focus → blur → refocus race: a slow earlier fetch that resolves after a
  // newer one (or after the screen blurred) must not clobber the fresh result.
  const runId = useRef(0);

  const run = useCallback(
    async (mode: 'load' | 'refresh') => {
      const id = ++runId.current;
      if (mode === 'load') setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const result = await load();
        if (id !== runId.current) return; // superseded — drop the stale result
        setData(result);
        setHasError(false);
      } catch (err) {
        if (id !== runId.current) return;
        console.error('useFocusedFetch: load failed:', err);
        setHasError(true);
      } finally {
        if (id === runId.current) {
          if (mode === 'load') setIsLoading(false);
          else setIsRefreshing(false);
        }
      }
    },
    [load],
  );

  useFocusEffect(
    useCallback(() => {
      run('load');
      // Invalidate any in-flight run on blur so a late resolve can't write onto
      // a screen the user has already left (and can't clobber the next focus).
      return () => {
        runId.current += 1;
      };
    }, [run]),
  );

  const refetch = useCallback(() => run('load'), [run]);
  const refresh = useCallback(() => run('refresh'), [run]);

  return { data, setData, isLoading, isRefreshing, hasError, refetch, refresh };
}
