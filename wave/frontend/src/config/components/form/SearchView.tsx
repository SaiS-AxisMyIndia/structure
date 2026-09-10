import React from 'react';
import { Platform, Pressable, StyleSheet, TextInput, TextStyle, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { Routes } from '../../routes/registry';
import { SearchViewController } from './SearchViewController';
import { useVoiceSearch } from './useVoiceSearch';

const MIC_ICON_SIZE = 18;
const FILTER_ICON_SIZE = 18;
const BACK_ICON_SIZE = 20;

const webInputStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

export type SearchViewProps = {
  controller: SearchViewController;
  hint?: string;
  onSubmit?: (value: string) => void;
  // Opt-in - only renders the filter button when a caller actually wants
  // one (every *SearchPage does; the decorative, non-interactive
  // SearchView on the plain Jobs/Schemes/Skills/Products/Services
  // list screens and on Explore doesn't pass this).
  onFilterPress?: () => void;
  // Opt-in - a *SearchPage passes its own scrollController.atTop here so
  // this back button and TitleBar's own stay in sync.
  showBack?: boolean;
};

export function SearchView({ controller, hint = 'Search', onSubmit, onFilterPress, showBack }: SearchViewProps) {
  const { value, setValue, inputRef } = controller;
  // Mic press asks for microphone permission (via config/permission) then
  // fills the input from native speech-to-text - no cloud API, no
  // caller-supplied wiring needed per screen.
  const voiceSearch = useVoiceSearch(setValue);

  return (
    <View style={styles.row}>
      {showBack && (
        <Pressable onPress={() => Routes.back()} hitSlop={8} style={styles.backButton}>
          <SvgIcon icon={SvgIcons.back} size={BACK_ICON_SIZE} />
        </Pressable>
      )}
      <View style={styles.container}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          placeholder={hint}
          placeholderTextColor={AppColors.neutral300}
          style={[styles.input, webInputStyle]}
          returnKeyType="search"
          onSubmitEditing={() => onSubmit?.(value)}
        />
        {Platform.OS !== 'web' && (
          <Pressable
            onPress={voiceSearch.toggle}
            style={[styles.micButton, voiceSearch.isListening && styles.micButtonActive]}
            hitSlop={8}
          >
            <SvgIcon
              icon={SvgIcons.mic}
              size={MIC_ICON_SIZE}
              color={voiceSearch.isListening ? AppColors.white : AppColors.primary}
            />
          </Pressable>
        )}
      </View>
      {/* Outside the pill, not another circle button inside it - a plain
          standalone icon sitting beside the search box. */}
      {onFilterPress && (
        <Pressable onPress={onFilterPress} style={styles.filterButton} hitSlop={8}>
          <SvgIcon icon={SvgIcons.filter} size={FILTER_ICON_SIZE} color={AppColors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.neutral100,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AppColors.neutral500,
    paddingVertical: 8,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: AppColors.primary,
  },
  filterButton: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
