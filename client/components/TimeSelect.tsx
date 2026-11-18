import React, { useState } from 'react';
import { Modal, Pressable, Text, View, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import { formatTime, toMinutes, TIME_SLOTS } from '../lib/hours';

const ROW_HEIGHT = 48;

interface Props {
  /** "HH:MM" */
  value: string;
  onChange: (v: string) => void;
  /** Accessible name, e.g. "Weekdays opening time". */
  label: string;
  disabled?: boolean;
}

/**
 * A time "field" that opens a bottom sheet of half-hour slots. JS-only (no
 * native date picker dependency) so it ships over-the-air.
 */
export function TimeSelect({ value, onChange, label, disabled }: Props) {
  const { colors } = useThemeContext();
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, TIME_SLOTS.indexOf(value));

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatTime(toMinutes(value))}`}
        style={({ pressed }: { pressed: boolean }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.surface2,
          borderRadius: 10,
          paddingHorizontal: 10,
          height: 36,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
          {formatTime(toMinutes(value))}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={16} color={colors.text2} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityLabel="Dismiss time picker"
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.surface1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingBottom: 28, maxHeight: '60%' }}
          >
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.surface3, marginBottom: 12 }} />
            <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, paddingHorizontal: 20, marginBottom: 8 }}>
              {label}
            </Text>
            <FlatList
              data={TIME_SLOTS}
              keyExtractor={(t) => t}
              initialScrollIndex={Math.max(0, selectedIndex - 2)}
              getItemLayout={(_, i) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * i, index: i })}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: ROW_HEIGHT,
                      paddingHorizontal: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: pressed ? colors.surface2 : 'transparent',
                    })}
                  >
                    <Text style={{ color: selected ? colors.accentText : colors.text1, fontFamily: selected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium', fontSize: 16 }}>
                      {formatTime(toMinutes(item))}
                    </Text>
                    {selected ? <MaterialCommunityIcons name="check" size={20} color={colors.accentText} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
