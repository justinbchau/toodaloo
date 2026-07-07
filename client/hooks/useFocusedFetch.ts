import { Dispatch, SetStateAction, useCallback, useState } from 'react';
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

  const run = useCallback(async () => {
    try {
      const result = await load();
      setData(result);
      setHasError(false);
    } catch (err) {
      console.error('useFocusedFetch: load failed:', err);
      setHasError(true);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      run().finally(() => setIsLoading(false));
    }, [run]),
  );

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await run();
    setIsLoading(false);
  }, [run]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await run();
    setIsRefreshing(false);
  }, [run]);

  return { data, setData, isLoading, isRefreshing, hasError, refetch, refresh };
}
