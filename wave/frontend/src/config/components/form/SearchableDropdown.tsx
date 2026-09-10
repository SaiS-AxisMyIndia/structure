import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { DropdownOption } from './Dropdowner';
import { SearchableDropdownAnchor, SearchableDropdownMenu } from './SearchableDropdownMenu';

export type SearchableDropdownProps = {
  label?: string;
  // See EditText.tsx's own `required` prop - same purely-visual asterisk,
  // same "form itself still validates" caveat.
  required?: boolean;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  // Same as Dropdowner.tsx's own `clearable` - off by default, shows a
  // clear (X) button in front of the chevron once a value is selected.
  clearable?: boolean;
};

// Same field shell as Dropdowner.tsx, opening SearchableDropdownMenu.tsx
// instead of DropdownMenu.tsx - for option sets long enough that typing to
// filter beats scrolling to find one (e.g. a state/district/bank list),
// unlike Gender/Occupation's short lists, which stay on the plain
// Dropdowner.
export function SearchableDropdown({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = 'Select',
  searchPlaceholder,
  error,
  clearable = false,
}: SearchableDropdownProps) {
  const fieldRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<SearchableDropdownAnchor | null>(null);
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
          <View style={visible && styles.chevronOpen}>
            <SvgIcon icon={SvgIcons.chevronDown} size={16} color={visible ? AppColors.primary : AppColors.neutral400} />
          </View>
        )}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <SearchableDropdownMenu
        visible={visible}
        anchor={anchor}
        options={options}
        value={value}
        searchPlaceholder={searchPlaceholder}
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
