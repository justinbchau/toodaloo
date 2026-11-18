import React, { useState, useCallback, useContext } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Share, Linking, Alert, ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootStackParams';
import { useThemeContext } from '../context/ThemeContext';
import { Chip } from '../components/ui/Chip';
import { IconButton, IconName } from '../components/ui/IconButton';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { StarRating } from '../components/ui/StarRating';
import { Fade } from '../components/ui/Fade';
import { ErrorState } from '../components/ErrorState';
import { useInsets } from '../hooks/useInsets';
import { ACCESS_ICON, DEFAULT_ACCESS_ICON } from '../lib/accessIcons';
import { accessLabel, AMENITY_ICON, DEFAULT_AMENITY_ICON, initial, relativeDate } from '../lib/format';
import { SectionLabel } from '../components/ui/SectionLabel';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { LocationCtx } from '../context/context';
import { haversine, formatDistance } from '../utils/geo';
import { SkeletonReviewCard } from '../components/SkeletonReviewCard';
import ReportSheet, { ReportTarget } from '../components/ReportSheet';

type DetailRoute = RouteProp<RootStackParamList, 'BathroomDetail'>;

export function BathroomDetail() {
  const { colors, isDark } = useThemeContext();
  const insets = useInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DetailRoute>();
  const { id, name, lat, lng } = route.params;
  const { user } = useUser();
  const { center } = useContext(LocationCtx);

  const [bathroomData, setBathroomData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  // Non-null while the report reason-picker is open; carries what's being reported.
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  // Compute distance
  const distance = center
    ? formatDistance(haversine(center.lat, center.lng, lat, lng))
    : null;

  // Refetch on focus so a newly written review (and its effect on the rating)
  // shows immediately when returning from the WriteReview screen.
  useFocusEffect(
    useCallback(() => {
      const fetchBathroom = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('bathrooms')
            .select('*')
            .eq('id', id)
            .single();
          if (error || !data) {
            setLoadError(true);
          } else {
            setBathroomData(data);
            setLoadError(false);
          }
        } catch {
          setLoadError(true);
        } finally {
          setIsLoading(false);
        }
      };

      const fetchReviews = async () => {
        setIsLoadingReviews(true);
        try {
          const { data, error } = await supabase
            .from('reviews_with_authors')
            .select('*')
            .eq('bathroom_id', id)
            .order('created_at', { ascending: false });
          if (error) {
            setReviewsError(true);
          } else {
            setReviews(data ?? []);
            setReviewsError(false);
          }
        } catch {
          setReviewsError(true);
        } finally {
          setIsLoadingReviews(false);
        }
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
    }, [id, user?.id, retryKey])
  );

  const handleSave = async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_bathrooms')
          .delete()
          .eq('user_id', user.id)
          .eq('bathroom_id', id);
        if (error) {
          Alert.alert('Error', 'Could not update saved status.');
          return;
        }
        setIsSaved(false);
      } else {
        const { error } = await supabase
          .from('saved_bathrooms')
          .insert({ user_id: user.id, bathroom_id: id });
        if (error) {
          Alert.alert('Error', 'Could not update saved status.');
          return;
        }
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
    setReportTarget({ type: 'bathroom', id });
  };

  // Loading state — keep a way out while the first fetch is in flight.
  if (isLoading && !bathroomData) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 2 }}>
          <IconButton icon="chevron-left" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.purple} size="large" />
        </View>
      </View>
    );
  }

  // Fetch-failure state — don't render stale route params as if they loaded.
  if (loadError || !bathroomData) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
        <ErrorState
          title="Couldn't load this bathroom"
          retryAccessibilityLabel="Retry loading bathroom"
          onRetry={() => setRetryKey((k) => k + 1)}
        />
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }: { pressed: boolean }) => ({ alignSelf: 'center', padding: 12, opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const avgRating = Number(bathroomData?.rating_avg ?? 0);
  const reviewCount = bathroomData?.review_count ?? 0;
  const amenities: string[] = bathroomData?.tags ?? [];
  const access = bathroomData?.access_type ?? null;
  const address: string | null = bathroomData?.address ?? null;

  // Star distribution from the loaded reviews (5 → 1).
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxBucket = Math.max(1, ...distribution.map((d) => d.count));

  const actions: { key: string; label: string; icon: IconName; onPress: () => void; a11y: string; active?: boolean }[] = [
    {
      key: 'save',
      label: 'Save',
      icon: isSaved ? 'bookmark' : 'bookmark-outline',
      onPress: handleSave,
      a11y: isSaved ? 'Remove from saved bathrooms' : 'Save this bathroom',
      active: isSaved,
    },
    { key: 'review', label: 'Review', icon: 'star-outline', onPress: handleReview, a11y: 'Write a review' },
    { key: 'share', label: 'Share', icon: 'share-variant-outline', onPress: handleShare, a11y: 'Share this bathroom' },
    { key: 'report', label: 'Report', icon: 'flag-outline', onPress: handleReport, a11y: 'Report this listing' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero map ── */}
        <View style={{ height: HERO_HEIGHT + insets.top }}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{ latitude: lat - 0.0012, longitude: lng, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            userInterfaceStyle={isDark ? 'dark' : 'light'}
          >
            <Marker coordinate={{ latitude: lat, longitude: lng }} anchor={{ x: 0.5, y: 1 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.heroPin, { backgroundColor: colors.purple }]}>
                  <MaterialCommunityIcons
                    name={(ACCESS_ICON[access ?? ''] ?? DEFAULT_ACCESS_ICON) as IconName}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={[styles.pinTail, { borderTopColor: colors.purple }]} />
              </View>
            </Marker>
          </MapView>
          <Fade color={colors.bg} direction="up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }} />
        </View>

        {/* ── Title block ── */}
        <View style={{ paddingHorizontal: 20, marginTop: -28 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <Badge
              icon={(ACCESS_ICON[access ?? ''] ?? DEFAULT_ACCESS_ICON) as IconName}
              label={accessLabel(access)}
              fg={colors.purpleText}
              bg={colors.purpleDim}
            />
            {bathroomData?.is_24_hours && (
              <Badge icon="clock-check-outline" label="Open 24/7" fg={colors.green} bg={colors.greenDim} />
            )}
          </View>

          <Text style={[styles.title, { color: colors.text1 }]}>{name}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <StarRating rating={avgRating} size={16} />
            <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
              {avgRating.toFixed(1)}
            </Text>
            <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14 }}>
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </Text>
          </View>

          {distance || address ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              {distance ? (
                <>
                  <MaterialCommunityIcons name="walk" size={16} color={colors.purpleText} />
                  <Text style={{ color: colors.purpleText, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>{distance}</Text>
                </>
              ) : (
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.text2} />
              )}
              {address ? (
                <Text numberOfLines={1} style={{ flex: 1, color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 }}>
                  {distance ? '· ' + address : address}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ── Actions ── */}
          <PrimaryButton
            title="Directions"
            icon="navigation-variant"
            onPress={handleNavigate}
            accessibilityLabel={`Get directions to ${name}`}
            style={{ marginTop: 20 }}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                accessibilityRole="button"
                accessibilityLabel={a.a11y}
                accessibilityState={a.key === 'save' ? { selected: isSaved } : undefined}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.actionTile,
                  {
                    backgroundColor: a.active ? colors.purpleDim : colors.surface1,
                    borderColor: a.active ? colors.purpleGlow : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name={a.icon} size={21} color={a.active ? colors.purpleText : colors.text1} />
                <Text style={{ color: a.active ? colors.purpleText : colors.text2, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ── Amenities ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <SectionLabel label="Amenities" style={{ marginBottom: 12 }} />
          {amenities.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {amenities.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  active={false}
                  icon={(AMENITY_ICON[a] ?? DEFAULT_AMENITY_ICON) as IconName}
                />
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.text2, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' }}>No amenities listed.</Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ── Reviews ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionLabel label="Reviews" style={{ marginBottom: 0 }} />
            {reviews.length > 0 && (
              <Pressable onPress={handleReview} hitSlop={8} accessibilityRole="button">
                <Text style={{ color: colors.purpleText, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>Write a review</Text>
              </Pressable>
            )}
          </View>

          {isLoadingReviews ? (
            <>
              <SkeletonReviewCard />
              <SkeletonReviewCard />
            </>
          ) : reviewsError ? (
            <View style={[styles.inlineCard, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="cloud-off-outline" size={22} color={colors.text3} />
              <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, marginTop: 8 }}>
                Couldn't load reviews.
              </Text>
              <Pressable
                onPress={() => setRetryKey((k) => k + 1)}
                accessibilityRole="button"
                accessibilityLabel="Retry loading reviews"
                style={({ pressed }: { pressed: boolean }) => ({ marginTop: 6, padding: 8, opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={{ color: colors.purpleText, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : reviews.length === 0 ? (
            <View style={[styles.inlineCard, { backgroundColor: colors.surface1, borderColor: colors.border, paddingVertical: 28 }]}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.yellowDim, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="star-outline" size={28} color={colors.yellow} />
              </View>
              <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginTop: 12 }}>
                No reviews yet.
              </Text>
              <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, marginTop: 4 }}>
                Be the first!
              </Text>
              <PrimaryButton title="Write First Review" size="md" onPress={handleReview} style={{ marginTop: 16, paddingHorizontal: 24 }} />
            </View>
          ) : (
            <>
              {/* Rating summary */}
              <View style={[styles.summary, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
                <View style={{ alignItems: 'center', width: 96 }}>
                  <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 40, letterSpacing: -1.5 }}>
                    {avgRating.toFixed(1)}
                  </Text>
                  <StarRating rating={avgRating} size={13} />
                  <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, marginTop: 4 }}>
                    {reviewCount} total
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  {distribution.map((d) => (
                    <View key={d.star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ width: 10, color: colors.text2, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 }}>{d.star}</Text>
                      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surface3, overflow: 'hidden' }}>
                        <View style={{ width: `${(d.count / maxBucket) * 100}%`, height: '100%', borderRadius: 3, backgroundColor: colors.yellow }} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {reviews.map((review) => (
                <View key={review.id} style={[styles.review, { borderBottomColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.avatar, { backgroundColor: colors.purpleDim }]}>
                      <Text style={{ color: colors.purpleText, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15 }}>
                        {initial(review.author_username)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
                        {review.author_username ?? 'Anonymous'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <StarRating rating={review.rating} size={12} />
                        <Text style={{ color: colors.text3, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>
                          {relativeDate(review.created_at)}
                        </Text>
                      </View>
                    </View>
                    {/* Report affordance — hidden on the user's own reviews. */}
                    {user?.id !== review.user_id && (
                      <Pressable
                        onPress={() => setReportTarget({ type: 'review', id: review.id })}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel="Report this review"
                      >
                        <MaterialCommunityIcons name="flag-outline" size={17} color={colors.text3} />
                      </Pressable>
                    )}
                  </View>
                  {review.body ? (
                    <Text style={{ color: colors.text1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 10, lineHeight: 21 }}>
                      {review.body}
                    </Text>
                  ) : null}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating top controls stay put while the page scrolls */}
      <View style={[styles.topControls, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton variant="glass" icon="chevron-left" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <IconButton variant="glass" icon="share-variant-outline" accessibilityLabel="Share" onPress={handleShare} />
          <IconButton
            variant="glass"
            icon={isSaved ? 'bookmark' : 'bookmark-outline'}
            iconColor={isSaved ? colors.purpleText : undefined}
            accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
            onPress={handleSave}
          />
        </View>
      </View>

      <ReportSheet target={reportTarget} onClose={() => setReportTarget(null)} />
    </View>
  );
}

function Badge({ icon, label, fg, bg }: { icon: IconName; label: string; fg: string; bg: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }}>
      <MaterialCommunityIcons name={icon} size={14} color={fg} />
      <Text style={{ color: fg, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>{label}</Text>
    </View>
  );
}

const HERO_HEIGHT = 240;

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.8,
    lineHeight: 33,
  },
  heroPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  topControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  divider: { height: 8, marginVertical: 24, opacity: 0.6 },
  inlineCard: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  review: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
