import React, { useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Linking, ScrollView, AppState, Animated } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ACCESS_ICON, DEFAULT_ACCESS_ICON } from '../lib/accessIcons';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import LocationSearch from '../components/LocationSearch';
import { BathroomSheet } from '../components/BathroomSheet';
import { toCardData, ListBathroom } from '../lib/bathroomCard';
import { useNow } from '../hooks/useNow';
import { Chip } from '../components/ui/Chip';
import { IconButton } from '../components/ui/IconButton';
import { NearestCard } from '../components/NearestCard';
import { openDirections } from '../lib/directions';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Fade } from '../components/ui/Fade';
import { shadows } from '../theme/shadows';
import { useThemeContext } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../RootStackParams';
import { LocationCtx } from '../context/context';
import { haversine, formatWalkTime, KM_TO_MILES, MILES_TO_KM } from '../utils/geo';

// checking — reading the current permission without prompting
// prompt   — never asked: show our priming screen before the one-shot OS prompt
// denied   — OS won't ask again: point to Settings (or search instead)
// granted  — GPS fix acquired
// manual   — no GPS (declined / unavailable): browse by searching an area
type LocationStatus = 'checking' | 'prompt' | 'denied' | 'granted' | 'manual';

// Wide view of the continental US for manual mode, until the user searches.
const MANUAL_REGION = { latitude: 39.5, longitude: -98.35, latitudeDelta: 38, longitudeDelta: 38 };
type MapNavProp = NativeStackNavigationProp<RootStackParamList>;
type TabNavProp = BottomTabNavigationProp<MainTabParamList>;

type MapBathroom = ListBathroom;

const ACCESS_FILTERS: { label: string; value: string }[] = [
    { label: 'Public', value: 'public' },
    { label: 'Key Required', value: 'key_required' },
    { label: 'Purchase Required', value: 'purchase_required' },
];

const DEFAULT_RADIUS_KM = 5.0;
// How far the user must pan (km) before the "Search this area" button appears.
const SEARCH_HERE_THRESHOLD_KM = 1.0;

const transformBathroom = (b: any, now: Date): MapBathroom =>
    toCardData(b, b.distance_km != null ? formatWalkTime(b.distance_km * KM_TO_MILES) : 'Nearby', now);

// Approximate the visible radius (km) from the region's latitude span.
const radiusFromRegion = (region: Region): number => {
    const km = (region.latitudeDelta * 111) / 2;
    return Math.min(40, Math.max(1, km));
};

