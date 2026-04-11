import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
    iconName: string;
    buttonName: string;
    onPress: () => void;
}

export function ProfileButton(props: Props) {
    return (
        <Pressable onPress={props.onPress}>
            <View style={styles.row}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{iconEmoji(props.iconName)}</Text>
                </View>
                <Text style={styles.label}>{props.buttonName}</Text>
                <Text style={styles.chevron}>›</Text>
            </View>
        </Pressable>
    );
}

function iconEmoji(name: string): string {
    const map: Record<string, string> = {
        settings: '⚙️',
        'credit-card': '💳',
        logout: '🚪',
    };
    return map[name] ?? '•';
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    iconBox: { width: 55, height: 55, backgroundColor: '#e0e0e0', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 24 },
    label: { marginLeft: 12, fontSize: 18, flex: 1 },
    chevron: { fontSize: 28, color: '#000', marginRight: 18 },
});
