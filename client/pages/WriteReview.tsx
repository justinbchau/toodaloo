import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../RootStackParams';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [focused, setFocused] = useState(false);

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

  const caption = rating === 0 ? 'Tap a star to rate' : RATING_LABELS[rating - 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <ScreenHeader
          title={isEditing ? 'Edit Your Review' : 'Write a Review'}
          leadingIcon="close"
        />

        {isLoadingExisting ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.purple} />
          </View>
        ) : (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Bathroom being reviewed */}
              <View style={[styles.subject, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
                <View style={[styles.subjectIcon, { backgroundColor: colors.purpleDim }]}>
                  <MaterialCommunityIcons name="toilet" size={22} color={colors.purpleText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bathroomName, { color: colors.text1 }]} numberOfLines={2}>{bathroomName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialCommunityIcons name="earth" size={12} color={colors.text3} />
                    <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: colors.text2 }}>
                      Posted publicly under your username
                    </Text>
                  </View>
                </View>
              </View>

              {/* Star rating */}
              <Text style={[styles.question, { color: colors.text1 }]}>How was it?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                    accessibilityState={{ selected: star <= rating }}
                    style={({ pressed }: { pressed: boolean }) => ({ transform: [{ scale: pressed ? 0.9 : 1 }] })}
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
              <Text style={[styles.caption, { color: rating === 0 ? colors.text3 : colors.text1 }]}>{caption}</Text>

              {/* Review text */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 32, marginBottom: 10 }}>
                <Text style={[styles.label, { color: colors.text1 }]}>
                  Tell others more <Text style={{ color: colors.text3, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>(optional)</Text>
                </Text>
              </View>
              <View style={[styles.textAreaContainer, { backgroundColor: colors.surface1, borderColor: focused ? colors.purple : colors.borderMed, borderWidth: focused ? 1.5 : 1 }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text1, fontFamily: 'PlusJakartaSans_400Regular' }]}
                  multiline
                  maxLength={280}
                  numberOfLines={5}
                  placeholder="Share your experience..."
                  placeholderTextColor={colors.text3}
                  value={body}
                  onChangeText={setBody}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: body.length >= 260 ? colors.yellow : colors.text3 }]}>{body.length}/280</Text>
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.text3, marginTop: 10, lineHeight: 17 }}>
                Cleanliness, supplies, wait time, how to get the key — anything that helps the next person.
              </Text>
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

const RATING_LABELS = ['Awful', 'Not great', 'It was okay', 'Pretty good', 'Spotless!'];

const styles = StyleSheet.create({
  subject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bathroomName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
  question: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginTop: 32,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  star: {
    fontSize: 48,
    lineHeight: 56,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
  },
  textAreaContainer: {
    borderRadius: 16,
    padding: 14,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
