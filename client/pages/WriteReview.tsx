import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../RootStackParams';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { PrimaryButton } from '../components/ui/PrimaryButton';

type WriteReviewRoute = RouteProp<RootStackParamList, 'WriteReview'>;

const NO_COMMENT = '(no comment)';

export function WriteReview() {
  const navigation = useNavigation();
  const route = useRoute<WriteReviewRoute>();
  const { bathroomId, bathroomName } = route.params;
  const { colors } = useThemeContext();
  const { user } = useUser();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load the user's existing review (if any) so this screen edits it in place
  // rather than failing on the unique (user_id, bathroom_id) constraint. The
  // form renders immediately and prefills in the background if a review exists.
  useEffect(() => {
    let active = true;
    const loadExisting = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('reviews')
        .select('rating, body')
        .eq('bathroom_id', bathroomId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (active && data) {
        setIsEditing(true);
        setRating(data.rating ?? 0);
        setBody(data.body && data.body !== NO_COMMENT ? data.body : '');
      }
    };
    loadExisting().catch(() => {
      // Non-fatal: fall back to a blank (create) form.
    });
    return () => {
      active = false;
    };
  }, [bathroomId, user?.id]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to write a review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').upsert(
        {
          bathroom_id: bathroomId,
          user_id: user.id,
          rating,
          body: body.trim() || NO_COMMENT,
        },
        { onConflict: 'user_id,bathroom_id' }
      );

      if (error) {
        Alert.alert('Error', 'Failed to submit your review. Please try again.');
        return;
      }

      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!user) return;
    Alert.alert('Delete review', 'Are you sure you want to delete your review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase
              .from('reviews')
              .delete()
              .eq('bathroom_id', bathroomId)
              .eq('user_id', user.id);
            if (error) {
              Alert.alert('Error', 'Failed to delete your review. Please try again.');
              return;
            }
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Something went wrong. Please try again.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const busy = isSubmitting || isDeleting;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }: { pressed: boolean }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: colors.text1, fontSize: 22 }}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text1 }]}>
            {isEditing ? 'Edit Your Review' : 'Write a Review'}
          </Text>
        </View>

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

          {isEditing && (
            <Pressable
              onPress={handleDelete}
              disabled={busy}
              style={({ pressed }: { pressed: boolean }) => ({ marginTop: 24, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ color: colors.red, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
                {isDeleting ? 'Deleting...' : 'Delete review'}
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Sticky submit */}
        <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          <PrimaryButton
            title={isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
            onPress={handleSubmit}
            disabled={rating === 0 || busy}
          />
        </View>

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
