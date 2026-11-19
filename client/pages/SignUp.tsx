import React, { useState } from 'react';
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

type signUpScreenProp = NativeStackNavigationProp<AuthStackParamList>;

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export function SignUp() {
    const navigation = useNavigation<signUpScreenProp>();
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
            icon="account-plus-outline"
            title="Create your account"
            subtitle="Join the community finding (and rating) clean bathrooms. We'll email you a code to get started."
            footer={
                <>
                    <PrimaryButton
                        testID="signup-send"
                        title="Send OTP →"
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                    />
                    <AuthSwitch
                        prompt="Already have an account?"
                        action="Log in"
                        onPress={() => navigation.replace('Login')}
                    />
                </>
            }
        >
            <Controller<FormValues>
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormInput
                        testID="signup-email"
                        label="Email"
                        icon="email-outline"
                        placeholder="you@example.com"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
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
