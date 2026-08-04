import React, { useEffect, useId, useState } from 'react';
import { Image, ImageSourcePropType, Platform } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';

export type SvgIconProps = {
  icon: ImageSourcePropType;
  size?: number;
  color?: (typeof AppColors)[keyof typeof AppColors];
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// SVG `id`s (gradient/clip-path/mask defs) live in one global namespace per
// document. Two mounted instances of the same icon file - e.g. a tab
// navigator keeping inactive tabs' bottom bars mounted - collide, and the
// browser resolves `url(#id)` to whichever element won, breaking the other
// instance's fill. Native SVG rendering has no shared DOM, so this never
// happens there. Namespacing every id with a per-instance suffix fixes it.
function namespaceSvgIds(svgText: string, suffix: string): string {
  const ids = new Set<string>();
  const idPattern = /\bid="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = idPattern.exec(svgText))) {
    ids.add(match[1]);
  }

  let result = svgText;
  ids.forEach(id => {
    const escapedId = escapeRegExp(id);
    const namespacedId = `${id}-${suffix}`;
    result = result
      .replace(new RegExp(`id="${escapedId}"`, 'g'), `id="${namespacedId}"`)
      .replace(new RegExp(`url\\(#${escapedId}\\)`, 'g'), `url(#${namespacedId})`)
      .replace(new RegExp(`href="#${escapedId}"`, 'g'), `href="#${namespacedId}"`);
  });
  return result;
}

// The source files carry their own fixed `width`/`height` (e.g. 24x24); the
// caller's `size` prop should win, same as it does for SvgUri/Image.
function resizeRootSvg(svgText: string, size: number): string {
  return svgText.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    const withoutSize = attrs.replace(/\s(?:width|height)="[^"]*"/g, '');
    return `<svg${withoutSize} width="${size}" height="${size}">`;
  });
}

function WebSvgIcon({ uri, size, color }: { uri: string; size: number; color?: string }) {
  const instanceId = useId();
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(uri)
      .then(res => res.text())
      .then(text => {
        if (!cancelled) setXml(resizeRootSvg(namespaceSvgIds(text, instanceId), size));
      });
    return () => {
      cancelled = true;
    };
  }, [uri, instanceId, size]);

  if (!xml) return null;
  return (
    <div
      style={{ width: size, height: size, color, display: 'inline-block', lineHeight: 0 }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: xml }}
    />
  );
}

export function SvgIcon({ icon, size = 24, color }: SvgIconProps) {
  if (Platform.OS === 'web') {
    // On web, webpack's asset/resource loader resolves an `.svg` import
    // directly to a URL string; Metro's native asset registry
    // (Image.resolveAssetSource) only applies to the numeric asset ids
    // Metro produces for iOS/Android.
    return <WebSvgIcon uri={icon as unknown as string} size={size} color={color} />;
  }
  const { uri } = Image.resolveAssetSource(icon);
  return <SvgUri uri={uri} width={size} height={size} color={color} />;
}
