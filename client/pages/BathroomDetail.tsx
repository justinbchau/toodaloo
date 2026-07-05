import React, { useState, useCallback, useContext } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Share, Linking, Alert, ActivityIndicator, Platform,
} from 'react-native';
import MapView from 'react-native-maps';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootStackParams';
import { useThemeContext } from '../context/ThemeContext';
import { Chip } from '../components/ui/Chip';
import { SectionLabel } from '../components/ui/SectionLabel';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { LocationCtx } from '../context/context';
import { haversine, formatDistance } from '../utils/geo';
import { SkeletonReviewCard } from '../components/SkeletonReviewCard';

type DetailRoute = RouteProp<RootStackParamList, 'BathroomDetail'>;

export function BathroomDetail() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DetailRoute>();
  const { id, name, lat, lng } = route.params;
  const { user } = useUser();
  const { location: userLocation } = useContext(LocationCtx);

  const [bathroomData, setBathroomData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Compute distance
  const distance = userLocation
    ? formatDistance(haversine(userLocation.coords.latitude, userLocation.coords.longitude, lat, lng))
    : '— mi';

  // Refetch on focus so a newly written review (and its effect on the rating)
  // shows immediately when returning from the WriteReview screen.
  useFocusEffect(
    useCallback(() => {
      const fetchBathroom = async () => {
        setIsLoading(true);
        const { data } = await supabase
          .from('bathrooms')
          .select('*')
          .eq('id', id)
          .single();
        setBathroomData(data);
        setIsLoading(false);
      };

      const fetchReviews = async () => {
        setIsLoadingReviews(true);
        const { data } = await supabase
          .from('reviews_with_authors')
          .select('*')
          .eq('bathroom_id', id)
          .order('created_at', { ascending: false });
        setReviews(data ?? []);
        setIsLoadingReviews(false);
      };

      const checkSaved = async () => {
        if (!user) return;
        const { data } = await supabase
          .from('saved_bathrooms')
          .select('bathroom_id')
          .eq('user_id', user.id)
          .eq('bathroom_id', id)
          .maybeSingle();
        setIsSaved(!!data);
      };

      fetchBathroom();
      fetchReviews();
      checkSaved();
    }, [id, user?.id])
  );

  const handleSave = async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_bathrooms')
          .delete()
          .eq('user_id', user.id)
          .eq('bathroom_id', id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_bathrooms')
          .insert({ user_id: user.id, bathroom_id: id });
        setIsSaved(true);
      }
    } catch {
      Alert.alert('Error', 'Could not update saved status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReview = () => {
    navigation.navigate('WriteReview', { bathroomId: id, bathroomName: name });
  };

  const handleShare = async () => {
    await Share.share({ message: `Check out ${name} on TooDaLoo!` });
  };

  const handleNavigate = async () => {
    const label = encodeURIComponent(name);
    // Apple Maps on iOS, Google Maps elsewhere; fall back to a universal URL.
    const primary = Platform.select({
      ios: `maps://?daddr=${lat},${lng}&q=${label}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    })!;
    const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    try {
      const canOpen = await Linking.canOpenURL(primary);
      await Linking.openURL(canOpen ? primary : webFallback);
    } catch {
      try {
        await Linking.openURL(webFallback);
      } catch {
        Alert.alert('Error', 'Could not open maps.');
      }
    }
  };

  const handleReport = () => {
    Linking.openURL(
      `mailto:hello@toodaloo.app?subject=Report: ${encodeURIComponent(name)}&body=I'd like to report this bathroom listing.`
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple} size="large" />
      </View>
    );
  }

  const avgRating = Number(bathroomData?.rating_avg ?? 0);
  const reviewCount = bathroomData?.review_count ?? 0;
  const filled = Math.round(avgRating);
  const stars = '★'.repeat(filled) + '☆'.repeat(5 - filled);
  const amenities: string[] = bathroomData?.tags ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* Map peek — 195px */}
      <View style={{ height: 195, position: 'relative' }}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        />
        {/* Gradient overlay bottom fade */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: colors.bg, opacity: 0.7 }} />

        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }: { pressed: boolean }) => ({
            position: 'absolute', top: 52, left: 16,
            width: 40, height: 40, borderRadius: 10,
            backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: colors.text1, fontSize: 22 }}>‹</Text>
        </Pressable>

        {/* Navigate pill */}
        <Pressable
          onPress={handleNavigate}
          style={({ pressed }: { pressed: boolean }) => ({
            position: 'absolute', top: 52, right: 16,
            backgroundColor: colors.purple, paddingHorizontal: 16, paddingVertical: 8,
            borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
            Navigate ›
          </Text>
        </Pressable>
      </View>

      {/* Scrollable content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} contentInsetAdjustmentBehavior="automatic">

        {/* Name + badge */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ flex: 1, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text1, lineHeight: 28 }}>
            {name}
          </Text>
          {bathroomData?.is_24_hours && (
            <View style={{ backgroundColor: 'rgba(52,199,122,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: colors.green, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Open</Text>
            </View>
          )}
        </View>

        {/* Meta row: rating, score, distance */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <Text style={{ color: colors.purpleText, fontSize: 16, letterSpacing: 1 }}>{stars}</Text>
          <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 }}>
            {avgRating.toFixed(1)} · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </Text>
          <Text style={{ color: colors.text3, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 }}>
            {distance}
          </Text>
        </View>

        {/* Action buttons row */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          {/* Save */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({ flex: 1, backgroundColor: isSaved ? colors.purpleDim : colors.surface2, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ fontSize: 18, color: isSaved ? colors.yellow : undefined }}>⭐</Text>
            <Text style={{ color: colors.text2, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Save</Text>
          </Pressable>

          {/* Review */}
          <Pressable
            onPress={handleReview}
            style={({ pressed }: { pressed: boolean }) => ({ flex: 1, backgroundColor: colors.surface2, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}
          >
            <MaterialCommunityIcons name="pencil" size={18} color={colors.text2} />
            <Text style={{ color: colors.text2, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Review</Text>
          </Pressable>

          {/* Report */}
          <Pressable
            onPress={handleReport}
            style={({ pressed }: { pressed: boolean }) => ({ flex: 1, backgroundColor: colors.surface2, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}
          >
            <MaterialCommunityIcons name="flag" size={18} color={colors.text2} />
            <Text style={{ color: colors.text2, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Report</Text>
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }: { pressed: boolean }) => ({ flex: 1, backgroundColor: colors.surface2, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}
          >
            <MaterialCommunityIcons name="share-variant" size={18} color={colors.text2} />
            <Text style={{ color: colors.text2, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Share</Text>
          </Pressable>
        </View>

        {/* Amenities */}
        <SectionLabel label="Amenities" style={{ marginTop: 24, marginBottom: 10 } as any} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {amenities.length > 0
            ? amenities.map(a => (
                <Chip key={a} label={a} active={false} onPress={() => {}} />
              ))
            : <Text style={{ color: colors.text3, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>No amenities listed.</Text>
          }
        </View>

        {/* Reviews */}
        <SectionLabel label="Reviews" style={{ marginTop: 24, marginBottom: 10 } as any} />

        {isLoadingReviews ? (
          <>
            <SkeletonReviewCard />
            <SkeletonReviewCard />
          </>
        ) : reviews.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <MaterialCommunityIcons name="note-text-outline" size={40} color={colors.text3} />
            <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 12 }}>
              No reviews yet.
            </Text>
            <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, marginTop: 4 }}>
              Be the first!
            </Text>
            <Pressable
              onPress={handleReview}
              style={({ pressed }: { pressed: boolean }) => ({
                marginTop: 16, backgroundColor: colors.purple,
                borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
                Write First Review
              </Text>
            </Pressable>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={{ backgroundColor: colors.surface2, borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
                  {review.author_username ?? 'Anonymous'}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={{ color: colors.yellow, fontSize: 13, marginTop: 2 }}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </Text>
              <Text style={{ color: colors.text2, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 6, lineHeight: 18 }}>
                {review.body}
              </Text>
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}
