import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from './ThemeContext';
import { useInsets } from '../hooks/useInsets';
import { shadows } from '../theme/shadows';

export type ToastOptions = {
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Optional inline action, e.g. "Undo" or "View". */
  actionLabel?: string;
  /** Runs when the action is tapped. `onCommit` is then skipped. */
  onAction?: () => void;
  /**
   * Runs when the toast goes away *without* its action being tapped — on
   * timeout, when replaced by another toast, or when the host unmounts. Use it
   * to commit a deferred destructive change (the "undo window" pattern).
   */
  onCommit?: () => void;
  durationMs?: number;
};

type ToastContextType = { showToast: (opts: ToastOptions) => void };

// With no host mounted (isolated renders, tests) there's no undo window, so
// commit straight away rather than silently dropping the change.
const ToastContext = createContext<ToastContextType>({
  showToast: (opts) => opts.onCommit?.(),
});

const DEFAULT_DURATION_MS = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeContext();
  const insets = useInsets();
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const current = useRef<ToastOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const anim = useRef(new Animated.Value(0)).current;

  // Settle the active toast exactly once: either its action ran, or it commits.
  const settle = useCallback((viaAction: boolean) => {
    const t = current.current;
    current.current = null;
    clearTimeout(timer.current);
    if (!t) return;
    if (viaAction) t.onAction?.();
    else t.onCommit?.();
  }, []);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      settle(false); // a new toast commits whatever the previous one was holding
      current.current = opts;
      setToast({ ...opts, key: Date.now() });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
      timer.current = setTimeout(() => {
        settle(false);
        hide();
      }, opts.durationMs ?? DEFAULT_DURATION_MS);
    },
    [anim, hide, settle],
  );

  // Never lose a pending commit if the host goes away.
  useEffect(() => () => settle(false), [settle]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-start' }]}>
          <Animated.View
            key={toast.key}
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                marginTop: insets.top + 8,
                backgroundColor: colors.primary,
                shadowColor: colors.shadow,
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
              },
            ]}
          >
            {toast.icon ? <MaterialCommunityIcons name={toast.icon} size={18} color={colors.onPrimary} /> : null}
            <Text style={[styles.message, { color: colors.onPrimary }]} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel ? (
              <Pressable
                onPress={() => {
                  settle(true);
                  hide();
                }}
                hitSlop={10}
                accessibilityRole="button"
                style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={[styles.action, { color: colors.onPrimary }]}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadows.md,
    shadowOpacity: 0.25,
  },
  message: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' },
  action: { fontSize: 14, fontFamily: 'PlusJakartaSans_800ExtraBold', textDecorationLine: 'underline' },
});
