import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../RootStackParams';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import BackButton from '../components/BackButton';
import { FormInput } from '../components/ui/FormInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Chip } from '../components/ui/Chip';
import { AmenityToggle } from '../components/AmenityToggle';
import { SectionLabel } from '../components/ui/SectionLabel';

// AddBathroom is a Tab.Screen but needs to navigate to Success on the root stack.
// useNavigation returns the tab nav, but React Navigation bubbles unrecognized routes
// up to parent navigators — so navigate('Success') resolves via the root stack.
type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

const TAG_OPTIONS = [
  'Gender Neutral', 'Multi Stalls', 'Mirrors',
  'Handicap', 'Keypad Locked', 'Baby Friendly',
];

const ACCESS_OPTIONS = ['Public', 'Key Required', 'Purchase Required'];

const ACCESS_TYPE_MAP: Record<string, string> = {
  'Public': 'public',
  'Key Required': 'key_required',
  'Purchase Required': 'purchase_required',
};

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  address: z.string().min(1, 'Address is required'),
});

type FormValues = z.infer<typeof schema>;

export function AddBathroom() {
  const rootNavigation = useNavigation<RootNavProp>();
  const { colors } = useThemeContext();
  const { user } = useUser();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [accessType, setAccessType] = useState('Public');
  const [is24Hours, setIs24Hours] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', address: '' },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Radius (km) within which an existing bathroom is treated as a likely duplicate.
  const DUPLICATE_RADIUS_KM = 0.05; // ~50 meters

  const insertBathroom = async (values: FormValues, lat: number, lng: number) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('bathrooms').insert({
        name: values.title,
        address: values.address,
        lat,
        lng,
        tags: selectedTags,
        access_type: ACCESS_TYPE_MAP[accessType] ?? 'public',
        is_24_hours: is24Hours,
        created_by: user?.id ?? null,
      });

      if (error) {
        console.error('AddBathroom insert error:', error);
        Alert.alert('Error', 'Failed to submit bathroom. Please try again.');
        return;
      }

      reset();
      setSelectedTags([]);
      setAccessType('Public');
      setIs24Hours(false);

      rootNavigation.navigate('Success');
    } catch (err) {
      console.error('AddBathroom insert error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    setGeocodeError(null);

    let geocodeTimerId: ReturnType<typeof setTimeout> | undefined;
    try {
      const geocodeTimeout = new Promise<never>((_, reject) => {
        geocodeTimerId = setTimeout(() => reject(new Error('Geocode timeout')), 10000);
      });
      const results = await Promise.race([
        Location.geocodeAsync(values.address),
        geocodeTimeout,
      ]);
      if (!results || results.length === 0) {
        setGeocodeError("Couldn't find that address. Try being more specific.");
        setIsSubmitting(false);
        return;
      }

      const { latitude: lat, longitude: lng } = results[0];

      // Warn if a bathroom already exists at essentially the same spot.
      let nearby: any[] = [];
      try {
        const { data } = await supabase.rpc('bathrooms_nearby', {
          user_lat: lat,
          user_lng: lng,
          radius_km: DUPLICATE_RADIUS_KM,
        });
        nearby = data ?? [];
      } catch (err) {
        // Duplicate check is best-effort; proceed if it fails.
        console.error('AddBathroom duplicate check failed:', err);
      }

      if (nearby.length > 0) {
        const nearest = nearby[0];
        setIsSubmitting(false);
        Alert.alert(
          'Possible duplicate',
          `"${nearest.name}" is already listed near this address. Add this one anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'View existing',
              onPress: () =>
                rootNavigation.navigate('BathroomDetail', {
                  id: nearest.id,
                  name: nearest.name,
                  lat: nearest.lat,
                  lng: nearest.lng,
                }),
            },
            {
              text: 'Add anyway',
              style: 'destructive',
              onPress: () => insertBathroom(values, lat, lng),
            },
          ]
        );
        return;
      }

      await insertBathroom(values, lat, lng);
    } catch (err) {
      console.error('AddBathroom submit error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    } finally {
      clearTimeout(geocodeTimerId);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* KAV wraps ScrollView + footer in normal flow — no position:absolute on footer.
          See Engineering Trap #5 in CLAUDE.md: absolute footers end up behind keyboard on iOS. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
          <BackButton />
          <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: colors.text1, flex: 1 }}>
            add a bathroom
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Name field */}
          <Controller<FormValues>
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormInput
                label="Bathroom name"
                placeholder="e.g. Starbucks on 5th Ave"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={error?.message}
              />
            )}
          />

          {/* Address field */}
          <Controller<FormValues>
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormInput
                label="Address"
                placeholder="Street address or area"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={error?.message}
              />
            )}
          />

          {geocodeError && (
            <Text style={{
              color: colors.red,
              fontSize: 12,
              fontFamily: 'PlusJakartaSans_400Regular',
              marginTop: -12,
            }}>
              {geocodeError}
            </Text>
          )}

          {/* Access type chips */}
          <View style={{ gap: 8 }}>
            <SectionLabel label="Access type" />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {ACCESS_OPTIONS.map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  active={accessType === opt}
                  onPress={() => setAccessType(opt)}
                />
              ))}
            </View>
          </View>

          {/* 24-hour availability toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionLabel label="Open 24 hours" />
            <Switch
              testID="is-24-hours-toggle"
              value={is24Hours}
              onValueChange={setIs24Hours}
              trackColor={{ false: colors.surface3, true: colors.purple }}
              thumbColor={colors.text1}
            />
          </View>

          {/* Amenities 2-col grid */}
          <View style={{ gap: 8 }}>
            <SectionLabel label="Amenities" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TAG_OPTIONS.map(tag => (
                <View key={tag} style={{ width: '48%' }}>
                  <AmenityToggle
                    label={tag}
                    active={selectedTags.includes(tag)}
                    onToggle={() => toggleTag(tag)}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer in normal document flow — sits below the flex:1 ScrollView */}
        <View style={{
          padding: 20, paddingBottom: 32,
          backgroundColor: colors.bg,
          borderTopWidth: 1, borderTopColor: colors.border,
        }}>
          <PrimaryButton
            title={isSubmitting ? 'Submitting...' : 'Submit bathroom →'}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
