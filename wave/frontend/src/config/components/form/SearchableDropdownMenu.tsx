import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextStyle, useWindowDimensions, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { DropdownOption } from './Dropdowner';

export type SearchableDropdownAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SearchableDropdownMenuProps = {
  visible: boolean;
  anchor: SearchableDropdownAnchor | null;
  options: DropdownOption[];
  value: string;
  searchPlaceholder?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

const ROW_HEIGHT = 44;
const SEARCH_BAR_HEIGHT = 48;
const LIST_MAX_HEIGHT = 220;
const MENU_GAP = 4;

// Same outline-suppression EditText.tsx's own webInputStyle uses -
// react-native-web renders TextInput as a plain <input>, which draws the
// browser's own focus ring inside our bordered searchBar otherwise.
const webInputStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

// Same anchored-popover shell as DropdownMenu.tsx, plus a search box
// pinned above the list - for option sets too long to scan by eye (e.g. a
// state/bank/district list), unlike Gender/Occupation's short lists (which
// use the plain DropdownMenu instead). The query resets every time the
// menu opens, not just once on mount, so a stale search doesn't linger
// from the previous open.
export function SearchableDropdownMenu({
  visible,
  anchor,
  options,
  value,
  searchPlaceholder = 'Search',
  onClose,
  onSelect,
}: SearchableDropdownMenuProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {setQuery('');}
  }, [visible]);

  if (!visible || !anchor) {return null;}

  const filtered = query.trim()
    ? options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const listHeight = Math.min(LIST_MAX_HEIGHT, Math.max(filtered.length, 1) * ROW_HEIGHT);
  const menuHeight = SEARCH_BAR_HEIGHT + listHeight;
  const spaceBelow = windowHeight - (anchor.y + anchor.height);
  const openUpward = spaceBelow < menuHeight + MENU_GAP && anchor.y > menuHeight;
  const top = openUpward ? anchor.y - menuHeight - MENU_GAP : anchor.y + anchor.height + MENU_GAP;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.menu, { top, left: anchor.x, width: anchor.width, maxHeight: menuHeight }]}>
        <View style={styles.searchBar}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={AppColors.neutral300}
            style={[styles.searchInput, webInputStyle]}
            autoFocus
          />
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: listHeight }} bounces={false}>
            {filtered.map((option, index) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.row, index === filtered.length - 1 && styles.rowLast]}
                  onPress={() => onSelect(selected ? '' : option.value)}
                >
                  <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]} numberOfLines={1}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: AppColors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.neutral300,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  searchBar: {
    height: SEARCH_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral100,
  },
  searchInput: {
    fontSize: 14,
    color: AppColors.neutral500,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral100,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    color: AppColors.neutral500,
  },
  rowLabelSelected: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  emptyRow: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.neutral300,
  },
});
