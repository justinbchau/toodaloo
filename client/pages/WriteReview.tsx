import React, { useState } from 'react';
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

export function WriteReview() {
  const navigation = useNavigation();
  const route = useRoute<WriteReviewRoute>();
  const { bathroomId, bathroomName } = route.params;
  const { colors } = useThemeContext();
  const { user } = useUser();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to write a review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        bathroom_id: bathroomId,
        user_id: user.id,
        rating,
        body: body.trim() || '(no comment)',
      });

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
          <Text style={[styles.headerTitle, { color: colors.text1 }]}>Write a Review</Text>
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
        </ScrollView>

        {/* Sticky submit */}
        <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          <PrimaryButton
            title={isSubmitting ? 'Submitting...' : 'Submit Review'}
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
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
