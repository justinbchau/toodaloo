import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
import { useThemeContext } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../RootStackParams';
import { LocationCtx } from '../context/context';

type LocationStatus = 'requesting' | 'denied' | 'granted';
type MapNavProp = NativeStackNavigationProp<RootStackParamList>;
type TabNavProp = BottomTabNavigationProp<MainTabParamList>;

const formatDistance = (km: number): string => {
    const miles = km * 0.621371;
    if (miles < 0.1) return `${Math.round(miles * 5280)} ft away`;
    return `${miles.toFixed(1)} mi away`;
};

export function Map() {
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('requesting');
    const [location, setLocalLocation] = useState<LocationObject | null>(null);
    const [bathrooms, setBathrooms] = useState<BathroomCardData[]>([]);
    const [isFetchingBathrooms, setIsFetchingBathrooms] = useState(false);
    const mapRef = useRef<MapView>(null);

    const navigation = useNavigation<MapNavProp>();
    const tabNavigation = useNavigation<TabNavProp>();
    const { colors, isDark } = useThemeContext();
    const insets = useSafeAreaInsets();
    const { setLocation: setCtxLocation } = useContext(LocationCtx);

    const setLocation = (loc: LocationObject) => {
        setLocalLocation(loc);
        setCtxLocation(loc);
    };

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

    // Fetch bathrooms when location is acquired
    useEffect(() => {
        if (!location) return;

        const fetchBathrooms = async () => {
            setIsFetchingBathrooms(true);
            try {
                const { data, error } = await supabase.rpc('bathrooms_nearby', {
                    user_lat: location.coords.latitude,
                    user_lng: location.coords.longitude,
                    radius_km: 5.0,
                });

                if (error) throw error;

                const transformed: BathroomCardData[] = (data ?? []).map((b: any) => ({
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
                }));

                setBathrooms(transformed);
            } catch (err) {
                console.error('Failed to fetch bathrooms:', err);
            } finally {
                setIsFetchingBathrooms(false);
            }
        };

        fetchBathrooms();
    }, [location]);

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
                showsUserLocation
                style={StyleSheet.absoluteFill}
            >
                {bathrooms.map((b) => (
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
                    <LocationSearch />
                    <Pressable style={({ pressed }: { pressed: boolean }) => ({
                        width: 42,
                        height: 42,
                        backgroundColor: colors.surface2,
                        borderWidth: 1,
                        borderColor: colors.borderMed,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                    })}>
                        <View style={{ gap: 3.5, width: 16 }}>
                            {[1, 2, 3].map((_, i) => (
                                <View
                                    key={i}
                                    style={{
                                        height: 1.5,
                                        width: i === 2 ? '65%' : '100%',
                                        backgroundColor: colors.text2,
                                        borderRadius: 1,
                                    }}
                                />
                            ))}
                        </View>
                    </Pressable>
                </View>
            </View>

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
                    onPress={() => {
                        if (location) {
                            mapRef.current?.animateToRegion({
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }, 500);
                        }
                    }}
                >
                    <Text style={[styles.fabLocText, { color: colors.text2 }]}>◎</Text>
                </Pressable>
            </View>

            {/* BATHROOM SHEET */}
            <BathroomSheet
                bathrooms={bathrooms}
                isLoading={isFetchingBathrooms}
                onCardPress={(id) => {
                    const b = bathrooms.find(x => x.id === id);
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
