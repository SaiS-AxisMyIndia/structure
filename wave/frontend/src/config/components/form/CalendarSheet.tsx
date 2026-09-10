import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { AppConstants } from '../../constants/AppConstants';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { useSheetTransition } from '../layouts/useSheetTransition';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
// A birth date reasonably never needs to go back further than this - keeps
// the year list short enough to render (and scroll) without pagination.
const YEAR_RANGE = 100;

export type CalendarSheetProps = {
  visible: boolean;
  value?: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
};

type Mode = 'years' | 'months' | 'days';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// A from-scratch drill-down calendar (years -> months -> days) - no date
// picker library exists in this app (see guide/todo.md), and a plain
// prev/next-month-arrow-only picker would take dozens of taps to reach a
// birth year decades back, so year and month each get their own picker
// step instead of only ever stepping one month at a time.
export function CalendarSheet({ visible, value, onClose, onSelect }: CalendarSheetProps) {
  const { backdropOpacity, sheetTranslateY } = useSheetTransition(visible);
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState<Mode>('days');
  const [viewYear, setViewYear] = useState((value ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((value ?? today).getMonth());

  // Re-sync to the field's current value (or today, if empty) every time
  // the sheet opens - otherwise a previous session's drilldown position
  // would still be showing on the next open.
  useEffect(() => {
    if (!visible) {return;}
    const base = value ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setMode('days');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const years = useMemo(
    () => Array.from({ length: YEAR_RANGE + 1 }, (_, i) => today.getFullYear() - i),
    [today],
  );

  const dayCells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const total = daysInMonth(viewYear, viewMonth);
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const selectDay = (day: number) => {
    onSelect(new Date(viewYear, viewMonth, day));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <AnimatedPressable style={[styles.backdrop, { opacity: backdropOpacity }]} onPress={onClose} />
      <Animated.View style={[styles.sheetPosition, { transform: [{ translateY: sheetTranslateY }] }]}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <SvgIcon icon={SvgIcons.close} size={20} color={AppColors.neutral500} />
            </Pressable>
          </View>

          {mode === 'days' && (
            <>
              <View style={styles.monthNav}>
                <Pressable onPress={goPrevMonth} hitSlop={8}>
                  <SvgIcon icon={SvgIcons.chevronLeft} size={18} />
                </Pressable>
                <View style={styles.monthYearRow}>
                  <Pressable onPress={() => setMode('months')}>
                    <Text style={styles.monthYearText}>{MONTH_NAMES[viewMonth]}</Text>
                  </Pressable>
                  <Pressable onPress={() => setMode('years')}>
                    <Text style={styles.monthYearText}>{viewYear}</Text>
                  </Pressable>
                </View>
                <Pressable onPress={goNextMonth} hitSlop={8}>
                  <SvgIcon icon={SvgIcons.chevronRight} size={18} />
                </Pressable>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map(dayLabel => (
                  <Text key={dayLabel} style={styles.weekdayLabel}>{dayLabel}</Text>
                ))}
              </View>

              <View style={styles.dayGrid}>
                {dayCells.map((day, index) => {
                  const cellDate = day ? new Date(viewYear, viewMonth, day) : null;
                  const selected = !!(cellDate && value && isSameDay(cellDate, value));
                  const isToday = !!(cellDate && isSameDay(cellDate, today));
                  return (
                    <Pressable
                      key={index}
                      disabled={!day}
                      style={[styles.dayCell, selected && styles.dayCellSelected]}
                      onPress={() => day && selectDay(day)}
                    >
                      {day && (
                        <Text style={[styles.dayText, isToday && !selected && styles.dayTextToday, selected && styles.dayTextSelected]}>
                          {day}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {mode === 'months' && (
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((name, index) => (
                <Pressable
                  key={name}
                  style={styles.monthCell}
                  onPress={() => {
                    setViewMonth(index);
                    setMode('days');
                  }}
                >
                  <Text style={[styles.monthCellText, index === viewMonth && styles.monthCellTextSelected]}>
                    {name.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {mode === 'years' && (
            <ScrollView style={styles.yearList}>
              {years.map(year => (
                <Pressable
                  key={year}
                  style={styles.yearRow}
                  onPress={() => {
                    setViewYear(year);
                    setMode('months');
                  }}
                >
                  <Text style={[styles.yearText, year === viewYear && styles.yearTextSelected]}>{year}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheetPosition: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: AppConstants.maxWidth.mobile,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.secondary100,
    padding: 16,
    gap: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthYearRow: {
    flexDirection: 'row',
    gap: 10,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flexBasis: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.neutral400,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    flexBasis: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: AppColors.primary,
  },
  dayText: {
    fontSize: 14,
    color: AppColors.neutral500,
  },
  dayTextToday: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  dayTextSelected: {
    fontWeight: '700',
    color: AppColors.white,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    flexBasis: '33.33%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellText: {
    fontSize: 14,
    color: AppColors.neutral500,
  },
  monthCellTextSelected: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  yearList: {
    maxHeight: 320,
  },
  yearRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  yearText: {
    fontSize: 15,
    color: AppColors.neutral500,
  },
  yearTextSelected: {
    fontWeight: '700',
    color: AppColors.primary,
  },
});
