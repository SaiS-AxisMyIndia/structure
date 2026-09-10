import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect as SvgRect } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';
import { AppFonts } from '../../theme/AppFonts';
import { BorderButton } from '../buttons/BorderButton';
import { ElevatedButton } from '../buttons/ElevatedButton';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../layouts/Center';
import { ResponsiveView } from '../layouts/ResponsiveView';

export type TargetRect = { x: number; y: number; width: number; height: number };

type WalkthroughOverlayProps = {
  visible: boolean;
  // The screen-space rect of the element this step is pointing at, from
  // that element's own ref.measureInWindow() - null while it hasn't been
  // measured yet, in which case nothing renders.
  rect: TargetRect | null;
  title: string;
  description: string;
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
};

const CUTOUT_PADDING = 6;
const TEXT_MARGIN = 16;

// A single full-screen black mask with a transparent cutout over the
// pointed-at element (cut with an SVG luminance mask, not a stack of
// views), white message text, and Primary-colored text actions. Tapping
// anywhere on the mask advances the walkthrough; only "Skip" dismisses it
// outright.
export function WalkthroughOverlay({
  visible,
  rect,
  title,
  description,
  isLastStep,
  onNext,
  onSkip,
}: WalkthroughOverlayProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [textHeight, setTextHeight] = useState(0);

  if (!visible || !rect) {
    return null;
  }

  const cutout = {
    x: rect.x - CUTOUT_PADDING,
    y: rect.y - CUTOUT_PADDING,
    width: rect.width + CUTOUT_PADDING * 2,
    height: rect.height + CUTOUT_PADDING * 2,
  };

  // Prefer whichever side of the cutout has more room, then clamp against
  // the screen (minus safe-area insets) so the text block never runs off
  // the top/bottom edge regardless of where the target sits.
  const spaceBelow = screenHeight - (cutout.y + cutout.height);
  const spaceAbove = cutout.y;
  const minTop = insets.top + TEXT_MARGIN;
  const maxTop = screenHeight - insets.bottom - TEXT_MARGIN - textHeight;
  const idealTop =
    spaceBelow >= spaceAbove ? cutout.y + cutout.height + TEXT_MARGIN : cutout.y - TEXT_MARGIN - textHeight;
  const top = Math.min(Math.max(idealTop, minTop), Math.max(minTop, maxTop));

  const textContent = (
    <>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.actions}>
        <BorderButton label="Skip" onPress={onSkip} fontSize={16} />
        <ElevatedButton
          label={isLastStep ? 'Got it' : 'Next'}
          onPress={onNext}
          fontSize={16}
        />
      </View>
    </>
  );

  // Same MobileCenter/TabletCenter/WebCenter + ResponsiveView pattern the
  // rest of the app uses to cap content width per breakpoint - the
  // walkthrough text gets the same treatment instead of its own fixed
  // margins.
  const renderCentered = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <CenterView style={styles.textCenter}>{textContent}</CenterView>
  );

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onSkip}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onNext}>
        <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="walkthrough-spotlight">
              <SvgRect x={0} y={0} width={screenWidth} height={screenHeight} fill="#fff" />
              <SvgRect
                x={cutout.x}
                y={cutout.y}
                width={cutout.width}
                height={cutout.height}
                rx={12}
                fill="#000"
              />
            </Mask>
          </Defs>
          <SvgRect
            x={0}
            y={0}
            width={screenWidth}
            height={screenHeight}
            fill="rgba(0,0,0,0.85)"
            mask="url(#walkthrough-spotlight)"
          />
        </Svg>

        <View style={[styles.textBlock, { top }]} onLayout={e => setTextHeight(e.nativeEvent.layout.height)}>
          <ResponsiveView
            mobile={renderCentered(MobileCenter)}
            tablet={renderCentered(TabletCenter)}
            web={renderCentered(WebCenter)}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  textBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  textCenter: {
    paddingHorizontal: TEXT_MARGIN,
    // alignItems: 'center',
  },
  title: {
    fontFamily: AppFonts.semiBold,
    fontSize: 16,
    color: AppColors.white,
    marginBottom: 6,
  },
  description: {
    fontFamily: AppFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.white,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
});
