/**
 * Tests for useFocusedFetch — the shared load/refresh/error state machine that
 * every list screen sits on. Centralizing this is what makes "a load that
 * throws is an error" the single, unavoidable path (the FAF-23 bug was a
 * screen forgetting to do that by hand).
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFocusedFetch } from '../../hooks/useFocusedFetch';

// Run the focus callback once on mount, mirroring initial-focus behavior.
jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return { useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, []) };
});

describe('useFocusedFetch', () => {
  it('loads on focus and exposes the result', async () => {
    const load = jest.fn().mockResolvedValue(['a', 'b']);
    const { result } = renderHook(() => useFocusedFetch(load));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.hasError).toBe(false);
  });

  it('flags hasError when load throws, then recovers on refetch', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(['ok']);

    const { result } = renderHook(() => useFocusedFetch(load));

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.data).toBeNull();

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.hasError).toBe(false);
    expect(result.current.data).toEqual(['ok']);
    errSpy.mockRestore();
  });

  it('drops a stale in-flight load that resolves after a newer one', async () => {
    let resolveA: (v: string[]) => void = () => {};
    const load = jest
      .fn()
      // First (focus) load is slow and manually controlled.
      .mockImplementationOnce(() => new Promise<string[]>((r) => { resolveA = r; }))
      // Second (refetch) load resolves immediately with the fresh result.
      .mockResolvedValueOnce(['B']);

    const { result } = renderHook(() => useFocusedFetch<string[]>(load));

    // Newer run resolves first and wins.
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.data).toEqual(['B']);

    // The stale first load now resolves — it must NOT overwrite the fresh result.
    await act(async () => {
      resolveA(['A']);
      await Promise.resolve();
    });
    expect(result.current.data).toEqual(['B']);
  });

  it('setData applies an optimistic local mutation', async () => {
    const load = jest.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const { result } = renderHook(() => useFocusedFetch<{ id: string }[]>(load));

    await waitFor(() => expect(result.current.data).toHaveLength(2));

    act(() => {
      result.current.setData((prev) => (prev ?? []).filter((x) => x.id !== '1'));
    });

    expect(result.current.data).toEqual([{ id: '2' }]);
  });
});
