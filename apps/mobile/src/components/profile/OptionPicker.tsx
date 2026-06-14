import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface OptionPickerProps<T extends string | number> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  getDisplayLabel?: (option: T) => string;
}

export function OptionPicker<T extends string | number>({
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
    color: '#8A7A60',
    fontSize: 12,
    fontWeight: '500',
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
    borderColor: '#E8E0D0',
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  smallRadio: {
    borderWidth: 1,
    borderColor: '#E8E0D0',
    backgroundColor: '#F5F0E8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  radioSelected: {
    borderColor: '#B5620E',
    backgroundColor: '#B5620E',
  },
  radioText: {
    color: '#3D2E1A',
    fontWeight: '500',
    fontSize: 13,
  },
  radioTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
