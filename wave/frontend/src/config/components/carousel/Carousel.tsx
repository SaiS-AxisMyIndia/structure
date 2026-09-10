import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ViewToken,
} from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { ImageLoader } from '../images/ImageLoader';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AVideoPlayer } from '../players/AVideoPlayer';
import { CarouselImageModel, CarouselModel, CarouselVideoModel } from './CarouselModel';

const ASPECT_RATIO = 16 / 9;
const FULLY_VISIBLE_CONFIG = { itemVisiblePercentThreshold: 100 };

export type CarouselProps = {
  items: CarouselModel[];
  // Fires every time a slide *newly* becomes fully visible while the
  // carousel itself is on-screen - each transition into full visibility is
  // one call, not one per frame it stays visible. `repeat` is false the
  // very first time a given slide id has ever fired this, true every time
  // after (scrolled/auto-scrolled back to, or the carousel itself scrolled
  // off-screen and back) - callers decide what a repeat should count as.
  onFullyVisible?: (item: CarouselModel, repeat: boolean) => void;
  onVideoPlay?: (item: CarouselVideoModel) => void;
  onImagePress?: (item: CarouselImageModel) => void;
  styles?: StyleProp<ViewStyle>;
  borderRadius?: number;
  autoScroll?: number;
  // Every existing caller (Home/Explore's banner sliders) is a wide 16:9
  // banner - ProductDetailsPage's gallery is a near-square product photo,
  // so this overrides the default rather than baking one ratio in for
  // every caller.
  aspectRatio?: number;
};

