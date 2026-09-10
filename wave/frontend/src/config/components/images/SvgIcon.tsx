import React, { useEffect, useId, useState } from 'react';
import { Platform, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { SvgProps } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';

export type SvgIconGradient = {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
};

export type SvgIconProps = {
  // Native: a real react-native-svg component, compiled at build time by
  // react-native-svg-transformer (see metro.config.js). Web: actually a
  // plain URL string at runtime (webpack's asset/resource rule) - the web
  // branch below casts around that mismatch, same as before.
  icon: React.ComponentType<SvgProps>;
  size?: number;
  // Independent overrides for a non-square icon (e.g. NeedsPromoCard's
  // wide ill_needs_bg illustration) - each defaults to `size` when omitted,
  // so every existing square-icon call site is unaffected.
  width?: number;
  height?: number;
  color?: (typeof AppColors)[keyof typeof AppColors];
  // Fills the icon's silhouette with a gradient instead of a flat color -
  // takes precedence over `color` when both are passed (e.g.
  // TopFeatureCard's category icons - a gradient-filled glyph, no
  // background circle). Same gradient shape Themer.primaryGradient/etc
  // already use elsewhere.
  gradient?: SvgIconGradient;
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
// caller's own width/height should win, same as it does for SvgUri/Image.
function resizeRootSvg(svgText: string, width: number, height: number): string {
  return svgText.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    const withoutSize = attrs.replace(/\s(?:width|height)="[^"]*"/g, '');
    return `<svg${withoutSize} width="${width}" height="${height}">`;
  });
}

function WebSvgIcon({
  uri,
  width,
  height,
  color,
  gradient,
}: {
  uri: string;
  width: number;
  height: number;
  color?: string;
  gradient?: SvgIconGradient;
}) {
  const instanceId = useId();
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(uri)
      .then(res => res.text())
      .then(text => {
        if (!cancelled) {setXml(resizeRootSvg(namespaceSvgIds(text, instanceId), width, height));}
      });
    return () => {
      cancelled = true;
    };
  }, [uri, instanceId, width, height]);

  if (!xml) {return null;}

  if (color || gradient) {
    // A real mask, not a currentColor bet: some source SVGs bake their own
    // fixed fill/gradient (ic_products, ic_skills, ic_close,
    // ic_chevron_right, ...) instead of using currentColor, so setting
    // `color` as a CSS property - like the uncolored branch below does -
    // does nothing for them. mask-image only cares about the rendered
    // SVG's alpha (its silhouette), never its fill, so this paints
    // `color`/`gradient` through that silhouette regardless of how the
    // source is filled - the same result @react-native-masked-view's
    // MaskedView gives natively, since its own web shim (js/MaskedView.
    // web.js) is a no-op that renders maskElement unmasked and drops the
    // mask content.
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    return (
      <div
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width,
          height,
          display: 'inline-block',
          // CSS `background` (a gradient) when gradient-filled, plain
          // `backgroundColor` otherwise - same approach, just what's
          // painted through the mask differs.
          ...(gradient ? { background: `linear-gradient(135deg, ${gradient.colors.join(', ')})` } : { backgroundColor: color }),
          WebkitMaskImage: `url("${dataUri}")`,
          maskImage: `url("${dataUri}")`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    );
  }

  return (
    // Raw DOM element (web-only branch), not an RN View - style is a plain
    // CSSProperties object here, not something StyleSheet.create applies
    // to, and width/height are genuinely per-instance props, so there's no
    // static object to extract this into.
    <div
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ width, height, display: 'inline-block', lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: xml }}
    />
  );
}

function renderRawIcon(Icon: SvgIconProps['icon'], width: number, height: number, color?: string, gradient?: SvgIconGradient) {
  if (Platform.OS === 'web') {
    // On web, webpack's asset/resource loader resolves an `.svg` import
    // directly to a URL string; the native branch below (a compiled
    // react-native-svg component) doesn't apply here.
    return <WebSvgIcon uri={Icon as unknown as string} width={width} height={height} color={color} gradient={gradient} />;
  }
  // Filter primitives (feGaussianBlur/feColorMatrix/feBlend/... - the chain
  // Figma exports for a drop shadow) are stripped from every icon at build
  // time (see .svgrrc.json's removeAttrs plugin, and metro.config.js).
  // react-native-svg's filter support is Fabric-native and, at least for
  // the combination this app ships (ill_hospital2.svg wraps its *entire*
  // illustration in one filtered <g>), a filtered group renders nothing
  // on-device instead of falling back to unfiltered - the whole graphic
  // would disappear rather than just lose its shadow.
  return <Icon width={width} height={height} color={color} />;
}

export function SvgIcon({ icon: Icon, size = 24, width, height, color, gradient }: SvgIconProps) {
  const w = width ?? size;
  const h = height ?? size;
  const rendered = renderRawIcon(Icon, w, h, color, gradient);

  // Some source SVGs bake their own fixed fill/gradient (e.g. ic_products,
  // ic_skills, ic_close, ic_chevron_right) instead of using `currentColor`,
  // so passing `color` straight through to the underlying element does
  // nothing for them. Masking forces `color`/`gradient` to always win by
  // painting through the icon's silhouette, regardless of how the source
  // SVG itself is filled.
  //
  // @react-native-masked-view's web shim just renders `maskElement`
  // directly and drops the masked content entirely (see its
  // MaskedView.web.js) - so it can't do this job on web. `rendered` is
  // already correctly masked on web at this point though: it's a
  // WebSvgIcon (see renderRawIcon above), which does its own CSS
  // mask-image-based masking when `color`/`gradient` is set. Only skip
  // *this* (native-only) MaskedView on web, not masking altogether.
  if (Platform.OS === 'web') {return rendered;}

  if (gradient) {
    return (
      <MaskedView maskElement={rendered}>
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start ?? { x: 0, y: 0 }}
          end={gradient.end ?? { x: 1, y: 1 }}
          locations={gradient.locations}
          style={{ width: w, height: h }}
        />
      </MaskedView>
    );
  }

  if (!color) {return rendered;}

  return (
    <MaskedView maskElement={rendered}>
      <View style={{ width: w, height: h, backgroundColor: color }} />
    </MaskedView>
  );
}
