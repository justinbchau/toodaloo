import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FilterButtonProps {
    title: string;
    onPress?: () => void;
}

export function FilterButton(props: FilterButtonProps) {
    return (
        <TouchableOpacity style={styles.tag} onPress={props.onPress}>
            <Text style={styles.text}>{props.title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    tag: { borderWidth: 1, borderColor: '#888', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, backgroundColor: '#fff' },
    text: { fontSize: 12, color: '#000' },
});
