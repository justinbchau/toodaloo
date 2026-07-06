import React, { useContext, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Linking } from 'react-native';
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
import { BathroomCardData } from '../components/BathroomCard';
import { Chip } from '../components/ui/Chip';
import { useThemeContext } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../RootStackParams';
import { LocationCtx } from '../context/context';
import { haversine } from '../utils/geo';

type LocationStatus = 'requesting' | 'denied' | 'granted';
type MapNavProp = NativeStackNavigationProp<RootStackParamList>;
type TabNavProp = BottomTabNavigationProp<MainTabParamList>;

type MapBathroom = BathroomCardData & {
    accessType: string | null;
    is24: boolean;
};

const ACCESS_FILTERS: { label: string; value: string }[] = [
    { label: 'Public', value: 'public' },
    { label: 'Key Required', value: 'key_required' },
    { label: 'Purchase Required', value: 'purchase_required' },
];

const DEFAULT_RADIUS_KM = 5.0;
// How far the user must pan (km) before the "Search this area" button appears.
const SEARCH_HERE_THRESHOLD_KM = 1.0;
const MILES_TO_KM = 1.60934;

const formatDistance = (km: number): string => {
    const miles = km * 0.621371;
    if (miles < 0.1) return `${Math.round(miles * 5280)} ft away`;
    return `${miles.toFixed(1)} mi away`;
};

const transformBathroom = (b: any): MapBathroom => ({
    id: b.id,
    name: b.name,
    icon: ACCESS_ICON[b.access_type] ?? DEFAULT_ACCESS_ICON,
    sub: b.access_type == null
        ? (b.address ?? 'Nearby')
        : b.access_type === 'public'
            ? `Public${b.is_24_hours ? ' · Open 24h' : ''}`
            : b.access_type === 'key_required'
                ? 'Key Required'
                : 'Purchase Required',
    rating: Math.round(Number(b.rating_avg) || 0),
    score: (Number(b.rating_avg) || 0).toFixed(1),
    reviewCount: `(${b.review_count ?? 0})`,
    distance: b.distance_km != null ? formatDistance(b.distance_km) : 'Nearby',
    lat: b.lat,
    lng: b.lng,
    accessType: b.access_type ?? null,
    is24: !!b.is_24_hours,
});

// Approximate the visible radius (km) from the region's latitude span.
const radiusFromRegion = (region: Region): number => {
    const km = (region.latitudeDelta * 111) / 2;
    return Math.min(40, Math.max(1, km));
};

