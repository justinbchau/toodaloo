import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

export function Confirmation({ route }: Props) {
    const { colors } = useThemeContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { code: '' },
    });

    // Email is passed as a route param from SignUp
    const email = (route?.params as any)?.email ?? '';

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

                <PrimaryButton
                    title="Verify →"
                    onPress={handleSubmit(onSubmit)}
                    style={styles.button}
                    disabled={isSubmitting}
                />

                <Text style={[styles.resend, { color: colors.purpleText }]}>Resend code</Text>
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
