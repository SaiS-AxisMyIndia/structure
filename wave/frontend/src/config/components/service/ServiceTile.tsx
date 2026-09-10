import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-simple-toast';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { ImageLoader } from '../images/ImageLoader';
import { Routes } from '../../routes/registry';
import { ElevatedButton } from '../buttons/ElevatedButton';
import { StarRating } from '../utils/StarRating';
import { ServiceItem } from './ServiceModel';

export type ServiceTileProps = {
  item: ServiceItem;
  maxWidth?: number;
  onPress?: (item: ServiceItem) => void;
  onSharePress?: (item: ServiceItem) => void;
  // The footer CTA's own action - distinct from `onPress` (viewing the
  // provider's details), same "card press vs. footer button are two
  // different actions" split ProductCard's own onOrderPress uses. Named
  // for what it does here (ringing the provider) rather than reusing
  // ProductCard's "order" naming - see defaultOnCall below.
  onCallPress?: (item: ServiceItem) => void;
  saved?: boolean;
  onSaveToggle?: (item: ServiceItem, saved: boolean) => void;
};

function goToDetails(item: ServiceItem) {
  Routes.user.serviceDetails.navigate({ id: item.id });
}

function defaultOnShare(item: ServiceItem) {
  const url = Routes.user.serviceDetails.shareUrl({ id: item.id });
  Share.share({ message: `${item.name} - ${item.role}\n${url}` }).catch(() => {});
}

function defaultOnCall(item: ServiceItem) {
  // Same "coming soon" convention ProductCard's own defaultOnOrder uses -
  // ServiceItem carries no phone number yet to actually dial.
  Toast.show(`${item.name} - coming soon`, Toast.SHORT);
}

// Same grid-card layout ProductCard.tsx uses (square hero image, rating +
// save row, title/subtitle, location row, share + CTA footer) - a
// deliberately separate component from it though, not a shared/reused one:
// ServiceTile still carries its own service-only bits (a verified badge
// icon beside the star rating, a contacted label in the footer) that
// ProductCard has no concept of, and the footer CTA calls instead of orders.
export function ServiceTile({ item, maxWidth, onPress, onSharePress, onCallPress, saved, onSaveToggle }: ServiceTileProps) {
  const [localSaved, setLocalSaved] = useState(false);
  const isSaved = saved ?? localSaved;

  const handlePress = () => (onPress ?? goToDetails)(item);
  const handleShare = () => (onSharePress ?? defaultOnShare)(item);
  const handleCall = () => (onCallPress ?? defaultOnCall)(item);
  const handleToggleSave = () => {
    const next = !isSaved;
    if (saved === undefined) {setLocalSaved(next);}
    onSaveToggle?.(item, next);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        Themer.shadow(),
        Themer.iosRadius(10),
        // Same "share the grid row evenly, unless a caller wants a fixed
        // width" split ProductCard.tsx's own maxWidth/cardFlex uses -
        // ServiceSearchPage.tsx now chunks its list into row Views the
        // same way ProductSearchPage.tsx does, so this needs the same
        // flex: 1 default to actually fill its share of that row.
        maxWidth != null ? { width: maxWidth } : styles.cardFlex,
      ]}
    >
      <ImageLoader source={{ uri: item.image }} style={styles.image} aspectRatio={1} borderRadius={0} />

      <View style={styles.content}>
        <View style={styles.ratingRow}>
          <View style={styles.ratingLeft}>
            <StarRating rating={item.rating} />
            {item.verified && <SvgIcon icon={SvgIcons.verified} size={16} />}
          </View>
          <Pressable onPress={handleToggleSave} hitSlop={8}>
            <SvgIcon icon={isSaved ? SvgIcons.saved : SvgIcons.save} size={18} />
          </Pressable>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.role} numberOfLines={1}>
          {item.role}
        </Text>
        <View style={styles.locationRow}>
          <SvgIcon icon={SvgIcons.location} size={13} color={AppColors.neutral400} />
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={handleShare} hitSlop={8}>
            <SvgIcon icon={SvgIcons.share} size={18} color={AppColors.neutral400} />
          </Pressable>
          <ElevatedButton
            label="Call"
            icon={SvgIcons.phone}
            iconSize={14}
            onPress={handleCall}
            paddingHorizontal={16}
            paddingVertical={8}
            fontSize={13}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.neutral100,
  },
  cardFlex: {
    flex: 1,
  },
  image: {
    width: '100%',
  },
  content: {
    padding: 10,
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.neutral500,
    marginTop: 2,
  },
  role: {
    fontSize: 13,
    color: AppColors.neutral400,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: AppColors.neutral400,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
