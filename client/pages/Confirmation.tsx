import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Page } from '../templates/Page';
import { AuthStackParamList } from '../RootStackParams';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { FormInput } from '../components/ui/FormInput';
import { supabase } from '../lib/supabase';

const schema = z.object({
    code: z.string().min(1, 'Code is required'),
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Confirmation'>;

const RESEND_COOLDOWN_SECONDS = 30;

export function Confirmation({ route }: Props) {
    const { colors } = useThemeContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const [resendNotice, setResendNotice] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            setAuthError(error.message);
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
                setAuthError(error.message);
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

    return (
        <Page>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.text1 }]}>Verification</Text>
                <Text style={[styles.subtitle, { color: colors.text2 }]}>Enter the code sent to your email</Text>

                <View style={styles.fields}>
                    <Controller<FormValues>
                        control={control}
                        name="code"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <FormInput
                                label="Confirmation Code"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                keyboardType="number-pad"
                                error={error?.message}
                            />
                        )}
                    />
                </View>

                {authError && (
                    <Text style={[styles.errorText, { color: colors.red }]}>
                        {authError}
                    </Text>
                )}

                {resendNotice && !authError && (
                    <Text style={[styles.errorText, { color: colors.green }]}>
                        {resendNotice}
                    </Text>
                )}

                <PrimaryButton
                    title="Verify →"
                    onPress={handleSubmit(onSubmit)}
                    style={styles.button}
                    disabled={isSubmitting}
                />

                <Pressable
                    onPress={handleResend}
                    disabled={cooldown > 0}
                    style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                    <Text style={[styles.resend, { color: cooldown > 0 ? colors.text3 : colors.purpleText }]}>
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                    </Text>
                </Pressable>
            </View>
        </Page>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    title: { marginTop: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28 },
    subtitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 8 },
    fields: { marginTop: 28, gap: 16 },
    errorText: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', marginTop: 12 },
    button: { marginTop: 16 },
    resend: { textAlign: 'center', marginTop: 16, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});
