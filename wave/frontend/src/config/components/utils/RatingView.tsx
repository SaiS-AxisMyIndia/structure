import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { ImageLoader } from '../images/ImageLoader';
import { DateFormatter } from '../../utils/DateFormatter';
import { StarRating } from './StarRating';
import { ReviewItem } from './ReviewModel';

const AVATAR_SIZE = 40;

export type RatingViewProps = {
  // Overall average (0-5) shown beside "Reviews" in the header - a
  // details screen's own top-level `rating` field (ProductItem/ServiceItem/
  // SkillItem), not averaged from `reviews` - a real backend rating is
  // computed off every review ever left, not just the handful most recent
  // ones this list shows. Optional - SkillItem's own `rating` isn't always
  // set; the header just omits the stars when there's none to show.
  rating?: number | null;
  // Header count - e.g. "Reviews (1,202)" - independent of reviews.length
  // for the same reason as `rating` above. Defaults to reviews.length when
  // the caller's mock/real data has no separate total.
  reviewCount?: number;
  reviews: ReviewItem[];
};

function ReviewAvatar({ uri }: { uri?: string }) {
  if (uri) {
    return <ImageLoader source={{ uri }} style={styles.avatar} borderRadius={AVATAR_SIZE / 2} />;
  }
  // No reviewer photo - same placeholder-circle convention SkillTile's own
  // Avatar uses.
  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <SvgIcon icon={SvgIcons.profile} size={20} color={AppColors.neutral300} />
    </View>
  );
}

// A details-screen card - "Reviews (N)" + overall stars header, then one
// row per reviewer (avatar, name, their own star rating, date). Reused as-is
// by Product/Service/Skill details - each just passes its own `rating` and
// `reviews`.
export function RatingView({ rating, reviewCount, reviews }: RatingViewProps) {
  if (reviews.length === 0) {return null;}

  return (
    <View style={[styles.card, Themer.shadow(), Themer.iosRadius(12)]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Reviews <Text style={styles.count}>({(reviewCount ?? reviews.length).toLocaleString()})</Text>
        </Text>
        {rating != null && <StarRating rating={rating} size={16} />}
      </View>

      <View style={styles.list}>
        {reviews.map((review, index) => (
          <View key={review.id} style={[styles.row, index > 0 && styles.rowDivider]}>
            <ReviewAvatar uri={review.avatar} />
            <View style={styles.rowContent}>
              <Text style={styles.name} numberOfLines={1}>
                {review.name}
              </Text>
              <StarRating rating={review.rating} size={13} />
            </View>
            <Text style={styles.date}>{DateFormatter.smart(review.date)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  count: {
    fontSize: 13,
    fontWeight: '400',
    color: AppColors.neutral400,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarPlaceholder: {
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: AppColors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  date: {
    fontSize: 12,
    color: AppColors.neutral300,
  },
});
