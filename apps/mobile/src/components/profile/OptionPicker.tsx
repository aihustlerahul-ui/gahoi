import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface OptionPickerProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  getDisplayLabel?: (option: T) => string;
}

export function OptionPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  compact = false,
  getDisplayLabel,
}: OptionPickerProps<T>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={compact ? styles.pickerRow : styles.row}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              compact ? styles.smallRadio : styles.radio,
              value === option ? styles.radioSelected : null,
            ]}
            onPress={() => onChange(option)}
          >
            <Text style={value === option ? styles.radioTextSelected : styles.radioText}>
              {getDisplayLabel ? getDisplayLabel(option) : option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#D4BFA0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  radio: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3D281C',
    backgroundColor: '#2C1A10',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  smallRadio: {
    borderWidth: 1,
    borderColor: '#3D281C',
    backgroundColor: '#2C1A10',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  radioSelected: {
    borderColor: '#E8B84B',
    backgroundColor: '#FFF9F0',
  },
  radioText: {
    color: '#D4BFA0',
    fontWeight: '600',
    fontSize: 14,
  },
  radioTextSelected: {
    color: '#1A0800',
    fontWeight: '700',
    fontSize: 14,
  },
});
