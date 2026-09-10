export type CategoryGridItem = {
  id: string;
  label: string;
  // From the repo/API (like TopFeatureItem.iconUrl), not a bundled SVG -
  // rendered on top of a gradient circle drawn in-app (see
  // CategoryGridCard), so it should be a white/transparent glyph.
  iconUrl: string;
  route?: string;
};

export type CategoryGridSection = {
  id: string;
  title: string;
  items: CategoryGridItem[];
  count: number;
  countLabel: string;
  // "More" destination for the whole section.
  route?: string;
};
