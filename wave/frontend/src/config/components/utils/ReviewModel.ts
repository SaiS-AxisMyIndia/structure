export type ReviewItem = {
  id: string;
  name: string;
  // Reviewer photo uri - optional, same convention as SkillItem.avatar
  // (RatingView falls back to a plain SvgIcons.profile placeholder circle
  // when absent).
  avatar?: string;
  // 0-5 - RatingView rounds this to the nearest whole star, same
  // convention StarRating's other callers use.
  rating: number;
  // Raw timestamp (ISO string or Date) - rendered via DateFormatter.smart(),
  // same convention JobTile/SchemeTile/ServiceTile/SkillTile already use
  // for their own "posted" time.
  date: string;
};

// Shape of each feature's own reviews endpoint (ProductDetailsRepo.
// fetchProductReviews, ServicesRepo.fetchServiceReviews, SkillDetailsRepo.
// fetchSkillReviews) - a separate call from the details fetch itself, not a
// field on ProductItem/ServiceItem/SkillItem.
export type ReviewsResult = {
  // Full review count on the backend - independent of reviews.length (this
  // call may only return a page of the most recent ones, same reasoning
  // RatingView's own reviewCount prop documents).
  totalReview: number;
  reviews: ReviewItem[];
};
