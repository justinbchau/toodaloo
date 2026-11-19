import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { addRecent, clearRecents, loadRecents } from '../lib/recentSearches';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useThemeContext } from '../context/ThemeContext';
import { shadows } from '../theme/shadows';

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
    /** Focus the field on mount (manual-location mode, where search is the next step). */
    autoFocus?: boolean;
};

export default function LocationSearch({ onLocationSelected, onReset, resetSignal, autoFocus }: LocationSearchProps) {
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

    // Recent searches (Apple/Google Maps): shown when the empty field is focused.
    const [recents, setRecents] = useState<string[]>([]);
    const [focused, setFocused] = useState(false);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
        let active = true;
        loadRecents().then((r) => { if (active) setRecents(r); });
        return () => { active = false; clearTimeout(blurTimer.current); };
    }, []);

    const handleSubmit = () => runSearch(value);

    const runSearch = async (raw: string) => {
        const query = raw.trim();
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
        addRecent(query, recents).then(setRecents);
        onLocationSelected(coords.latitude, coords.longitude);
    };

    const pickRecent = (q: string) => {
        setValue(q);
        setFocused(false);
        Keyboard.dismiss();
        runSearch(q);
    };

    const showRecents = focused && value.trim().length === 0 && recents.length > 0 && !message;

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
                gap: 10,
                height: 50,
                backgroundColor: colors.glass,
                borderRadius: 25,
                paddingHorizontal: 16,
                ...shadows.md,
                shadowColor: colors.shadow,
            }}>
                <MaterialCommunityIcons name="magnify" size={22} color={colors.text1} />
                <TextInput
                    placeholder="Search location"
                    placeholderTextColor={colors.text2}
                    value={value}
                    onChangeText={(t) => {
                        setValue(t);
                        // Editing dismisses a stale "couldn't find" message.
                        if (message) setMessage(null);
                    }}
                    onSubmitEditing={handleSubmit}
                    onFocus={() => { clearTimeout(blurTimer.current); setFocused(true); }}
                    // Delay so a tap on a recent row lands before the list unmounts.
                    onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 150); }}
                    editable={!searching}
                    returnKeyType="search"
                    autoFocus={autoFocus}
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={{
                        flex: 1,
                        color: colors.text1,
                        fontFamily: 'PlusJakartaSans_600SemiBold',
                        fontSize: 15,
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
                        <MaterialCommunityIcons name="close-circle" size={20} color={colors.text3} />
                    </Pressable>
                )}
            </View>

            {showRecents && (
                <View
                    testID="recent-searches"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 8,
                        backgroundColor: colors.glass,
                        borderRadius: 18,
                        paddingVertical: 6,
                        ...shadows.md,
                        shadowColor: colors.shadow,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 }}>
                        <Text style={{ color: colors.text2, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>Recent</Text>
                        <Pressable
                            onPress={() => { clearRecents(); setRecents([]); }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Clear recent searches"
                        >
                            <Text style={{ color: colors.accentText, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>Clear</Text>
                        </Pressable>
                    </View>
                    {recents.map((q) => (
                        <Pressable
                            key={q}
                            onPress={() => pickRecent(q)}
                            accessibilityRole="button"
                            accessibilityLabel={`Search ${q}`}
                            style={({ pressed }: { pressed: boolean }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 11,
                                backgroundColor: pressed ? colors.surface2 : 'transparent',
                            })}
                        >
                            <MaterialCommunityIcons name="history" size={18} color={colors.text2} />
                            <Text numberOfLines={1} style={{ flex: 1, color: colors.text1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 }}>
                                {q}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}

            {message && (
                <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 8,
                    backgroundColor: colors.glass,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    ...shadows.md,
                    shadowColor: colors.shadow,
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
