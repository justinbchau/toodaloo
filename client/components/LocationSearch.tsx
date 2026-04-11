import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

export default function LocationSearch() {
    const { colors } = useThemeContext();
    const [value, setValue] = useState('');

    return (
        <View style={{
            flex: 1,
            backgroundColor: colors.surface2,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.borderMed,
            paddingHorizontal: 12,
            justifyContent: 'center',
        }}>
            <TextInput
                placeholder="Search location"
                placeholderTextColor={colors.text3}
                value={value}
                onChangeText={setValue}
                style={{
                    color: colors.text1,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    fontSize: 14,
                    height: 44,
                }}
            />
        </View>
    );
}