export function Map() {
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('requesting');
    const [location, setLocalLocation] = useState<LocationObject | null>(null);
    const [bathrooms, setBathrooms] = useState<MapBathroom[]>([]);
    const [isFetchingBathrooms, setIsFetchingBathrooms] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [showSearchHere, setShowSearchHere] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [accessFilter, setAccessFilter] = useState<string | null>(null);
    const [open24Filter, setOpen24Filter] = useState(false);
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

            setBathrooms((data ?? []).map(transformBathroom));
            lastFetchedCenter.current = { lat, lng };
            setShowSearchHere(false);
        } catch (err) {
            console.error('Failed to fetch bathrooms:', err);
            setFetchError(true);
        } finally {
            setIsFetchingBathrooms(false);
        }
    }, []);

    // Location permission + acquisition
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationStatus('denied');
                return;
            }
            try {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
                setLocationStatus('granted');
            } catch {
                setLocationStatus('denied');
            }
        })();
    }, []);

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

    const animateTo = (lat: number, lng: number) => {
        mapRef.current?.animateToRegion(
            { latitude: lat, longitude: lng, latitudeDelta: 0.0922, longitudeDelta: 0.0421 },
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

    // Clear affordance: return to the user's GPS location and restore its anchor.
    const onResetLocation = useCallback(() => {
        if (!location) return;
        const { latitude, longitude } = location.coords;
        animateTo(latitude, longitude);
        setCenter({ lat: latitude, lng: longitude });
        fetchBathrooms(latitude, longitude, DEFAULT_RADIUS_KM);
    }, [location, fetchBathrooms, setCenter]);

    // The ◎ recenter FAB: run the same reset the search's ✕ does (recenter + refetch
    // + restore the GPS anchor) AND clear any active search in the box, so pressing
    // it after a search can't leave the camera on GPS while the list/anchor/✕ stay
    // pointed at the searched location.
    const recenterToGps = useCallback(() => {
        onResetLocation();
        setSearchResetSignal((n) => n + 1);
    }, [onResetLocation]);

    const activeFilterCount = (accessFilter ? 1 : 0) + (open24Filter ? 1 : 0);

    const visibleBathrooms = bathrooms.filter((b) => {
        if (accessFilter && b.accessType !== accessFilter) return false;
        if (open24Filter && !b.is24) return false;
        return true;
    });

    // --- Requesting state: spinner ---
    if (locationStatus === 'requesting') {
        return (
            <View style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LottieView
                        style={styles.animation}
                        source={require('../assets/67056-spinner-edited.json')}
                        autoPlay
                        loop
                    />
                </View>
            </View>
        );
    }

    // --- Denied state: permission prompt ---
    if (locationStatus === 'denied') {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                <MaterialCommunityIcons name="map-marker-radius" size={56} color={colors.purple} />
                <Text style={{
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontSize: 20, color: colors.text1,
                    marginTop: 20, textAlign: 'center',
                }}>
                    We need your location
                </Text>
                <Text style={{
                    fontFamily: 'PlusJakartaSans_400Regular',
                    fontSize: 14, color: colors.text2,
                    marginTop: 8, textAlign: 'center', lineHeight: 22,
                }}>
                    TooDaLoo uses your location to find bathrooms nearby.
                </Text>
                <Pressable
                    onPress={() => Linking.openSettings()}
                    style={({ pressed }: { pressed: boolean }) => ({
                        marginTop: 28, backgroundColor: colors.purple,
                        borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14,
                        width: '100%', alignItems: 'center',
                        opacity: pressed ? 0.85 : 1,
                    })}
                >
                    <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff' }}>
                        Open Settings
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => {
                        // Fallback: show NYC as default region, let user browse
                        const fallback = { coords: { latitude: 40.7128, longitude: -74.0060, altitude: 0, accuracy: 0, altitudeAccuracy: 0, heading: 0, speed: 0 }, timestamp: Date.now() } as LocationObject;
                        setLocation(fallback);
                        setLocationStatus('granted');
                    }}
                    style={({ pressed }: { pressed: boolean }) => ({ marginTop: 14, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}
                >
                    <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: colors.text2 }}>
                        Maybe later
                    </Text>
                </Pressable>
            </View>
        );
    }

    // --- Granted state: full map ---
    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* MAP — fills entire screen */}
            <MapView
                ref={mapRef}
                initialRegion={{
                    latitude: location!.coords.latitude,
                    longitude: location!.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onRegionChangeComplete={onRegionChangeComplete}
                showsUserLocation
                style={StyleSheet.absoluteFill}
            >
                {visibleBathrooms.map((b) => (
                    <Marker
                        key={b.id}
                        coordinate={{ latitude: b.lat, longitude: b.lng }}
                        onPress={() => navigation.navigate('BathroomDetail', {
                            id: b.id, name: b.name, lat: b.lat, lng: b.lng,
                        })}
                    >
                        <View style={{
                            width: 40, height: 40, borderRadius: 10,
                            backgroundColor: colors.purple,
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: 'rgba(123,110,246,0.35)',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 1, shadowRadius: 10,
                            elevation: 6,
                        }}>
                            <MaterialCommunityIcons name="toilet" size={22} color="#fff" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* TOP BAR — absolute, top 0 */}
            <View style={[
                styles.topBar,
                {
                    paddingTop: insets.top + 8,
                    backgroundColor: isDark
                        ? 'rgba(11,11,15,0.88)'
                        : 'rgba(246,244,255,0.9)',
                },
            ]}>
                <View style={styles.topBarInner}>
                    <LocationSearch onLocationSelected={onSearchLocation} onReset={onResetLocation} resetSignal={searchResetSignal} />
                    <Pressable
                        onPress={() => setShowFilters((v) => !v)}
                        style={({ pressed }: { pressed: boolean }) => ({
                            width: 42,
                            height: 42,
                            backgroundColor: showFilters || activeFilterCount > 0 ? colors.purple : colors.surface2,
                            borderWidth: 1,
                            borderColor: showFilters || activeFilterCount > 0 ? colors.purple : colors.borderMed,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <View style={{ gap: 3.5, width: 16 }}>
                            {[1, 2, 3].map((_, i) => (
                                <View
                                    key={i}
                                    style={{
                                        height: 1.5,
                                        width: i === 2 ? '65%' : '100%',
                                        backgroundColor: showFilters || activeFilterCount > 0 ? '#fff' : colors.text2,
                                        borderRadius: 1,
                                    }}
                                />
                            ))}
                        </View>
                        {activeFilterCount > 0 && !showFilters && (
                            <View style={{
                                position: 'absolute', top: -4, right: -4,
                                minWidth: 16, height: 16, borderRadius: 8,
                                backgroundColor: colors.red,
                                alignItems: 'center', justifyContent: 'center',
                                paddingHorizontal: 3,
                            }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                                    {activeFilterCount}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Filter panel */}
                {showFilters && (
                    <View style={{
                        marginTop: 10,
                        backgroundColor: colors.surface1,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.borderMed,
                        padding: 12,
                        gap: 10,
                    }}>
                        <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.8, color: colors.text2 }}>
                            ACCESS TYPE
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {ACCESS_FILTERS.map((opt) => (
                                <Chip
                                    key={opt.value}
                                    label={opt.label}
                                    active={accessFilter === opt.value}
                                    onPress={() =>
                                        setAccessFilter((prev) => (prev === opt.value ? null : opt.value))
                                    }
                                />
                            ))}
                        </View>
                        <Pressable
                            onPress={() => setOpen24Filter((v) => !v)}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}
                        >
                            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: colors.text1 }}>
                                Open 24 hours only
                            </Text>
                            <View style={{
                                width: 22, height: 22, borderRadius: 6,
                                borderWidth: 1.5,
                                borderColor: open24Filter ? colors.purple : colors.borderMed,
                                backgroundColor: open24Filter ? colors.purple : 'transparent',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                {open24Filter && <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text>}
                            </View>
                        </Pressable>
                        {activeFilterCount > 0 && (
                            <Pressable onPress={() => { setAccessFilter(null); setOpen24Filter(false); }}>
                                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.purpleText, marginTop: 2 }}>
                                    Clear filters
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}
            </View>

            {/* Search this area button */}
            {showSearchHere && !isFetchingBathrooms && (
                <View style={{ position: 'absolute', top: insets.top + 64, left: 0, right: 0, alignItems: 'center', zIndex: 999 }}>
                    <Pressable
                        onPress={searchThisArea}
                        style={({ pressed }: { pressed: boolean }) => ({
                            backgroundColor: colors.purple,
                            borderRadius: 20,
                            paddingHorizontal: 18,
                            paddingVertical: 10,
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
                            opacity: pressed ? 0.85 : 1,
                        })}
                    >
                        <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            ⟳ Search this area
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Error banner + retry */}
            {fetchError && (
                <View style={{ position: 'absolute', top: insets.top + 64, left: 16, right: 16, alignItems: 'center', zIndex: 999 }}>
                    <View style={{
                        backgroundColor: colors.surface1,
                        borderColor: colors.red,
                        borderWidth: 1,
                        borderRadius: 14,
                        paddingHorizontal: 16, paddingVertical: 12,
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        maxWidth: 360,
                    }}>
                        <Text style={{ flex: 1, color: colors.text1, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>
                            Couldn't load nearby bathrooms.
                        </Text>
                        <Pressable
                            onPress={retryFetch}
                            style={({ pressed }: { pressed: boolean }) => ({
                                backgroundColor: colors.purple, borderRadius: 10,
                                paddingHorizontal: 14, paddingVertical: 8, opacity: pressed ? 0.85 : 1,
                            })}
                        >
                            <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Retry</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* FABs — absolute, right 14, bottom 260 */}
            <View style={styles.fabContainer}>
                {/* Add FAB (purple) */}
                <Pressable
                    style={({ pressed }: { pressed: boolean }) => [styles.fab, {
                        backgroundColor: colors.purple,
                        shadowColor: colors.purpleGlow ?? 'rgba(123,110,246,0.35)',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 18,
                        elevation: 8,
                        opacity: pressed ? 0.85 : 1,
                    }]}
                    onPress={() => tabNavigation.navigate('Add')}
                >
                    <Text style={styles.fabAddText}>+</Text>
                </Pressable>

                {/* Location FAB (surface) */}
                <Pressable
                    style={({ pressed }: { pressed: boolean }) => [
                        styles.fab,
                        {
                            backgroundColor: colors.surface1,
                            borderWidth: 1,
                            borderColor: colors.borderMed,
                            opacity: pressed ? 0.85 : 1,
                        },
                    ]}
                    onPress={recenterToGps}
                >
                    <Text style={[styles.fabLocText, { color: colors.text2 }]}>◎</Text>
                </Pressable>
            </View>

            {/* BATHROOM SHEET */}
            <BathroomSheet
                bathrooms={visibleBathrooms}
                isLoading={isFetchingBathrooms}
                onCardPress={(id) => {
                    const b = visibleBathrooms.find(x => x.id === id);
                    if (b) navigation.navigate('BathroomDetail', { id: b.id, name: b.name, lat: b.lat, lng: b.lng });
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingBottom: 12,
        zIndex: 1000,
    },
    topBarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fabContainer: {
        position: 'absolute',
        right: 14,
        bottom: 260,
        gap: 10,
        zIndex: 1000,
    },
    fab: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    fabAddText: {
        color: '#fff',
        fontSize: 24,
        lineHeight: 28,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    fabLocText: {
        fontSize: 20,
        lineHeight: 24,
    },
    animation: {
        width: 100,
        height: 100,
        backgroundColor: 'transparent',
    },
});
