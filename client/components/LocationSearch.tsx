import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useThemeContext } from '../context/ThemeContext';

// Minimal geocode search (FAF-28). Deliberately NOT autocomplete — on submit we
// forward-geocode the typed text and hand the coordinates up to the Map, which
// owns recentering, refetching `bathrooms_nearby`, and the LocationCtx anchor.
const GEOCODE_TIMEOUT_MS = 10000;

type LocationSearchProps = {
    // Called with the geocoded coordinates of the first result on a successful search.
    onLocationSelected: (lat: number, lng: number) => void;
    // Called when the user clears an active search to return to their GPS location.
    onReset: () => void;
    // Bumped by the parent to clear the box when the map is reset from elsewhere
    // (e.g. the ◎ recenter FAB), keeping the search UI in sync with the map.
    resetSignal?: number;
};

export default function LocationSearch({ onLocationSelected, onReset, resetSignal }: LocationSearchProps) {
    const { colors } = useThemeContext();
    const [value, setValue] = useState('');
    const [searching, setSearching] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    // True once a search has recentered the map, so the clear (✕) affordance keeps
    // showing even after the query is submitted — its press returns the user to GPS.
    const [hasActiveSearch, setHasActiveSearch] = useState(false);

    // Clear the box when the parent bumps resetSignal (e.g. the ◎ recenter FAB
    // resets the map). The parent already handled the map reset — this only syncs
    // the local UI, so it must NOT call onReset (that would double-reset/refetch).
    // Skip the initial mount value so it fires only on an actual bump.
    const isFirstResetSignal = useRef(true);
    useEffect(() => {
        if (isFirstResetSignal.current) {
            isFirstResetSignal.current = false;
            return;
        }
        setValue('');
        setMessage(null);
        setHasActiveSearch(false);
    }, [resetSignal]);

    const handleSubmit = async () => {
        const query = value.trim();
        if (!query || searching) return;

        setSearching(true);
        setMessage(null);

        // Mirror AddBathroom's geocode-with-timeout: geocodeAsync can hang, so race
        // it against a 10s timeout and surface a friendly inline message on failure.
        // The try/catch is scoped to the geocode only — the success callback runs
        // afterwards so a throw from the Map wiring it triggers can't be mislabeled
        // as a geocode failure.
        let timerId: ReturnType<typeof setTimeout> | undefined;
        let coords: { latitude: number; longitude: number };
        try {
            const timeout = new Promise<never>((_, reject) => {
                timerId = setTimeout(() => reject(new Error('Geocode timeout')), GEOCODE_TIMEOUT_MS);
            });
            const results = await Promise.race([Location.geocodeAsync(query), timeout]);

            if (!results || results.length === 0) {
                setMessage("Couldn't find that location. Try being more specific.");
                return;
            }
            coords = results[0];
        } catch (err) {
            console.error('LocationSearch geocode failed:', err);
            setMessage("Couldn't search right now. Try again.");
            return;
        } finally {
            clearTimeout(timerId);
            setSearching(false);
        }

        setHasActiveSearch(true);
        onLocationSelected(coords.latitude, coords.longitude);
    };

    const handleClear = () => {
        setValue('');
        setMessage(null);
        if (hasActiveSearch) {
            setHasActiveSearch(false);
            onReset();
        }
    };

    const showClear = !searching && (value.length > 0 || hasActiveSearch);

    return (
        <View style={{ flex: 1 }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 44,
                backgroundColor: colors.surface2,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.borderMed,
                paddingHorizontal: 12,
            }}>
                <MaterialCommunityIcons name="magnify" size={18} color={colors.text3} />
                <TextInput
                    placeholder="Search location"
                    placeholderTextColor={colors.text3}
                    value={value}
                    onChangeText={setValue}
                    onSubmitEditing={handleSubmit}
                    editable={!searching}
                    returnKeyType="search"
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={{
                        flex: 1,
                        color: colors.text1,
                        fontFamily: 'PlusJakartaSans_400Regular',
                        fontSize: 14,
                        padding: 0,
                    }}
                />
                {searching && <ActivityIndicator size="small" color={colors.text3} />}
                {showClear && (
                    <Pressable
                        onPress={handleClear}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                    >
                        <MaterialCommunityIcons name="close-circle" size={18} color={colors.text3} />
                    </Pressable>
                )}
            </View>

            {message && (
                <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 6,
                    backgroundColor: colors.surface1,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.borderMed,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                }}>
                    <Text style={{
                        color: colors.text2,
                        fontFamily: 'PlusJakartaSans_500Medium',
                        fontSize: 13,
                    }}>
                        {message}
                    </Text>
                </View>
            )}
        </View>
    );
}
