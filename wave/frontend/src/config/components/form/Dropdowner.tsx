import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { DropdownAnchor, DropdownMenu } from './DropdownMenu';

export type DropdownOption = {
  label: string;
  value: string;
};

export type DropdownerProps = {
  label?: string;
  // See EditText.tsx's own `required` prop - same purely-visual asterisk,
  // same "form itself still validates" caveat.
  required?: boolean;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  // Off by default - opt in per field. Shows a small clear (X) button in
  // the field itself, in front of the chevron, once a value is selected;
  // pressing it calls onChange('') directly without opening the menu.
  clearable?: boolean;
};

// The one general-purpose select field this app has - same label/required/
// error shape as EditText.tsx/DatePicker.tsx. Opens as a real inline
// dropdown anchored under the field itself (see DropdownMenu.tsx), not a
// bottom sheet.
export function Dropdowner({ label, required, options, value, onChange, placeholder = 'Select', error, clearable = false }: DropdownerProps) {
  const fieldRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<DropdownAnchor | null>(null);
  const selected = options.find(option => option.value === value);

  const openMenu = () => {
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setVisible(true);
    });
  };

  const closeMenu = () => setVisible(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <Pressable
        ref={fieldRef}
        style={[styles.inputRow, visible && styles.inputRowOpen, error && styles.inputError]}
        onPress={openMenu}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        {clearable && selected ? (
          <Pressable hitSlop={8} onPress={() => onChange('')}>
            <SvgIcon icon={SvgIcons.close} size={14} color={AppColors.neutral400} />
          </Pressable>
        ) : (
          // Flips to point up while the menu is open - the same "this
          // control is currently expanded" cue a native select's own arrow
          // gives, and the one thing here that isn't already covered by
          // inputRowOpen's border alone.
          <View style={visible && styles.chevronOpen}>
            <SvgIcon icon={SvgIcons.chevronDown} size={16} color={visible ? AppColors.primary : AppColors.neutral400} />
          </View>
        )}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <DropdownMenu
        visible={visible}
        anchor={anchor}
        options={options}
        value={value}
        onClose={closeMenu}
        onSelect={selectedValue => {
          onChange(selectedValue);
          closeMenu();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  required: {
    color: AppColors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.neutral200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  inputError: {
    borderColor: AppColors.secondary,
  },
  inputRowOpen: {
    borderColor: AppColors.neutral400,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: AppColors.neutral500,
  },
  placeholder: {
    color: AppColors.neutral300,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.secondary,
  },
});
