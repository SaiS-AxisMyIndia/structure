export type ServiceItem = {
  id: string;
  // Matches Home's services category grid ids (plumber/electrician/
  // cleaner/driver/chef/maid - see CategoryGridModel.ts) so ServicesRepo
  // can filter by the `category` query param a Home card's route carries.
  category?: string;
  // True for a small subset of mock services so `?saved=true` (see
  // ServiceSearchController/ServiceSearchRepo) has something real to
  // filter to - same convention `category` follows for a category grid's
  // own `?category=...`.
  saved?: boolean;
  // Raw timestamp (ISO string or Date) - rendered via DateFormatter.smart(),
  // same convention JobTile/SchemeTile/SkillTile already use for their own
  // "posted" time.
  postedAt: string;
  // Hero photo of the provider/work, not a small icon - ServiceTile
  // renders this full-width, same convention SkillTile's image does.
  image: string;
  // 0-5 - ServiceTile rounds this to the nearest whole star, same
  // convention ProductCard's rating does.
  rating: number;
  // Shown as a small "Verified" pill beside the star rating when true,
  // nothing there otherwise - same "provider status" role JobTag/SchemeTag/
  // the old ServiceTag's VERIFIED_TAG played, just a plain boolean instead
  // of a whole tags[] array now that this card only ever shows this one.
  verified?: boolean;
  name: string;
  // Short label under the name - e.g. "Maid - Cleaner" - distinct from
  // `category` (the filter id, e.g. 'maid'), since this is display text,
  // not guaranteed to just be `category` capitalized, and can combine more
  // than one (a provider offering both maid and cleaning work).
  role: string;
  location: string;
  // Whether the current user has already reached out to this provider -
  // shown as a "Contacted" badge next to the share icon when true, nothing
  // there otherwise.
  contacted?: boolean;
};
