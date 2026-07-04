import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthStackParamList } from '../RootStackParams';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Page } from '../templates/Page';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { FormInput } from '../components/ui/FormInput';
import { supabase } from '../lib/supabase';

type loginScreenProp = NativeStackNavigationProp<AuthStackParamList>;

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export function Login() {
    const navigation = useNavigation<loginScreenProp>();
    const { colors } = useThemeContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: values.email,
            });
            if (error) {
                setAuthError(error.message);
                return;
            }
            navigation.navigate('Confirmation', { email: values.email });
        } catch {
            setAuthError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Page>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.text1 }]}>Welcome back</Text>
                <Text style={[styles.subtitle, { color: colors.text2 }]}>Enter your email to receive a login code</Text>

                <View style={styles.fields}>
                    <Controller<FormValues>
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <FormInput
                                label="Email"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                autoCapitalize="none"
                                keyboardType="email-address"
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
                    title="Send code →"
                    onPress={handleSubmit(onSubmit)}
                    style={styles.button}
                    disabled={isSubmitting}
                />
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
});
