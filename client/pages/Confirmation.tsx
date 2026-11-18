import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout, AuthNotice } from '../components/AuthLayout';
import { AuthStackParamList } from '../RootStackParams';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { supabase } from '../lib/supabase';
import { friendlyAuthError } from '../lib/authErrors';

const schema = z.object({
    code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Confirmation'>;

const RESEND_COOLDOWN_SECONDS = 30;

export function Confirmation({ route, navigation }: Props) {
    const { colors } = useThemeContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const [resendNotice, setResendNotice] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputRef = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);

    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { code: '' },
    });

    // Email is passed as a route param from SignUp
    const email = (route?.params as any)?.email ?? '';

    const startCooldown = () => {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        if (!email) {
            Alert.alert('Something went wrong', 'Please sign in again to continue.');
            navigation.replace('Login');
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleResend = async () => {
        if (cooldown > 0 || !email) return;
        setAuthError(null);
        setResendNotice(null);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            setAuthError(friendlyAuthError(error));
            return;
        }
        setResendNotice('A new code is on its way.');
        startCooldown();
    };

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        setAuthError(null);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: values.code,
                type: 'email',
            });
            if (error) {
                setAuthError(friendlyAuthError(error));
                return;
            }
            // Session created → UserContext fires onAuthStateChange(SIGNED_IN)
            // → AppNavigator re-routes to MainTabs automatically. No manual nav needed.
        } catch {
            setAuthError('Invalid code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!email) {
        return null;
    }

    return (
        <AuthLayout
            icon="shield-key-outline"
            title="Check your email"
            subtitle={
                <>
                    {'Enter the 6-digit code we sent to '}
                    <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_700Bold' }}>{email}</Text>
                </>
            }
            footer={
                <PrimaryButton
                    testID="verify-otp"
                    title="Verify →"
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                />
            }
        >
            <Controller<FormValues>
                control={control}
                name="code"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <View>
                        {/* Six display boxes over one invisible input — keeps paste,
                            iOS one-time-code autofill and a single onChange intact. */}
                        <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxRow} accessible={false}>
                            {Array.from({ length: 6 }).map((_, i) => {
                                const digit = value?.[i] ?? '';
                                const active = focused && i === Math.min(value?.length ?? 0, 5);
                                return (
                                    <View
                                        key={i}
                                        style={[
                                            styles.box,
                                            {
                                                backgroundColor: colors.surface1,
                                                borderColor: error ? colors.red : active ? colors.purple : digit ? colors.borderMed : colors.border,
                                                borderWidth: active || error ? 2 : 1,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.digit, { color: colors.text1 }]}>{digit}</Text>
                                    </View>
                                );
                            })}
                            <TextInput
                                ref={inputRef}
                                testID="otp-code"
                                accessibilityLabel="Confirmation code"
                                value={value}
                                onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 6))}
                                onFocus={() => setFocused(true)}
                                onBlur={() => { setFocused(false); onBlur(); }}
                                keyboardType="number-pad"
                                maxLength={6}
                                textContentType="oneTimeCode"
                                autoComplete="one-time-code"
                                autoFocus
                                caretHidden
                                style={styles.hiddenInput}
                            />
                        </Pressable>
                        {error?.message ? (
                            <Text style={[styles.fieldError, { color: colors.red }]}>{error.message}</Text>
                        ) : null}
                    </View>
                )}
            />

            {authError && <AuthNotice tone="error">{authError}</AuthNotice>}
            {resendNotice && !authError && <AuthNotice tone="success">{resendNotice}</AuthNotice>}

            <View style={styles.resendRow}>
                <Text style={[styles.resendPrompt, { color: colors.text2 }]}>Didn't get it?</Text>
                <Pressable
                    onPress={handleResend}
                    disabled={cooldown > 0}
                    accessibilityRole="button"
                    hitSlop={8}
                    style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                    <Text style={[styles.resend, { color: cooldown > 0 ? colors.text3 : colors.purpleText }]}>
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                    </Text>
                </Pressable>
            </View>
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    boxRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
    box: {
        flex: 1,
        aspectRatio: 0.82,
        maxHeight: 64,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    digit: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold' },
    hiddenInput: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.011,
        color: 'transparent',
    },
    fieldError: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 10 },
    resendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
    resendPrompt: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
    resend: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
});
