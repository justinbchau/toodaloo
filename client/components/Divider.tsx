import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
    marginTop: string | number;
    width: string | number;
}

export function Divider(props: Props) {
    return (
        <View style={[styles.container, { marginTop: typeof props.marginTop === 'string' ? 16 : props.marginTop, width: props.width as any }]}>
            <View style={styles.line} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    line: { height: 1, flex: 1, backgroundColor: '#ccc' },
});
