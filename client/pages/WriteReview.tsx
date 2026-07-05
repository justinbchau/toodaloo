import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../RootStackParams';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { PrimaryButton } from '../components/ui/PrimaryButton';

type WriteReviewRoute = RouteProp<RootStackParamList, 'WriteReview'>;

// Older app versions stored this placeholder instead of null for empty bodies.
const LEGACY_EMPTY_BODY = '(no comment)';

export function WriteReview() {
  const navigation = useNavigation();
  const route = useRoute<WriteReviewRoute>();
  const { bathroomId, bathroomName } = route.params;
  const { colors } = useThemeContext();
  const { user } = useUser();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // One review per user per bathroom (unique constraint in the DB) — if the
  // user already reviewed this bathroom, prefill the form and update instead.
  useEffect(() => {
    let active = true;
    const loadExisting = async () => {
      if (!user) {
        setIsLoadingExisting(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('reviews')
          .select('id, rating, body')
          .eq('user_id', user.id)
          .eq('bathroom_id', bathroomId)
          .maybeSingle();
        if (active && data) {
          setExistingReviewId(data.id);
          setRating(data.rating);
          setBody(data.body && data.body !== LEGACY_EMPTY_BODY ? data.body : '');
        }
      } catch {
        // Non-fatal: fall through to the create flow.
      } finally {
        if (active) setIsLoadingExisting(false);
      }
    };
    loadExisting();
    return () => {
      active = false;
    };
  }, [user?.id, bathroomId]);

  const isEditing = existingReviewId !== null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to write a review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { rating, body: body.trim() || null };

      const { error } = existingReviewId
        ? await supabase.from('reviews').update(payload).eq('id', existingReviewId)
        : await supabase.from('reviews').insert({
            bathroom_id: bathroomId,
            user_id: user.id,
            ...payload,
          });

      if (error) {
        if (error.code === '23505') {
          Alert.alert(
            'Already reviewed',
            'You already have a review for this bathroom. Reopen this screen to edit it.',
          );
        } else {
          Alert.alert('Error', 'Failed to submit your review. Please try again.');
        }
        return;
      }

      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = isSubmitting
    ? (isEditing ? 'Updating...' : 'Submitting...')
    : (isEditing ? 'Update Review' : 'Submit Review');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }: { pressed: boolean }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: colors.text1, fontSize: 22 }}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text1 }]}>
            {isEditing ? 'Edit Your Review' : 'Write a Review'}
          </Text>
        </View>

        {isLoadingExisting ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.purple} />
          </View>
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 20 }} contentInsetAdjustmentBehavior="automatic">

              {/* Bathroom name */}
              <Text style={[styles.bathroomName, { color: colors.text1 }]}>{bathroomName}</Text>

              {/* Star rating */}
              <Text style={[styles.label, { color: colors.text3 }]}>How would you rate it?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                    accessibilityState={{ selected: star <= rating }}
                    style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text style={[
                      styles.star,
                      { color: star <= rating ? colors.yellow : colors.text3 },
                    ]}>
                      {star <= rating ? '★' : '☆'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Review text */}
              <Text style={[styles.label, { color: colors.text3, marginTop: 24 }]}>
                Your thoughts? <Text style={{ color: colors.text3, fontSize: 12 }}>(optional)</Text>
              </Text>
              <View style={[styles.textAreaContainer, { backgroundColor: colors.surface2, borderColor: colors.borderMed }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text1, fontFamily: 'PlusJakartaSans_400Regular' }]}
                  multiline
                  maxLength={280}
                  numberOfLines={5}
                  placeholder="Share your experience..."
                  placeholderTextColor={colors.text3}
                  value={body}
                  onChangeText={setBody}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: colors.text3 }]}>{body.length}/280</Text>
              </View>
            </ScrollView>

            {/* Sticky submit */}
            <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
              <PrimaryButton
                title={submitLabel}
                onPress={handleSubmit}
                disabled={rating === 0 || isSubmitting}
              />
            </View>
          </>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20,
  },
  bathroomName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    marginBottom: 24,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  star: {
    fontSize: 40,
  },
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    padding: 20, paddingBottom: 32,
    borderTopWidth: 1,
  },
});
