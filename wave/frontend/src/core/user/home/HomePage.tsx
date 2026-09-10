import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TabScreenView } from '../../../config/components/layouts/TabScreenView';
import { userTabConfig } from '../../../config/components/bottombar/userTabConfig';
import { BottomType } from '../../../config/components/bottombar/BottomBar';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../../../config/components/layouts/Center';
import { useHomeController } from './HomeController';
import { AppConstants } from '../../../config/constants/AppConstants';
import { AppColors } from '../../../config/theme/AppColors';
import { YouMightLikeTile } from '../../../config/components/home/YouMightLikeTile';
import { MatchedCard } from '../../../config/components/home/MatchedCard';
import { AmiForYouTile } from '../../../config/components/home/AmiForYouTile';
import { CategoryGridCard } from '../../../config/components/home/CategoryGridCard';
import { CategoryGridSection } from '../../../config/components/home/CategoryGridModel';
import { SectionFooter } from '../../../config/components/home/SectionFooter';
import { BannerSliderTile } from '../../../config/components/carousel/BannerSliderTile';
import { Carousel } from '../../../config/components/carousel/Carousel';
import { ImageLoader } from '../../../config/components/images/ImageLoader';

// Renders one categoryGrids entry (Schemes/Services/Jobs) at whatever point
// in the page it's placed - each is looked up individually (see
// schemesGrid/servicesGrid/jobsGrid below) rather than mapped as one group,
// so other sections can sit between them instead of all three stacking
// together.
function CategoryGridSectionBlock({ section }: { section?: CategoryGridSection }) {
  if (!section) {return null;}

  return (
    <View style={styles.relatedSection}>
      <Text style={styles.relatedTitle}>{section.title}</Text>
      <View style={styles.categoryGridWrap}>
        <CategoryGridCard items={section.items} count={section.count} countLabel={section.countLabel} route={section.route} />
      </View>
    </View>
  );
}

// No ScreenView here - on mobile/tablet this is swapped into BottomBarView
// (BODIES map), which supplies MainBar + BottomBar; on web, TabScreenView's
// own web branch supplies MainBar via ScreenView instead. Either way this
// body owns none of that chrome itself.
export function HomeBody() {
  const controller = useHomeController();
  const {
    summary,
    inactiveProfileCards,
    onCardPress,
    preferredNews,
    youMightLike,
    bannerSliderItems,
    matchedCards,
    amiForYou,
    categoryGrids,
    carouselResetKey,
    onCarouselFullyVisible,
    onCarouselVideoPlay,
    onCarouselImagePress,
    reload,
  } = controller;

  const schemesGrid = categoryGrids.find(section => section.id === 'schemes');
  const servicesGrid = categoryGrids.find(section => section.id === 'services');
  const jobsGrid = categoryGrids.find(section => section.id === 'jobs');

  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        <ScrollView contentContainerStyle={styles.container}>
            <CenterView style={styles.sections}>
              
              {summary ? (
                <View style={styles.carouselContainer}>
                  <Carousel
                    key={carouselResetKey}
                    autoScroll={5000}
                    borderRadius={10}
                    items={summary.carouselItems}
                    onFullyVisible={onCarouselFullyVisible}
                    onVideoPlay={onCarouselVideoPlay}
                    onImagePress={onCarouselImagePress}
                  />
                </View>
              ) : null}

              {matchedCards.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.matchedCardsRow}
                >
                  {matchedCards.map(item => (
                    <MatchedCard key={item.id} title={item.title} count={item.count} route={item.route} />
                  ))}
                </ScrollView>
              ) : null}

              {inactiveProfileCards.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.progressRow}
                >
                  {inactiveProfileCards.map(card => (
                    <View key={card.title}>
                      {renderProfileProgressCard(card, () => onCardPress(card))}
                    </View>
                  ))}
                </ScrollView>
              ) : null}


              {amiForYou.length > 0 ? (
                <View style={styles.relatedSection}>
                  <Text style={styles.relatedTitle}>AMI for you</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.amiForYouRow}
                  >
                    {amiForYou.map(item => (
                      <AmiForYouTile key={item.id} item={item} />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <CategoryGridSectionBlock section={schemesGrid} />

              {youMightLike.length > 0 ? (
                <View style={styles.relatedSection}>
                  <Text style={styles.relatedTitle}>You Might Like</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.youMightLikeRow}
                  >
                    {youMightLike.map(item => (
                      <YouMightLikeTile key={item.id} item={item} />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <CategoryGridSectionBlock section={jobsGrid} />
              {bannerSliderItems.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bannerSliderRow}
                >
                  {bannerSliderItems.map(item => (
                    <BannerSliderTile key={item.id} item={item} />
                  ))}
                </ScrollView>
              ) : null}

              {preferredNews.length > 0 ? (
                <View style={styles.relatedSection}>
                  <Text style={styles.relatedTitle}>Trending News</Text>
                  {preferredNews.map(item => (
                    <CompactNewsTile key={item.id} {...item} />
                  ))}
                  <View style={styles.newsFooterWrap}>
                    <SectionFooter route="/user/news">
                      <Text style={styles.newsCaption}>Live News</Text>
                    </SectionFooter>
                  </View>
                </View>
              ) : null}

              <CategoryGridSectionBlock section={servicesGrid} />

              <Pressable style={styles.bannerPressable} onPress={controller.onBannerPress}>
                <ImageLoader
                  source={{ uri: AppConstants.dummyImageUrl }}
                  aspectRatio={16 / 9}
                  borderRadius={10}
                />
              </Pressable>

            </CenterView>
          </ScrollView>
      }
    />
  );

  function mobile() {
    return renderBody(MobileCenter);
  }

  function tablet() {
    return renderBody(TabletCenter);
  }

  function web() {
    return renderBody(WebCenter);
  }

  return <ResponsiveView mobile={mobile()} tablet={tablet()} web={web()} />;
}

export function HomePage() {
  return <TabScreenView config={userTabConfig} tab={BottomType.home} body={<HomeBody />} isHome />;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  sections: {
    gap: 32,
  },
  bannerPressable: {
    paddingHorizontal: 16,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  stat: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  carouselContainer: {
    paddingHorizontal: 16,
  },
  matchedCardsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  youMightLikeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  amiForYouRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  categoryGridWrap: {
    paddingHorizontal: 16,
  },
  newsFooterWrap: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  newsCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  bannerSliderRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  testSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  testLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  relatedSection: {},
  relatedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
});
