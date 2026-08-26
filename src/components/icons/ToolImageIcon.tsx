import React from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { PhotoAiToolId } from '../../models/photoAiTool';
import { colors } from '../../constants/theme';

export const editToolIconSources: Partial<Record<PhotoAiToolId, ImageSourcePropType>> = {
  ai_coach: require('../../../assets/icons/ai-edit-tools/ai-coach-teal.png'),
  enhance_photo: require('../../../assets/icons/ai-edit-tools/enhance-photo.png'),
  better_composition: require('../../../assets/icons/ai-edit-tools/better-composition.png'),
  light_color: require('../../../assets/icons/ai-edit-tools/light-color.png'),
  restore_color: require('../../../assets/icons/ai-edit-tools/restore-color.png'),
  upscale: require('../../../assets/icons/ai-edit-tools/upscale.png'),
  background_boost: require('../../../assets/icons/ai-edit-tools/background-boost.png'),
  replace_background: require('../../../assets/icons/ai-edit-tools/replace-background.png'),
  remove_object: require('../../../assets/icons/ai-edit-tools/remove-object.png'),
  expand_frame: require('../../../assets/icons/ai-edit-tools/expand-frame.png'),
  smooth_skin: require('../../../assets/icons/ai-edit-tools/smooth-skin.png')
};

export function ToolImageIcon({
  id,
  size,
  fallbackColor = colors.primary
}: {
  id: PhotoAiToolId;
  size: number;
  fallbackColor?: string;
}) {
  const source = editToolIconSources[id];

  if (source) {
    return <Image source={source} style={{ height: size, width: size }} resizeMode="contain" />;
  }

  return <PhotoToolIcon id={id} color={fallbackColor} size={size} />;
}

export function PhotoToolIcon({ id, color, size }: { id: PhotoAiToolId; color: string; size: number }) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2.2
  };

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {id === 'ai_coach' ? (
        <>
          <Circle {...common} cx={12} cy={12} r={8} />
          <Path {...common} d="M12 7v5l3 2" />
        </>
      ) : id === 'better_composition' ? (
        <>
          <Rect {...common} height={16} rx={3} width={16} x={4} y={4} />
          <Path {...common} d="M9.3 4v16" />
          <Path {...common} d="M14.7 4v16" />
          <Path {...common} d="M4 9.3h16" />
          <Path {...common} d="M4 14.7h16" />
          <Circle {...common} cx={15} cy={9} r={2.1} />
        </>
      ) : id === 'light_color' ? (
        <>
          <Path {...common} d="M12 3v2" />
          <Path {...common} d="M12 19v2" />
          <Path {...common} d="M4.2 4.2l1.4 1.4" />
          <Path {...common} d="M18.4 18.4l1.4 1.4" />
          <Circle {...common} cx={12} cy={12} r={4} />
        </>
      ) : id === 'restore_color' ? (
        <>
          <Circle {...common} cx={9} cy={9} r={4} />
          <Circle {...common} cx={15} cy={9} r={4} />
          <Circle {...common} cx={12} cy={15} r={4} />
        </>
      ) : id === 'upscale' ? (
        <>
          <Path {...common} d="M4 14v6h6" />
          <Path {...common} d="M20 10V4h-6" />
          <Path {...common} d="M20 4l-7 7" />
          <Path {...common} d="M4 20l7-7" />
        </>
      ) : id === 'background_boost' ? (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M6 17l4-4 3 3 2-2 3 3" />
          <Path {...common} d="M8 9h.01" />
        </>
      ) : id === 'replace_background' ? (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M7 16c1.5-3 6.5-3 8 0" />
          <Path {...common} d="M9 10a3 3 0 0 0 6 0" />
        </>
      ) : id === 'remove_object' ? (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M8 8l8 8" />
          <Path {...common} d="M16 8l-8 8" />
        </>
      ) : id === 'expand_frame' ? (
        <>
          <Path {...common} d="M9 3H4v5" />
          <Path {...common} d="M15 3h5v5" />
          <Path {...common} d="M9 21H4v-5" />
          <Path {...common} d="M15 21h5v-5" />
          <Rect {...common} height={8} rx={2} width={8} x={8} y={8} />
        </>
      ) : id === 'smooth_skin' ? (
        <>
          <Circle {...common} cx={12} cy={9} r={4} />
          <Path {...common} d="M5 21c1.4-4 12.6-4 14 0" />
          <Path {...common} d="M17 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
        </>
      ) : (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M7 16l3-3 2 2 4-5 3 6" />
        </>
      )}
    </Svg>
  );
}
