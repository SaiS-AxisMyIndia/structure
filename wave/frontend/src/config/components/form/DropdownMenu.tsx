import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { DropdownOption } from './Dropdowner';

export type DropdownAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DropdownMenuProps = {
  visible: boolean;
  anchor: DropdownAnchor | null;
  options: DropdownOption[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

const ROW_HEIGHT = 44;
const MENU_MAX_HEIGHT = 220;
const MENU_GAP = 4;


export function DropdownMenu({ visible, anchor, options, value, onClose, onSelect }: DropdownMenuProps) {
  const { height: windowHeight } = useWindowDimensions();

  if (!visible || !anchor) {return null;}

  const menuHeight = Math.min(MENU_MAX_HEIGHT, options.length * ROW_HEIGHT);
  const spaceBelow = windowHeight - (anchor.y + anchor.height);
  const openUpward = spaceBelow < menuHeight + MENU_GAP && anchor.y > menuHeight;
  const top = openUpward ? anchor.y - menuHeight - MENU_GAP : anchor.y + anchor.height + MENU_GAP;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Dimmed, same as every other sheet in this app (ProfileMenuSheet.tsx/
          DeleteAccountSheet.tsx's own backdrop) - fully transparent made the
          popover read as just another row of the form sitting behind it
          instead of a temporary overlay in front of it. */}
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.menu, { top, left: anchor.x, width: anchor.width, maxHeight: menuHeight }]}>
        <ScrollView bounces={false}>
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                style={[styles.row, index === options.length - 1 && styles.rowLast]}
                onPress={() => onSelect(selected ? '' : option.value)}
              >
                <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]} numberOfLines={1}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
    borderColor: AppColors.neutral200,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
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
});
