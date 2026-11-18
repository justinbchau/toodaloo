import React, { useState } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthStackParamList } from '../RootStackParams';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthLayout, AuthNotice, AuthSwitch } from '../components/AuthLayout';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { FormInput } from '../components/ui/FormInput';
import { supabase } from '../lib/supabase';
import { friendlyAuthError } from '../lib/authErrors';
import { useUser } from '../context/UserContext';

type loginScreenProp = NativeStackNavigationProp<AuthStackParamList>;

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export function Login() {
    const navigation = useNavigation<loginScreenProp>();
    const { sessionExpired, clearSessionExpired } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        setAuthError(null);
        clearSessionExpired();
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: values.email,
            });
            if (error) {
                setAuthError(friendlyAuthError(error));
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
        <AuthLayout
            icon="email-fast-outline"
            title="Welcome back"
            subtitle="Enter your email and we'll send you a 6-digit login code. No password needed."
            footer={
                <>
                    <PrimaryButton
                        testID="send-code"
                        title="Send code →"
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                    />
                    <AuthSwitch
                        prompt="New to toodaloo?"
                        action="Create an account"
                        onPress={() => navigation.replace('SignUp')}
                    />
                </>
            }
        >
            {sessionExpired && (
                <View style={{ marginTop: -12, marginBottom: 16 }}>
                    <AuthNotice tone="error" testID="session-expired-notice">
                        Your session expired. Please sign in again.
                    </AuthNotice>
                </View>
            )}

            <Controller<FormValues>
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormInput
                        testID="login-email"
                        label="Email"
                        icon="email-outline"
                        placeholder="you@example.com"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        keyboardType="email-address"
                        returnKeyType="send"
                        onSubmitEditing={handleSubmit(onSubmit)}
                        autoFocus
                        error={error?.message}
                    />
                )}
            />

            {authError && <AuthNotice tone="error">{authError}</AuthNotice>}
        </AuthLayout>
    );
}
