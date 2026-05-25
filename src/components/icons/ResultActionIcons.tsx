import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

interface IconProps {
  size?: number;
  color: string;
}

/** Outline camera — avoids @expo/vector-icons / expo-font native modules (Expo Go safe). */
export function CameraOutlineIcon({ size = 26, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Outline download arrow — same rationale as {@link CameraOutlineIcon}. */
export function DownloadOutlineIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="7 10 12 15 17 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={12} y1={15} x2={12} y2={3} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="15 18 9 12 15 6"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShareOutlineIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={3} fill="none" stroke={color} strokeWidth={2} />
      <Circle cx={6} cy={12} r={3} fill="none" stroke={color} strokeWidth={2} />
      <Circle cx={18} cy={19} r={3} fill="none" stroke={color} strokeWidth={2} />
      <Line x1="8.6" y1="10.6" x2="15.4" y2="7.4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="8.6" y1="13.4" x2="15.4" y2="16.6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function MoreHorizontalIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={12} r={1.75} fill={color} />
      <Circle cx={12} cy={12} r={1.75} fill={color} />
      <Circle cx={19} cy={12} r={1.75} fill={color} />
    </Svg>
  );
}
