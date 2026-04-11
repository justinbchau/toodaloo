import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Page } from '../templates/Page';
import { RootStackParamList } from '../RootStackParams';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { FormInput } from '../components/ui/FormInput';

type passwordScreenProp = NativeStackNavigationProp<RootStackParamList>;

const schema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export function Password() {
    const navigation = useNavigation<passwordScreenProp>();
    const { colors } = useThemeContext();
    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: '' },
    });

    const onSubmit = (_values: FormValues) => {
        navigation.navigate('MainTabs');
    };

    return (
        <Page>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.text1 }]}>Password</Text>
                <Text style={[styles.subtitle, { color: colors.text2 }]}>Enter a unique and secure password for your account</Text>

                <View style={styles.fields}>
                    <Controller<FormValues>
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <FormInput
                                label="Password"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                secureTextEntry
                                error={error?.message}
                            />
                        )}
                    />
                </View>

                <PrimaryButton title="Create account →" onPress={handleSubmit(onSubmit)} style={styles.button} />
            </View>
        </Page>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    title: { marginTop: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28 },
    subtitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 8 },
    fields: { marginTop: 28, gap: 16 },
    button: { marginTop: 32 },
});
