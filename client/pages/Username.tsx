import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Page } from '../templates/Page';
import { AuthStackParamList } from '../RootStackParams';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { FormInput } from '../components/ui/FormInput';

type usernameScreenProp = NativeStackNavigationProp<AuthStackParamList>;

const schema = z.object({
    username: z.string().min(1, 'Username is required'),
});

type FormValues = z.infer<typeof schema>;

export function Username() {
    const navigation = useNavigation<usernameScreenProp>();
    const { colors } = useThemeContext();
    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { username: '' },
    });

    const onSubmit = (_values: FormValues) => {
        navigation.navigate('Password');
    };

    return (
        <Page>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.text1 }]}>Username</Text>
                <Text style={[styles.subtitle, { color: colors.text2 }]}>Enter a username to represent you</Text>

                <View style={styles.fields}>
                    <Controller<FormValues>
                        control={control}
                        name="username"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <FormInput
                                label="Username"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                autoCapitalize="none"
                                error={error?.message}
                            />
                        )}
                    />
                </View>

                <PrimaryButton title="Next →" onPress={handleSubmit(onSubmit)} style={styles.button} />
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
