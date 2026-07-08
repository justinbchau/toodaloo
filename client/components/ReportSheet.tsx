import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

// UGC report flow (FAF-17 / Apple 1.2). A single reason-picker sheet reused for
// both bathrooms and reviews — the caller sets `target` to open it. Built on the
// built-in Modal (not @gorhom/bottom-sheet, which is a separate scoped effort)
// and it owns its own submit/confirm/error states inline so it depends on
// nothing outside supabase + the theme.
export type ReportTarget = { type: 'bathroom' | 'review'; id: string };

// Generic reasons that read sensibly for either a bathroom or a review.
const REPORT_REASONS = [
  'Inappropriate or offensive',
  'Inaccurate or misleading',
  'Spam or fake',
  'Safety concern',
  'Other',
];

// Postgres unique_violation — the reporter already filed this exact report.
// Treated as success: the outcome the user wants (it's reported) already holds.
const UNIQUE_VIOLATION = '23505';

const AUTO_DISMISS_MS = 1600;

type Props = {
  target: ReportTarget | null;
  onClose: () => void;
};

export default function ReportSheet({ target, onClose }: Props) {
  const { colors } = useThemeContext();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const visible = target !== null;

  // Fresh slate every time the sheet is (re)opened for — or closed from — a new
  // target. Crucially, cancel any pending auto-dismiss first: this one instance
  // is reused across reports (never remounted), so a leftover timer from a prior
  // submit would otherwise fire and close a freshly-opened sheet mid-interaction.
  useEffect(() => {
    clearTimeout(dismissTimer.current);
    if (target) {
      setSubmitting(false);
      setSubmitted(false);
      setError(null);
    }
  }, [target]);

  // Never let a queued auto-dismiss fire after unmount.
  useEffect(() => () => clearTimeout(dismissTimer.current), []);

  const handleSelect = async (reason: string) => {
    if (!target || !user || submitting) return;
    setSubmitting(true);
    setError(null);

    let failed = false;
    try {
      const { error: insertError } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: target.type,
        target_id: target.id,
        reason,
      });
      // A duplicate report is the same happy outcome, not an error to surface.
      if (insertError && insertError.code !== UNIQUE_VIOLATION) {
        failed = true;
      }
    } catch {
      failed = true;
    } finally {
      setSubmitting(false);
    }

    if (failed) {
      setError("Couldn't submit your report. Try again.");
      return;
    }
    setSubmitted(true);
    dismissTimer.current = setTimeout(onClose, AUTO_DISMISS_MS);
  };

  const targetNoun = target?.type === 'review' ? 'review' : 'listing';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Dimmed backdrop — tap outside to dismiss. */}
      <Pressable
        onPress={onClose}
        accessibilityLabel="Dismiss report"
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        {/* Sheet body. Stop propagation so taps inside don't dismiss. */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface1,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 36,
          }}
        >
          {/* Grabber */}
          <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderMed, marginBottom: 16 }} />

          {!user ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <MaterialCommunityIcons name="account-alert-outline" size={32} color={colors.text3} />
              <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 12, textAlign: 'center' }}>
                Sign in to report
              </Text>
              <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                You need an account to report content.
              </Text>
            </View>
          ) : submitted ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <MaterialCommunityIcons name="check-circle-outline" size={32} color={colors.green} />
              <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 12, textAlign: 'center' }}>
                Thanks — we'll take a look
              </Text>
              <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                Our team reviews reported content and removes anything that breaks the rules.
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Done"
                style={({ pressed }) => ({ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={{ color: colors.purpleText, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17 }}>
                Report this {targetNoun}
              </Text>
              <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, marginTop: 4, marginBottom: 12 }}>
                Why are you reporting this?
              </Text>

              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => handleSelect(reason)}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel={reason}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.surface2,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 8,
                    opacity: pressed || submitting ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14 }}>
                    {reason}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.text3} />
                </Pressable>
              ))}

              {submitting && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                  <ActivityIndicator size="small" color={colors.text3} />
                  <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 }}>Submitting…</Text>
                </View>
              )}

              {error && (
                <Text style={{ color: colors.red, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                  {error}
                </Text>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
