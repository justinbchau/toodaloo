import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, Switch, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { FormInput } from '../components/ui/FormInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Chip } from '../components/ui/Chip';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { AMENITY_ICON, DEFAULT_AMENITY_ICON } from '../lib/format';

// AddBathroom is a Tab.Screen but needs to navigate to Success on the root stack.
// useNavigation returns the tab nav, but React Navigation bubbles unrecognized routes
// up to parent navigators — so navigate('Success') resolves via the root stack.
type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

const TAG_OPTIONS = [
  'Gender Neutral', 'Multi Stalls', 'Mirrors',
  'Handicap', 'Keypad Locked', 'Baby Friendly',
];

const ACCESS_OPTIONS: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; description: string }[] = [
  { label: 'Public', icon: 'toilet', description: 'Anyone can walk in' },
  { label: 'Key Required', icon: 'key', description: 'Ask staff for a key or door code' },
  { label: 'Purchase Required', icon: 'cart', description: 'Customers only' },
];

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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* KAV wraps ScrollView + footer in normal flow — no position:absolute on footer.
          See Engineering Trap #5 in CLAUDE.md: absolute footers end up behind keyboard on iOS. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <ScreenHeader variant="large" title="Add a bathroom" subtitle="Help the next person in need." />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* ── Details ── */}
          <FormCard title="Details" icon="information-outline">
            <Controller<FormValues>
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput
                  label="Bathroom name"
                  icon="tag-outline"
                  placeholder="e.g. Starbucks on 5th Ave"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={error?.message}
                />
              )}
            />
            <Controller<FormValues>
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput
                  label="Address"
                  icon="map-marker-outline"
                  placeholder="Street address or area"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={error?.message ?? geocodeError ?? undefined}
                  hint="We'll drop a pin on the map from this address."
                />
              )}
            />
          </FormCard>

          {/* ── Access ── */}
          <FormCard title="Who can use it?" icon="door-open">
            <View style={{ gap: 8 }}>
              {ACCESS_OPTIONS.map((opt) => {
                const selected = accessType === opt.label;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => setAccessType(opt.label)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={({ pressed }: { pressed: boolean }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected ? colors.accent : colors.borderMed,
                      backgroundColor: selected ? colors.accentDim : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.accent : colors.surface2 }}>
                      <MaterialCommunityIcons name={opt.icon} size={20} color={selected ? colors.onAccent : colors.text2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: colors.text1 }}>{opt.label}</Text>
                      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.text2, marginTop: 1 }}>{opt.description}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={22}
                      color={selected ? colors.accent : colors.text3}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* 24-hour availability toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderMed }}>
              <View style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenDim }}>
                <MaterialCommunityIcons name="clock-check-outline" size={20} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: colors.text1 }}>Open 24 hours</Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.text2, marginTop: 1 }}>Accessible any time of day</Text>
              </View>
              <Switch
                testID="is-24-hours-toggle"
                value={is24Hours}
                onValueChange={setIs24Hours}
                trackColor={{ false: colors.surface3, true: colors.accent }}
                thumbColor="#fff"
                ios_backgroundColor={colors.surface3}
              />
            </View>
          </FormCard>

          {/* ── Amenities ── */}
          <FormCard title="Amenities" icon="star-four-points-outline" caption="Select all that apply">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TAG_OPTIONS.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  icon={(AMENITY_ICON[tag] ?? DEFAULT_AMENITY_ICON) as keyof typeof MaterialCommunityIcons.glyphMap}
                  active={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>
          </FormCard>
        </ScrollView>

        {/* Footer in normal document flow — sits below the flex:1 ScrollView */}
        <View style={{
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
          backgroundColor: colors.bg,
          borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderMed,
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

function FormCard({ title, icon, caption, children }: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; caption?: string; children: React.ReactNode }) {
  const { colors } = useThemeContext();
  return (
    <View style={{ backgroundColor: colors.surface1, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.text2} />
        <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: colors.text1, letterSpacing: -0.3 }}>{title}</Text>
        {caption ? <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: colors.text3 }}>{caption}</Text> : null}
      </View>
      {children}
    </View>
  );
}