export function Carousel({
  items,
  onFullyVisible,
  onVideoPlay,
  onImagePress,
  styles: styleOverride,
  borderRadius,
  autoScroll,
  aspectRatio = ASPECT_RATIO,
}: CarouselProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullyVisibleIds, setFullyVisibleIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [playingVideoIds, setPlayingVideoIds] = useState<Set<string>>(new Set());
  const [isContainerVisible, setIsContainerVisible] = useState(true);
  const flatListRef = useRef<FlatList<CarouselModel>>(null);
  const containerRef = useRef<View>(null);
  const suppressNextClickRef = useRef(false);
  const suppressClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseDragRef = useRef<{ startX: number; startScrollLeft: number; maxDelta: number } | null>(null);
  const everVisibleIds = useRef<Set<string>>(new Set());
  const previousVisibleIdsRef = useRef<Set<string>>(new Set());

  const armClickSuppression = useCallback(() => {
    suppressNextClickRef.current = true;
    if (suppressClickTimerRef.current) {
      clearTimeout(suppressClickTimerRef.current);
    }
    suppressClickTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = false;
    }, 300);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const node = containerRef.current as unknown as HTMLElement | null;
      if (!node || typeof IntersectionObserver === 'undefined') {
        return;
      }
      const observer = new IntersectionObserver(([entry]) => setIsContainerVisible(entry.intersectionRatio >= 0.5), {
        threshold: 0.5,
      });
      observer.observe(node);
      return () => observer.disconnect();
    }

    let cancelled = false;
    const measure = () => {
      if (cancelled) {
        return;
      }
      containerRef.current?.measureInWindow((_x, y, _measuredWidth, height) => {
        if (cancelled || height <= 0) {
          return;
        }
        const windowHeight = Dimensions.get('window').height;
        const visibleHeight = Math.max(0, Math.min(windowHeight, y + height) - Math.max(0, y));
        setIsContainerVisible(visibleHeight / height >= 0.5);
      });
    };
    measure();
    const interval = setInterval(measure, 250);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) {
      return;
    }
    const handleClickCapture = (e: MouseEvent) => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        if (suppressClickTimerRef.current) {
          clearTimeout(suppressClickTimerRef.current);
        }
        e.stopPropagation();
        e.preventDefault();
      }
    };
    node.addEventListener('click', handleClickCapture, true);
    return () => node.removeEventListener('click', handleClickCapture, true);
  }, []);

  const handleMouseDown = useCallback(
    (e: { clientX: number }) => {
      const node = flatListRef.current?.getScrollableNode?.() as
        | (EventTarget & { scrollLeft: number })
        | undefined;
      if (!node) {
        return;
      }
      mouseDragRef.current = { startX: e.clientX, startScrollLeft: node.scrollLeft, maxDelta: 0 };
      setIsDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const drag = mouseDragRef.current;
        if (!drag) {
          return;
        }
        const delta = moveEvent.clientX - drag.startX;
        drag.maxDelta = Math.max(drag.maxDelta, Math.abs(delta));
        node.scrollLeft = drag.startScrollLeft - delta;
      };
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        const drag = mouseDragRef.current;
        mouseDragRef.current = null;
        setIsDragging(false);
        if (!drag) {
          return;
        }
        if (drag.maxDelta > 5) {
          armClickSuppression();
          if (width > 0) {
            const nearestIndex = Math.max(0, Math.min(items.length - 1, Math.round(node.scrollLeft / width)));
            flatListRef.current?.scrollToIndex({ index: nearestIndex, animated: true });
          }
        }
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, items.length, armClickSuppression],
  );

  const handleVideoPlay = useCallback(
    (item: CarouselVideoModel) => {
      setPlayingVideoIds(prev => new Set(prev).add(item.id));
      onVideoPlay?.(item);
    },
    [onVideoPlay],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setFullyVisibleIds(new Set(viewableItems.map(v => (v.item as CarouselModel).id)));
    },
  ).current;

  useEffect(() => {
    if (!isContainerVisible) {
      // Not on-screen right now - whatever's internally "visible" doesn't
      // count as seen. Clearing this means the same set becomes a fresh
      // rising edge next time the carousel actually scrolls back into view.
      previousVisibleIdsRef.current = new Set();
      return;
    }
    fullyVisibleIds.forEach(id => {
      if (previousVisibleIdsRef.current.has(id)) {
        // Already fully visible as of the last run - not a new transition.
        return;
      }
      const repeat = everVisibleIds.current.has(id);
      everVisibleIds.current.add(id);
      const item = items.find(i => i.id === id);
      if (item) {
        onFullyVisible?.(item, repeat);
      }
    });
    previousVisibleIdsRef.current = new Set(fullyVisibleIds);
  }, [fullyVisibleIds, isContainerVisible, items, onFullyVisible]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) {
        return;
      }
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width],
  );

  const activeItem = items[activeIndex];
  const activeIsPlayingVideo = activeItem?.kind === 'video' && playingVideoIds.has(activeItem.id);

  // Auto-advances to the next slide (looping back to the first) every
  // `autoScroll` ms. Re-armed off activeIndex itself rather than a
  // free-running interval, so a manual swipe (which updates activeIndex via
  // onScroll above) pushes the next auto-advance out instead of racing it.
  // Suspended entirely while the user's finger is down (so it
  // can't fire mid-gesture and fight their own scroll) and while the active
  // slide is a video the user has started playing (so it doesn't get
  // yanked away mid-watch).
  useEffect(() => {
    if (!autoScroll || items.length <= 1 || isDragging || activeIsPlayingVideo || !isContainerVisible) {
      return;
    }
    const timer = setTimeout(() => {
      const nextIndex = (activeIndex + 1) % items.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, autoScroll);
    return () => clearTimeout(timer);
  }, [activeIndex, autoScroll, items.length, isDragging, activeIsPlayingVideo, isContainerVisible]);

  return (
    <View
      ref={containerRef}
      style={[styles.container, borderRadius != null && Themer.iosRadius(borderRadius), styleOverride]}
      onLayout={onLayout}
    >
      {width > 0 && (
        <>
          <FlatList
            ref={flatListRef}
            data={items}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            onScrollBeginDrag={() => setIsDragging(true)}
            onScrollEndDrag={() => {
              setIsDragging(false);
              // Defense in depth for a touch drag on web (handleMouseDown
              // only covers the mouse path) - a real onScrollBeginDrag/
              // onScrollEndDrag pair only fires for an actual drag, never a
              // plain tap, so this can't false-positive a genuine press.
              armClickSuppression();
            }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={FULLY_VISIBLE_CONFIG}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            {...({ onMouseDown: handleMouseDown } as object)}
            renderItem={({ item }) => (
              <View style={{ width }}>
                {item.kind === 'image' ? (
                  <CarouselImageSlide item={item} onPress={onImagePress} aspectRatio={aspectRatio} />
                ) : (
                  <CarouselVideoSlide
                    item={item}
                    isFullyVisible={isContainerVisible && fullyVisibleIds.has(item.id)}
                    onPlay={handleVideoPlay}
                    aspectRatio={aspectRatio}
                  />
                )}
              </View>
            )}
          />
          {items.length > 1 && <CarouselDots count={items.length} activeIndex={activeIndex} />}
        </>
      )}
    </View>
  );
}

function CarouselImageSlide({
  item,
  onPress,
  aspectRatio,
}: {
  item: CarouselImageModel;
  onPress?: (item: CarouselImageModel) => void;
  aspectRatio: number;
}) {
  return (
    <Pressable onPress={() => onPress?.(item)}>
      <ImageLoader source={{ uri: item.image }} style={styles.media} aspectRatio={aspectRatio} />
    </Pressable>
  );
}

function CarouselVideoSlide({
  item,
  isFullyVisible,
  onPlay,
  aspectRatio,
}: {
  item: CarouselVideoModel;
  isFullyVisible: boolean;
  onPlay?: (item: CarouselVideoModel) => void;
  aspectRatio: number;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPress = () => {
    if (!isFullyVisible) {
      return;
    }
    setIsPlaying(true);
    onPlay?.(item);
  };

  if (!isPlaying) {
    return (
      <View style={[styles.media, { aspectRatio }]}>
        <ImageLoader source={{ uri: item.thumbnail }} style={styles.media} aspectRatio={aspectRatio} />
        <Pressable style={styles.playButton} onPress={handlePlayPress}>
          <SvgIcon icon={SvgIcons.play} size={22} />
        </Pressable>
      </View>
    );
  }

  return (
    <AVideoPlayer
      source={item.url}
      sourceType={item.source}
      aspectRatio={aspectRatio}
      autoPlay
      isActive={isFullyVisible}
    />
  );
}

function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dotsWrap} pointerEvents="none">
      <View style={styles.dotsRow}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  media: {
    width: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 52,
    height: 52,
    marginTop: -26,
    marginLeft: -26,
    borderRadius: 26,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    // White at 80% opacity, not a transparent dot backdrop with plain white
    // dots on top - a plain white dot at low opacity disappears against a
    // light slide, this pill stays visible (and the dots' own colors below
    // stay legible) regardless of what's underneath.
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.neutral400,
  },
  dotActive: {
    width: 16,
    backgroundColor: AppColors.primary,
  },
});
