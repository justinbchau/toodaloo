import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AuthStackParamList } from '../RootStackParams';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';

type loginScreenProp = NativeStackNavigationProp<AuthStackParamList>;

export function SocialButtons() {
    const navigation = useNavigation<loginScreenProp>();
    const { colors } = useThemeContext();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.surface3, borderRadius: 14 }]}
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={styles.appleIcon}></Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: 'transparent', borderColor: colors.borderMed, borderWidth: 1, borderRadius: 14 }]}
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={[styles.googleIcon, { color: colors.purple }]}>G</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', gap: 10, marginTop: 8 },
    button: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    appleIcon: { fontSize: 22, fontFamily: undefined },
    googleIcon: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' },
});