export function Map() {
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('checking');
    // The pin the user tapped; shows a floating preview instead of the sheet.
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [location, setLocalLocation] = useState<LocationObject | null>(null);
    // Raw RPC rows; cards (incl. open/closed status) are derived from them on
    // every clock tick so "Open now" never freezes at fetch time.
    const [rows, setRows] = useState<any[]>([]);
    const now = useNow();
    const bathrooms = useMemo(() => rows.map((r) => transformBathroom(r, now)), [rows, now]);
    const [isFetchingBathrooms, setIsFetchingBathrooms] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [showSearchHere, setShowSearchHere] = useState(false);
    const [accessFilter, setAccessFilter] = useState<string | null>(null);
    // "Open now" uses opening hours (incl. 24h places); unknown hours are excluded.
    const [openNowFilter, setOpenNowFilter] = useState(false);
    // Bumped to tell LocationSearch to clear its query/✕ when the map is reset from
    // outside the search box (e.g. the ◎ recenter FAB).
    const [searchResetSignal, setSearchResetSignal] = useState(0);

    const mapRef = useRef<MapView>(null);
    const currentRegion = useRef<Region | null>(null);
    const lastFetchedCenter = useRef<{ lat: number; lng: number } | null>(null);
    // The center of the most recent fetch *request* (set before the await), so a
    // Retry after a failed fetch re-targets that center — not the last successful
    // one. Without this, retrying a failed search reloads the previous location.
    const lastRequestedCenter = useRef<{ lat: number; lng: number } | null>(null);

    const navigation = useNavigation<MapNavProp>();
    const tabNavigation = useNavigation<TabNavProp>();
    const { colors, isDark } = useThemeContext();
    const insets = useSafeAreaInsets();
    const { setCenter } = useContext(LocationCtx);

    const setLocation = (loc: LocationObject) => {
        setLocalLocation(loc);
        setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    };

    const fetchBathrooms = useCallback(async (lat: number, lng: number, radiusKm: number) => {
        lastRequestedCenter.current = { lat, lng };
        setIsFetchingBathrooms(true);
        setFetchError(false);
        try {
            const { data, error } = await supabase.rpc('bathrooms_nearby', {
                user_lat: lat,
                user_lng: lng,
                radius_km: radiusKm,
            });

            if (error) throw error;

            setRows(data ?? []);
            lastFetchedCenter.current = { lat, lng };
            setShowSearchHere(false);
        } catch (err) {
            console.error('Failed to fetch bathrooms:', err);
            setFetchError(true);
        } finally {
            setIsFetchingBathrooms(false);
        }
    }, []);

    const acquirePosition = useCallback(async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            setLocationStatus('granted');
        } catch {
            // Permission is fine but no fix (e.g. Location Services off): browse manually.
            setLocationStatus('manual');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Read the permission WITHOUT prompting. iOS only shows its prompt once, so a
    // first-run user sees our priming screen first and asks only on intent.
    const checkPermission = useCallback(async () => {
        try {
            const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                await acquirePosition();
            } else if (canAskAgain) {
                setLocationStatus('prompt');
            } else {
                setLocationStatus('denied');
            }
        } catch {
            setLocationStatus('prompt');
        }
    }, [acquirePosition]);

    const requestPermission = useCallback(async () => {
        try {
            const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationStatus('checking');
                await acquirePosition();
            } else {
                setLocationStatus(canAskAgain ? 'manual' : 'denied');
            }
        } catch (err) {
            // Never strand the user on the priming screen: fall back to search.
            console.error('Location permission request failed:', err);
            setLocationStatus('manual');
        }
    }, [acquirePosition]);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    const locationStatusRef = useRef(locationStatus);
    locationStatusRef.current = locationStatus;

    // Coming back from Settings: re-check so enabling location there just works.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active' && locationStatusRef.current === 'denied') checkPermission();
        });
        return () => sub.remove();
    }, [checkPermission]);

    // Initial fetch once location is acquired
    useEffect(() => {
        if (!location) return;
        fetchBathrooms(location.coords.latitude, location.coords.longitude, DEFAULT_RADIUS_KM);
    }, [location, fetchBathrooms]);

    const onRegionChangeComplete = useCallback((region: Region) => {
        currentRegion.current = region;
        const center = lastFetchedCenter.current;
        if (!center) return;
        const movedKm =
            haversine(center.lat, center.lng, region.latitude, region.longitude) * MILES_TO_KM;
        if (movedKm > SEARCH_HERE_THRESHOLD_KM) {
            setShowSearchHere(true);
        }
    }, []);

    const searchThisArea = () => {
        const region = currentRegion.current;
        if (!region) return;
        fetchBathrooms(region.latitude, region.longitude, radiusFromRegion(region));
    };

    const retryFetch = () => {
        // Prefer the requested center so retrying a failed search reloads that
        // location, not the last one that happened to succeed.
        const center = lastRequestedCenter.current ?? lastFetchedCenter.current;
        const region = currentRegion.current;
        if (center) {
            fetchBathrooms(center.lat, center.lng, region ? radiusFromRegion(region) : DEFAULT_RADIUS_KM);
        } else if (location) {
            fetchBathrooms(location.coords.latitude, location.coords.longitude, DEFAULT_RADIUS_KM);
        }
    };

    // Default deltas match the map's initialRegion (neighborhood browse zoom).
    const animateTo = (lat: number, lng: number, latDelta = 0.0922, lngDelta = 0.0421) => {
        mapRef.current?.animateToRegion(
            { latitude: lat, longitude: lng, latitudeDelta: latDelta, longitudeDelta: lngDelta },
            500
        );
    };

    // LocationSearch geocoded a query: fly there, refetch around it, and point the
    // shared LocationCtx anchor at the searched center so BathroomDetail's distances
    // stay coherent. Local `location` stays the true GPS fix (the ◎ FAB + reset).
    const onSearchLocation = useCallback((lat: number, lng: number) => {
        animateTo(lat, lng);
        setCenter({ lat, lng });
        fetchBathrooms(lat, lng, DEFAULT_RADIUS_KM);
    }, [fetchBathrooms, setCenter]);

    // Repoint the fetch + LocationCtx anchor back to the GPS fix. Shared by the
    // search-✕ reset and the ◎ FAB; each animates the camera itself so they can use
    // different zoom levels. Returns the GPS coords (or null if not acquired yet).
    const refetchAroundGps = useCallback(() => {
        if (!location) return null;
        const { latitude, longitude } = location.coords;
        setCenter({ lat: latitude, lng: longitude });
        fetchBathrooms(latitude, longitude, DEFAULT_RADIUS_KM);
        return { latitude, longitude };
    }, [location, fetchBathrooms, setCenter]);

    // Clear affordance (search ✕): return to GPS at the wider browse zoom.
    const onResetLocation = useCallback(() => {
        const c = refetchAroundGps();
        if (c) animateTo(c.latitude, c.longitude);
    }, [refetchAroundGps]);

    // The ◎ recenter FAB: same GPS reset as the ✕, but zooms in tight (street level,
    // the original ◎ behavior) and clears any active search in the box, so pressing
    // it after a search can't leave the list/anchor/✕ pointed at the searched location.
    const recenterToGps = useCallback(() => {
        if (!location) {
            // No GPS yet (manual mode): this button is the way to turn it on.
            Location.getForegroundPermissionsAsync()
                .then(({ canAskAgain, status }) => {
                    if (status !== 'granted' && !canAskAgain) Linking.openSettings();
                    else requestPermission();
                })
                .catch(() => {});
            return;
        }
        const c = refetchAroundGps();
        if (c) animateTo(c.latitude, c.longitude, 0.01, 0.01);
        setSearchResetSignal((n) => n + 1);
    }, [refetchAroundGps, location, requestPermission]);

    const activeFilterCount = (accessFilter ? 1 : 0) + (openNowFilter ? 1 : 0);

    const visibleBathrooms = bathrooms.filter((b) => {
        if (accessFilter && b.accessType !== accessFilter) return false;
        if (openNowFilter && b.openState !== 'open' && b.openState !== 'closing_soon') return false;
        return true;
    });

    // The tapped pin, if it survived the current filters/fetch.
    const selected = selectedId ? visibleBathrooms.find((b) => b.id === selectedId) ?? null : null;
    const openDetail = (b: MapBathroom) =>
        navigation.navigate('BathroomDetail', { id: b.id, name: b.name, lat: b.lat, lng: b.lng });

    // --- Checking: brief branded loader ---
    if (locationStatus === 'checking') {
        return (
            <View style={[styles.container, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
                <LottieView
                    style={styles.animation}
                    source={require('../assets/67056-spinner-edited.json')}
                    autoPlay
                    loop
                />
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: colors.text2, marginTop: 4 }}>
                    Finding bathrooms near you…
                </Text>
            </View>
        );
    }

    // --- Prompt (priming) / Denied: explain before (or instead of) the OS prompt ---
    if (locationStatus === 'prompt' || locationStatus === 'denied') {
        const priming = locationStatus === 'prompt';
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 28, paddingTop: insets.top, paddingBottom: 24 }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {/* Concentric "radar" rings around the pin */}
                    <View style={{ width: 168, height: 168, borderRadius: 84, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 118, height: 118, borderRadius: 59, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{
                                width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent,
                                alignItems: 'center', justifyContent: 'center',
                                ...shadows.md, shadowColor: colors.shadow,
                            }}>
                                <MaterialCommunityIcons name={priming ? 'map-marker-radius' : 'map-marker-off-outline'} size={36} color={colors.onAccent} />
                            </View>
                        </View>
                    </View>
                    <Text style={{
                        fontFamily: 'PlusJakartaSans_800ExtraBold',
                        fontSize: 24, letterSpacing: -0.6, color: colors.text1,
                        marginTop: 28, textAlign: 'center',
                    }}>
                        {priming ? 'Find the closest bathroom, fast' : 'Location is turned off'}
                    </Text>
                    <Text style={{
                        fontFamily: 'PlusJakartaSans_400Regular',
                        fontSize: 15, color: colors.text2,
                        marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 310,
                    }}>
                        {priming
                            ? 'Allow location to see what’s nearby and how long the walk is. It’s only used while the app is open.'
                            : 'Turn it on in Settings to see bathrooms around you — or search any area instead.'}
                    </Text>
                </View>
                {priming ? (
                    <PrimaryButton title="Allow location" icon="crosshairs-gps" onPress={requestPermission} />
                ) : (
                    <PrimaryButton title="Open Settings" icon="cog-outline" onPress={() => Linking.openSettings()} />
                )}
                <Pressable
                    onPress={() => setLocationStatus('manual')}
                    accessibilityRole="button"
                    style={({ pressed }: { pressed: boolean }) => ({ marginTop: 6, paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
                >
                    <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: colors.text2 }}>
                        Search a location instead
                    </Text>
                </Pressable>
            </View>
        );
    }

    const manual = locationStatus === 'manual';
    const initialRegion = location
        ? { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }
        : MANUAL_REGION;

    const recenterButton = (
        <IconButton
            variant="glass"
            size={46}
            icon={location ? 'crosshairs-gps' : 'crosshairs'}
            iconColor={colors.accentText}
            accessibilityLabel={location ? 'Recenter on my location' : 'Use my location'}
            onPress={recenterToGps}
        />
    );

    // Floating chrome stacks below the search pill + chip row.
    const overlayTop = insets.top + 8 + 50 + 10 + 36 + 12;

    // --- Granted state: full map ---
    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* MAP — fills entire screen */}
            <MapView
                ref={mapRef}
                initialRegion={initialRegion}
                onRegionChangeComplete={onRegionChangeComplete}
                onPress={(e: any) => {
                    // iOS also reports marker taps here; only a tap on empty map dismisses.
                    if (e?.nativeEvent?.action === 'marker-press') return;
                    setSelectedId(null);
                }}
                showsUserLocation={!!location}
                showsMyLocationButton={false}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            >
                {visibleBathrooms.map((b, i) => (
                    <BathroomMarker
                        key={b.id}
                        data={b}
                        // Pins are neutral; the accent marks the tapped pin, or — when
                        // nothing is selected — the nearest result (the sheet's hero).
                        featured={selected ? b.id === selected.id : i === 0}
                        colors={colors}
                        onSelect={setSelectedId}
                    />
                ))}
            </MapView>

            {/* Scrim so the status bar + search stay legible over busy map tiles */}
            <Fade
                color={colors.bg}
                from={isDark ? 0.85 : 0.7}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 110 }}
            />

            {/* TOP CHROME — floating search pill + filter chips */}
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
                {/* zIndex keeps the recents dropdown above the chip row */}
                <View style={{ paddingHorizontal: 16, zIndex: 10 }}>
                    <LocationSearch
                        onLocationSelected={onSearchLocation}
                        onReset={onResetLocation}
                        resetSignal={searchResetSignal}
                        autoFocus={manual}
                    />
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={{ marginTop: 10, flexGrow: 0 }}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 6 }}
                >
                    {activeFilterCount > 0 && (
                        <Chip
                            floating
                            label="Clear"
                            icon="close"
                            active={false}
                            onPress={() => { setAccessFilter(null); setOpenNowFilter(false); }}
                        />
                    )}
                    <Chip
                        floating
                        label="Open now"
                        icon="clock-outline"
                        active={openNowFilter}
                        onPress={() => setOpenNowFilter((v) => !v)}
                    />
                    {ACCESS_FILTERS.map((opt) => (
                        <Chip
                            key={opt.value}
                            floating
                            label={opt.label}
                            icon={(ACCESS_ICON[opt.value] ?? DEFAULT_ACCESS_ICON) as keyof typeof MaterialCommunityIcons.glyphMap}
                            active={accessFilter === opt.value}
                            onPress={() =>
                                setAccessFilter((prev) => (prev === opt.value ? null : opt.value))
                            }
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Search this area button */}
            {showSearchHere && !isFetchingBathrooms && !fetchError && (
                <View style={{ position: 'absolute', top: overlayTop, left: 0, right: 0, alignItems: 'center', zIndex: 999 }} pointerEvents="box-none">
                    <Pressable
                        onPress={searchThisArea}
                        accessibilityRole="button"
                        style={({ pressed }: { pressed: boolean }) => ({
                            backgroundColor: colors.glass,
                            borderRadius: 20,
                            paddingHorizontal: 16,
                            height: 40,
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            ...shadows.md,
                            shadowColor: colors.shadow,
                            opacity: pressed ? 0.85 : 1,
                        })}
                    >
                        <MaterialCommunityIcons name="refresh" size={17} color={colors.text1} />
                        <Text style={{ color: colors.text1, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Search this area
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Error banner + retry */}
            {fetchError && (
                <View style={{ position: 'absolute', top: overlayTop, left: 16, right: 16, alignItems: 'center', zIndex: 999 }}>
                    <View style={{
                        backgroundColor: colors.glass,
                        borderRadius: 16,
                        paddingLeft: 14, paddingRight: 8, paddingVertical: 8,
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        maxWidth: 380, alignSelf: 'stretch',
                        ...shadows.md,
                        shadowColor: colors.shadow,
                    }}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.redDim, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="wifi-off" size={16} color={colors.red} />
                        </View>
                        <Text style={{ flex: 1, color: colors.text1, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                            Couldn't load nearby bathrooms.
                        </Text>
                        <Pressable
                            onPress={retryFetch}
                            accessibilityRole="button"
                            style={({ pressed }: { pressed: boolean }) => ({
                                backgroundColor: colors.primary, borderRadius: 12,
                                paddingHorizontal: 14, height: 34, justifyContent: 'center', opacity: pressed ? 0.85 : 1,
                            })}
                        >
                            <Text style={{ color: colors.onPrimary, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Retry</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {selected ? (
                // Tapped pin: a floating preview (Airbnb/komoot) instead of leaving the map.
                <PinPreview key={selected.id} accessory={recenterButton}>
                    <NearestCard
                        data={selected}
                        eyebrow=""
                        onClose={() => setSelectedId(null)}
                        onDirections={() => openDirections(selected.lat, selected.lng, selected.name)}
                        onPress={() => openDetail(selected)}
                    />
                </PinPreview>
            ) : (
                /* BATHROOM SHEET — recenter FAB rides on its top edge */
                <BathroomSheet
                    bathrooms={visibleBathrooms}
                    isLoading={isFetchingBathrooms}
                    onAddPress={manual && !lastFetchedCenter.current ? undefined : () => tabNavigation.navigate('Add')}
                    emptyTitle={manual && !lastFetchedCenter.current ? 'Search an area' : undefined}
                    emptyMessage={manual && !lastFetchedCenter.current ? 'Type a city or address above to see bathrooms there.' : undefined}
                    onDirections={(b) => openDirections(b.lat, b.lng, b.name)}
                    onCardPress={(id) => {
                        const b = visibleBathrooms.find(x => x.id === id);
                        if (b) openDetail(b);
                    }}
                    accessory={recenterButton}
                />
            )}
        </View>
    );
}

// How long a marker keeps re-snapshotting its custom view after it changes.
// Long enough for icon fonts/text to lay out; after that it's a static bitmap.
const MARKER_TRACK_MS = 400;

/**
 * One map pin. react-native-maps re-renders custom-view markers every frame
 * while `tracksViewChanges` is on, which with hundreds of seeded pins tanks
 * pan/zoom performance — so track only briefly after mount or a visual change.
 */
const BathroomMarker = React.memo(function BathroomMarker({ data: b, featured, colors, onSelect }: {
    data: MapBathroom;
    featured: boolean;
    colors: ReturnType<typeof useThemeContext>['colors'];
    onSelect: (id: string) => void;
}) {
    const [tracking, setTracking] = useState(true);
    useEffect(() => {
        setTracking(true);
        const t = setTimeout(() => setTracking(false), MARKER_TRACK_MS);
        return () => clearTimeout(t);
    }, [featured, b.score, b.icon, colors]);

    const rated = Number(b.score) > 0;
    const pinBg = featured ? colors.accent : colors.surface1;
    const pinFg = featured ? colors.onAccent : colors.text1;
    return (
        <Marker
            coordinate={{ latitude: b.lat, longitude: b.lng }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={featured ? 2 : 1}
            tracksViewChanges={tracking}
            onPress={(e: any) => {
                e?.stopPropagation?.();
                onSelect(b.id);
            }}
        >
            <View style={{ alignItems: 'center' }}>
                <View style={[styles.pin, {
                    backgroundColor: pinBg,
                    borderColor: featured ? colors.accent : colors.borderMed,
                    paddingHorizontal: rated ? 10 : 0,
                    width: rated ? undefined : 32,
                }]}>
                    <MaterialCommunityIcons
                        name={(b.icon as keyof typeof MaterialCommunityIcons.glyphMap) ?? 'toilet'}
                        size={14}
                        color={featured ? colors.onAccent : colors.text2}
                    />
                    {rated && (
                        <Text style={[styles.pinText, { color: pinFg }]}>{b.score}</Text>
                    )}
                </View>
                <View style={[styles.pinTail, { borderTopColor: pinBg }]} />
            </View>
        </Marker>
    );
});

/** Slides the selected-pin card up from the bottom, with floating controls above it. */
function PinPreview({ children, accessory }: { children: React.ReactNode; accessory?: React.ReactNode }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 5 }).start();
    }, [anim]);
    return (
        <Animated.View
            style={[styles.preview, {
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            }]}
        >
            {accessory ? <View style={styles.previewAccessory}>{accessory}</View> : null}
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    preview: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        ...shadows.lg,
        shadowOffset: { width: 0, height: 6 },
        shadowColor: '#000',
    },
    previewAccessory: {
        alignItems: 'flex-end',
        marginBottom: 12,
        marginRight: 4,
    },
    container: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    pin: {
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 5,
    },
    pinText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
    },
    pinTail: {
        width: 0,
        height: 0,
        marginTop: -1,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 7,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    animation: {
        width: 100,
        height: 100,
        backgroundColor: 'transparent',
    },
});
